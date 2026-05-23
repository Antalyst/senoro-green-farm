import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, total_amount, status, created_at, delivery_rider_id, buyer_id,
      addresses(id, full_name, phone_number, city, barangay, detailed_address),
      delivery_rider:users!delivery_rider_id(id, full_name, email),
      order_items(
        id, quantity, price,
        products(id, name, category, image_url, seller_id)
      )
    `)
    .eq('id', id)
    .eq('buyer_id', user.id)
    .maybeSingle()

  if (error || !order) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  return { order }
})
