import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../../utils/auth'

// Buyer cancels their own order while no shop has been paid yet (see buyerCancelBlock).
// Body: { reason? } (optional, up to 200 characters, shown to the shops).
// Puts the stock back and tells the shops and the rider (if one accepted).
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Only the buyer can cancel this order.' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Order ID required.' })

  const body = await readBody(event).catch(() => ({}))
  const reason = String(body?.reason ?? '').trim().replace(/\s+/g, ' ').slice(0, 200) || null

  const supabase = await serverSupabaseClient(event)

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, buyer_id, delivery_rider_id')
    .eq('id', id)
    .eq('buyer_id', user.id)
    .maybeSingle()
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found.' })

  const payments = (await fetchOrderPayments(supabase, [id])).get(id) ?? []
  const blocked = buyerCancelBlock(order, payments)
  if (blocked) throw createError({ statusCode: 400, statusMessage: blocked })

  // Conditional update: only while still pending (a shop may have just accepted).
  const now = new Date().toISOString()
  let { data: cancelled, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', cancelled_at: now, cancel_reason: reason })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  // Database without migration 017: cancel without the reason columns.
  if (error && (error.code === 'PGRST204' || error.code === '42703' || /cancel/.test(error.message ?? ''))) {
    ;({ data: cancelled, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle())
  }

  if (error) throw createError({ statusCode: 500, statusMessage: 'Failed to cancel the order.' })
  if (!cancelled) {
    throw createError({ statusCode: 409, statusMessage: 'This order changed and can no longer be cancelled. Refresh the page.' })
  }

  // Put the stock back (deleted products are skipped).
  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, seller_id, quantity')
    .eq('order_id', id)

  const qtyByProduct = new Map<string, number>()
  for (const item of items ?? []) {
    if (item.product_id) qtyByProduct.set(item.product_id, (qtyByProduct.get(item.product_id) ?? 0) + Number(item.quantity))
  }
  if (qtyByProduct.size) {
    const { data: products } = await supabase.from('products').select('id, stock').in('id', [...qtyByProduct.keys()])
    for (const product of products ?? []) {
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: Number(product.stock) + (qtyByProduct.get(product.id) ?? 0) })
        .eq('id', product.id)
      if (stockError) console.error('[cancel] stock restore failed:', product.id, stockError.message)
    }
  }

  // Tell the shops and the rider.
  const shortId = id.slice(0, 8).toUpperCase()
  const why = reason ? ` Reason: ${reason.length > 60 ? `${reason.slice(0, 57)}...` : reason}` : ''
  const sellerIds = [...new Set((items ?? []).map(i => i.seller_id).filter(Boolean))] as string[]
  await notify(event, [
    ...sellerIds.map(sellerId => ({
      user_id: sellerId,
      order_id: id,
      title: 'Order Cancelled ❌',
      message: `The buyer cancelled order #${shortId}. Do not prepare it.${why}`,
    })),
    ...(order.delivery_rider_id
      ? [{
          user_id: order.delivery_rider_id,
          order_id: id,
          title: 'Job Cancelled ❌',
          message: `The buyer cancelled order #${shortId}. You don't need to pay or pick it up.`,
        }]
      : []),
  ])

  return { success: true, order_id: id, status: 'cancelled' }
})
