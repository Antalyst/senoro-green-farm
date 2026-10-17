import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, total_amount, status, created_at, delivery_rider_id,
      addresses(id, full_name, phone_number, city, barangay, detailed_address),
      delivery_rider:users!delivery_rider_id(id, full_name, email),
      order_items(
        *,
        products(id, name, category, image_url)
      )
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch orders' })
  }

  return { orders: orders ?? [] }
})
