import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

// Rider scans a QR (or types its code) for an order assigned to them.
// - ready_for_pickup: shop receipt QR -> marks that shop's items picked up;
//   when all shops are picked up the order becomes out_for_delivery.
// - out_for_delivery: buyer's QR -> order becomes delivered.
// Body: { order_id, payload?: scanned QR text, code?: typed 8-char code }
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'delivery') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — delivery only' })
  }

  const body = await readBody(event)
  const orderId = String(body?.order_id ?? '')
  const scan = body?.payload ? parseHandoffPayload(body.payload) : null
  const typedCode = normalizeCode(body?.code)

  if (!orderId) throw createError({ statusCode: 400, statusMessage: 'order_id is required' })
  if (body?.payload && !scan) throw createError({ statusCode: 400, statusMessage: 'This is not an NFWM order QR code.' })
  if (!scan && typedCode.length !== 8) throw createError({ statusCode: 400, statusMessage: 'Enter the 8-character code.' })
  if (scan && scan.orderId !== orderId) throw createError({ statusCode: 400, statusMessage: 'This QR belongs to a different order.' })

  const supabase = await serverSupabaseClient(event)

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, buyer_id, delivery_rider_id')
    .eq('id', orderId)
    .maybeSingle()

  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  if (!order.delivery_rider_id) throw createError({ statusCode: 403, statusMessage: 'Accept this job first.' })
  if (order.delivery_rider_id !== user.id) throw createError({ statusCode: 403, statusMessage: 'This order is assigned to another rider.' })

  // ---------- Pickup at the shop ----------
  if (order.status === 'ready_for_pickup') {
    if (scan?.type === 'delivery') {
      throw createError({ statusCode: 400, statusMessage: 'That is the buyer\'s QR. Scan the shop receipt first.' })
    }

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('id, seller_id, picked_up_at, users!seller_id(shop_name, full_name)')
      .eq('order_id', orderId)

    if (isMissingPickupColumn(itemsError)) {
      throw createError({ statusCode: 503, statusMessage: 'QR pickup needs a database update (migration 012).' })
    }
    if (itemsError || !items?.length) throw createError({ statusCode: 500, statusMessage: 'Failed to load order items' })

    const sellerIds = [...new Set(items.map(i => i.seller_id).filter(Boolean))] as string[]
    const sellerId = scan?.type === 'pickup'
      ? (codesMatch(scan.code, pickupCode(orderId, scan.sellerId)) && sellerIds.includes(scan.sellerId) ? scan.sellerId : null)
      : sellerIds.find(id => codesMatch(typedCode, pickupCode(orderId, id))) ?? null

    if (!sellerId) throw createError({ statusCode: 400, statusMessage: 'Invalid pickup code for this order.' })

    const shopRow = items.find(i => i.seller_id === sellerId) as any
    const shopName = shopRow?.users?.shop_name || shopRow?.users?.full_name || 'Shop'
    const alreadyScanned = items.filter(i => i.seller_id === sellerId).every(i => i.picked_up_at)

    if (!alreadyScanned) {
      const { error } = await supabase
        .from('order_items')
        .update({ picked_up_at: new Date().toISOString() })
        .eq('order_id', orderId)
        .eq('seller_id', sellerId)
        .is('picked_up_at', null)
      if (error) throw createError({ statusCode: 500, statusMessage: 'Failed to record pickup' })
    }

    const remainingShops = new Set(
      items.filter(i => i.seller_id !== sellerId && !i.picked_up_at).map(i => i.seller_id),
    ).size

    if (remainingShops === 0) {
      const { data: moved } = await supabase
        .from('orders')
        .update({ status: 'out_for_delivery' })
        .eq('id', orderId)
        .eq('status', 'ready_for_pickup')
        .select('id')
        .maybeSingle()

      if (moved && order.buyer_id) {
        await notify(event, [{
          user_id: order.buyer_id,
          order_id: orderId,
          title: 'Order is On the Way! 🚀',
          message: 'Your rider picked up your order. Show your delivery QR when it arrives.',
        }])
      }
    }

    return {
      stage: 'pickup',
      shop_name: shopName,
      already_scanned: alreadyScanned,
      remaining_shops: remainingShops,
      order_status: remainingShops === 0 ? 'out_for_delivery' : 'ready_for_pickup',
    }
  }

  // ---------- Delivery at the buyer ----------
  if (order.status === 'out_for_delivery') {
    if (scan?.type === 'pickup') {
      throw createError({ statusCode: 400, statusMessage: 'That is a shop receipt. Scan the QR on the buyer\'s phone.' })
    }
    const code = scan?.type === 'delivery' ? scan.code : typedCode
    if (!codesMatch(code, deliveryCode(orderId))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid delivery code for this order.' })
    }

    const { data: done } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', orderId)
      .eq('status', 'out_for_delivery')
      .select('id')
      .maybeSingle()

    if (done && order.buyer_id) {
      await notify(event, [{
        user_id: order.buyer_id,
        order_id: orderId,
        title: 'Order Delivered! 🎉',
        message: 'Enjoy your fresh farm items! Thank you for ordering from NFWM.',
      }])
    }

    return { stage: 'delivery', order_status: 'delivered' }
  }

  throw createError({ statusCode: 400, statusMessage: `Order is ${order.status.replace(/_/g, ' ')}; nothing to scan.` })
})

function isMissingPickupColumn(error: { code?: string; message?: string } | null) {
  return !!error && (error.code === '42703' || /picked_up_at/.test(error.message ?? ''))
}
