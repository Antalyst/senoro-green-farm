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
    products(id, name),
    users!seller_id(id, full_name, shop_name, shop_avatar_url)
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

  const mapOrder = (order: any) => {
    const shopsMap = new Map<string, { id: string; shop_name: string; shop_avatar_url: string | null }>()
    for (const item of order.order_items ?? []) {
      const seller = item.users
      if (seller && seller.id) {
        shopsMap.set(seller.id, {
          id: seller.id,
          shop_name: seller.shop_name || seller.full_name || 'Market Seller',
          shop_avatar_url: seller.shop_avatar_url || null,
        })
      }
    }
    return {
      ...order,
      shops: Array.from(shopsMap.values()),
    }
  }

  return {
    pickup_queue: (pickupResult.data ?? []).map(mapOrder),
    active_deliveries: (activeResult.data ?? []).map(mapOrder),
  }
})
