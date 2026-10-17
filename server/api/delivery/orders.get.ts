import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

// order_items(*) includes picked_up_at once migration 012 is applied, without failing before it.
const ORDER_SELECT = `
  id,
  total_amount,
  status,
  created_at,
  buyer_id,
  delivery_rider_id,
  addresses(*),
  order_items(
    *,
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
    // Jobs nobody has accepted yet
    supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('status', 'ready_for_pickup')
      .is('delivery_rider_id', null)
      .order('created_at', { ascending: true }),
    // My jobs: accepted (going to the shops) and on the way to the buyer
    supabase
      .from('orders')
      .select(ORDER_SELECT)
      .in('status', ['ready_for_pickup', 'out_for_delivery'])
      .eq('delivery_rider_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  if (pickupResult.error || activeResult.error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch delivery orders' })
  }

  // Pickup pins for every shop in these orders (one query; empty before migration 010).
  const allOrders = [...(pickupResult.data ?? []), ...(activeResult.data ?? [])] as any[]
  const sellerIds = [...new Set(allOrders.flatMap(o => (o.order_items ?? []).map((i: any) => i.users?.id)).filter(Boolean))] as string[]
  const shopLocations = await fetchShopLocations(supabase, sellerIds)

  const mapOrder = (order: any) => {
    const shopsMap = new Map<string, {
      id: string
      shop_name: string
      shop_avatar_url: string | null
      shop_latitude: number | null
      shop_longitude: number | null
      shop_address: string | null
      picked_up: boolean
    }>()
    for (const item of order.order_items ?? []) {
      const seller = item.users
      if (seller && seller.id) {
        // A shop is picked up when all its items have picked_up_at (set by the QR scan).
        const shopItems = (order.order_items ?? []).filter((i: any) => i.users?.id === seller.id)
        const location = shopLocations.get(seller.id)
        shopsMap.set(seller.id, {
          id: seller.id,
          shop_name: seller.shop_name || seller.full_name || 'Market Seller',
          shop_avatar_url: seller.shop_avatar_url || null,
          shop_latitude: location?.shop_latitude ?? null,
          shop_longitude: location?.shop_longitude ?? null,
          shop_address: location?.shop_address ?? null,
          picked_up: shopItems.every((i: any) => !!i.picked_up_at),
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
