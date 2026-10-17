import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../../utils/auth'

// Printable receipt for this seller's package of an order, with the signed pickup QR.
// Available after the seller marked their items ready.
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Order ID required' })

  const supabase = await serverSupabaseClient(event)

  const [{ data: order }, { data: items }, { data: shop }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, status, created_at, addresses(full_name, phone_number, barangay, city, detailed_address), delivery_rider:users!delivery_rider_id(full_name)')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('order_items')
      .select('quantity, price, is_confirmed, products(name)')
      .eq('order_id', id)
      .eq('seller_id', user.id),
    supabase
      .from('users')
      .select('shop_name, full_name')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  if (!order || !items?.length) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }
  if (!items.every(i => i.is_confirmed)) {
    throw createError({ statusCode: 400, statusMessage: 'Mark the order ready for pickup first.' })
  }
  if (!['processing', 'ready_for_pickup', 'out_for_delivery', 'delivered'].includes(order.status)) {
    throw createError({ statusCode: 400, statusMessage: `Order is ${order.status}.` })
  }

  const o = order as any
  const lines = items.map((i: any) => ({
    name: i.products?.name ?? 'Item',
    quantity: Number(i.quantity),
    price: Number(i.price),
    line_total: Number(i.price) * Number(i.quantity),
  }))

  return {
    receipt: {
      order_id: o.id,
      short_id: o.id.slice(0, 8).toUpperCase(),
      created_at: o.created_at,
      status: o.status,
      shop_name: shop?.shop_name || shop?.full_name || 'Shop',
      recipient: o.addresses ?? null,
      rider_name: o.delivery_rider?.full_name ?? null,
      items: lines,
      item_count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal: lines.reduce((s, l) => s + l.line_total, 0),
      pickup_code: displayCode(pickupCode(o.id, user.id)),
      qr_payload: pickupQrPayload(o.id, user.id),
    },
  }
})
