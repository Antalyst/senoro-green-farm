import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID required' })
  }

  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, total_amount, status, created_at, delivery_rider_id, buyer_id,
      addresses(id, full_name, phone_number, city, barangay, detailed_address),
      delivery_rider:users!delivery_rider_id(id, full_name, email),
      order_items(
        *,
        products(id, name, category, image_url, seller_id),
        seller:users!seller_id(id, shop_name, full_name, shop_avatar_url)
      )
    `)
    .eq('id', id)
    .eq('buyer_id', user.id)
    .maybeSingle()

  if (error || !order) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  // Proof of delivery: the buyer shows this QR; the rider scans it to complete the order.
  const delivery_qr = order.status === 'out_for_delivery'
    ? { payload: deliveryQrPayload(order.id), code: displayCode(deliveryCode(order.id)) }
    : null

  return { order: { ...order, delivery_qr } }
})
