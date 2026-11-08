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
    // Jobs nobody has accepted yet. Ready orders, plus new orders that have a COD shop
    // (those need a rider first, who pays the COD shop before it accepts).
    supabase
      .from('orders')
      .select(ORDER_SELECT)
      .in('status', ['pending', 'processing', 'ready_for_pickup'])
      .is('delivery_rider_id', null)
      .order('created_at', { ascending: true }),
    // My jobs: accepted (paying shops / waiting for packing / going to the shops) and on the way
    supabase
      .from('orders')
      .select(ORDER_SELECT)
      .in('status', ['pending', 'processing', 'ready_for_pickup', 'out_for_delivery'])
      .eq('delivery_rider_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  if (pickupResult.error || activeResult.error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch delivery orders' })
  }

  const openOrders = (pickupResult.data ?? []) as any[]
  const openPayments = await fetchOrderPayments(supabase, openOrders.filter(o => o.status !== 'ready_for_pickup').map(o => o.id))
  // Not-yet-ready orders are only offered when they have a COD shop.
  const queue = openOrders.filter(o => o.status === 'ready_for_pickup' || hasCodPayment(openPayments.get(o.id)))

  // Pickup pins for every shop in these orders (one query; empty before migration 010).
  const allOrders = [...queue, ...(activeResult.data ?? [])] as any[]
  const sellerIds = [...new Set(allOrders.flatMap(o => (o.order_items ?? []).map((i: any) => i.users?.id)).filter(Boolean))] as string[]
  const [shopLocations, payments] = await Promise.all([
    fetchShopLocations(supabase, sellerIds),
    fetchOrderPayments(supabase, allOrders.map(o => o.id)),
  ])

  const mapOrder = (order: any) => {
    const orderPayments = payments.get(order.id) ?? []
    const shopsMap = new Map<string, {
      id: string
      shop_name: string
      shop_avatar_url: string | null
      shop_latitude: number | null
      shop_longitude: number | null
      shop_address: string | null
      picked_up: boolean
      /** 'online' = buyer already paid the shop; 'cod' = rider pays the shop at pickup. */
      payment_method: 'online' | 'cod' | null
      /** Amount the rider pays this shop (0 when paid online). */
      pay_shop: number
      rider_paid: boolean
      /** COD payment is waiting: 'cod_unpaid' | 'submitted' | 'rejected' | 'rider_paid'. */
      payment_status: string | null
      /** The shop marked its items ready (packed + receipt printed). */
      ready: boolean
    }>()
    for (const item of order.order_items ?? []) {
      const seller = item.users
      if (seller && seller.id) {
        // A shop is picked up when all its items have picked_up_at (set by the QR scan).
        const shopItems = (order.order_items ?? []).filter((i: any) => i.users?.id === seller.id)
        const location = shopLocations.get(seller.id)
        const payment = orderPayments.find(p => p.seller_id === seller.id)
        // No payment row = order from before online payment (migration 017): nothing for the rider to pay.
        const method = (payment?.method ?? null) as 'online' | 'cod' | null
        shopsMap.set(seller.id, {
          id: seller.id,
          shop_name: seller.shop_name || seller.full_name || 'Market Seller',
          shop_avatar_url: seller.shop_avatar_url || null,
          shop_latitude: location?.shop_latitude ?? null,
          shop_longitude: location?.shop_longitude ?? null,
          shop_address: location?.shop_address ?? null,
          picked_up: shopItems.every((i: any) => !!i.picked_up_at),
          payment_method: method,
          pay_shop: method === 'cod' ? Math.round(payment!.amount * 100) / 100 : 0,
          rider_paid: method === 'cod' && payment?.status === 'rider_paid',
          payment_status: payment?.status ?? null,
          ready: shopItems.every((i: any) => !!i.is_confirmed),
        })
      }
    }
    const shops = Array.from(shopsMap.values())
    const paidOnline = orderPayments.filter(p => p.method === 'online').reduce((sum, p) => sum + p.amount, 0)
    return {
      ...order,
      shops,
      // Cash the rider pays out at the shops, and collects from the buyer (COD items + delivery fee).
      pay_shops_total: Math.round(shops.reduce((sum, s) => sum + s.pay_shop, 0) * 100) / 100,
      collect_from_buyer: Math.round((Number(order.total_amount) - paidOnline) * 100) / 100,
    }
  }

  return {
    pickup_queue: queue.map(mapOrder),
    active_deliveries: (activeResult.data ?? []).map(mapOrder),
  }
})
