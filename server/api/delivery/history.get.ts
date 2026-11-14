import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

// Rider's order history: finished jobs (delivered or cancelled) this rider accepted, newest first.
// orders(*) includes delivery_fee / delivered_at / cancelled_at once migrations 017 and 018 are run,
// without failing before them.
const HISTORY_SELECT = `
  *,
  addresses(full_name, city, barangay),
  order_items(seller_id, quantity, product_name, users!seller_id(shop_name, full_name))
`

const LIMIT = 200

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'delivery') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — delivery only' })
  }

  const supabase = await serverSupabaseClient(event)
  const { data, error } = await supabase
    .from('orders')
    .select(HISTORY_SELECT)
    .eq('delivery_rider_id', user.id)
    .in('status', ['delivered', 'cancelled'])
    .order('created_at', { ascending: false })
    .limit(LIMIT)

  if (error) {
    console.error('[delivery/history]', error.message)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load your order history' })
  }

  const orders = (data ?? []).map((order: any) => {
    const items = order.order_items ?? []
    const shops = [...new Set(items.map((i: any) => i.users?.shop_name || i.users?.full_name || 'Shop'))] as string[]
    return {
      id: order.id,
      status: order.status as 'delivered' | 'cancelled',
      created_at: order.created_at,
      // Orders delivered before migration 018 have no delivered time.
      finished_at: order.status === 'delivered' ? order.delivered_at ?? null : order.cancelled_at ?? null,
      total_amount: Number(order.total_amount ?? 0),
      delivery_fee: order.delivery_fee == null ? null : Number(order.delivery_fee),
      buyer_name: order.addresses?.full_name ?? null,
      area: [order.addresses?.barangay, order.addresses?.city].filter(Boolean).join(', ') || null,
      shops,
      item_count: items.reduce((sum: number, i: any) => sum + Number(i.quantity ?? 0), 0),
    }
  })

  const delivered = orders.filter(o => o.status === 'delivered')
  // Start of this month in Philippine time (UTC+8), whatever the server's time zone is.
  const PH_OFFSET_MS = 8 * 60 * 60 * 1000
  const phNow = new Date(Date.now() + PH_OFFSET_MS)
  const monthStart = new Date(Date.UTC(phNow.getUTCFullYear(), phNow.getUTCMonth(), 1) - PH_OFFSET_MS)

  return {
    orders,
    summary: {
      delivered: delivered.length,
      cancelled: orders.length - delivered.length,
      delivered_this_month: delivered.filter(o => new Date(o.finished_at ?? o.created_at) >= monthStart).length,
      // Delivery fees the rider collected at the door (orders from before migration 017 have none).
      fees_earned: Math.round(delivered.reduce((sum, o) => sum + (o.delivery_fee ?? 0), 0) * 100) / 100,
    },
    limited: orders.length === LIMIT,
  }
})
