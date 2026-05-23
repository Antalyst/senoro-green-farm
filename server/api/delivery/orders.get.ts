import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

const ORDER_SELECT = `
  id,
  total_amount,
  status,
  created_at,
  buyer_id,
  delivery_rider_id,
  addresses(
    id, full_name, phone_number, city, barangay, detailed_address
  ),
  order_items(
    id, quantity, price,
    products(id, name)
  ),
  users:buyer_id(id, full_name, email)
`

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'delivery') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — delivery only' })
  }

  const supabase = await serverSupabaseClient(event)

  const [pickupResult, activeResult] = await Promise.all([
    supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('status', 'ready_for_pickup')
      .order('created_at', { ascending: true }),
    supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('status', 'out_for_delivery')
      .eq('delivery_rider_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  if (pickupResult.error || activeResult.error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch delivery orders' })
  }

  return {
    pickup_queue: pickupResult.data ?? [],
    active_deliveries: activeResult.data ?? [],
  }
})
