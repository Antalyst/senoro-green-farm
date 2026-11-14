import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { formatMonthLabels, getLastMonthKeys, monthKeyFromIso } from '../../utils/chartMonths'
import { buildSalesReports } from '../../utils/salesPeriods'

// Seller sales numbers. Cancelled orders are not counted as revenue.
// `reports` has Day / Week / Month / Year revenue and order counts (Philippine time) for the
// dashboard's sales report switch; `chart` (last 6 months) is kept for older app versions.
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: items, error } = await supabase
    .from('order_items')
    .select('price, quantity, created_at, order_id, orders!inner(status)')
    .eq('seller_id', user.id)
    .neq('orders.status', 'cancelled')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch metrics' })
  }

  const rows = (items ?? []).map(({ orders: _order, ...item }) => item)
  const lineAmount = (item: { price: unknown; quantity: unknown }) => Number(item.price) * Number(item.quantity)

  const totalRevenue = Math.round(rows.reduce((sum, item) => sum + lineAmount(item), 0) * 100) / 100
  const uniqueOrders = new Set(rows.map(i => i.order_id).filter(Boolean)).size

  const monthKeys = getLastMonthKeys(6)
  const revenueByMonth = new Map(monthKeys.map(k => [k, 0]))
  const orderIdsByMonth = new Map(monthKeys.map(k => [k, new Set<string>()]))

  for (const item of rows) {
    const key = monthKeyFromIso(item.created_at)
    if (!key || !revenueByMonth.has(key)) continue
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + lineAmount(item))
    if (item.order_id) orderIdsByMonth.get(key)?.add(item.order_id)
  }

  return {
    totalRevenue,
    totalOrders: uniqueOrders,
    items: rows.slice(0, 20),
    chart: {
      categories: formatMonthLabels(monthKeys),
      revenue: monthKeys.map(k => revenueByMonth.get(k) ?? 0),
      orderCount: monthKeys.map(k => orderIdsByMonth.get(k)?.size ?? 0),
    },
    reports: buildSalesReports(rows.map(item => ({
      order_id: item.order_id,
      created_at: item.created_at,
      amount: lineAmount(item),
    }))),
  }
})
