import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { formatMonthLabels, getLastMonthKeys, monthKeyFromIso } from '../../utils/chartMonths'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: items, error } = await supabase
    .from('order_items')
    .select('price, quantity, created_at, order_id')
    .eq('seller_id', user.id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch metrics' })
  }

  const rows = items ?? []
  const totalRevenue = rows.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)
  const uniqueOrders = new Set(rows.map(i => i.order_id).filter(Boolean)).size

  const monthKeys = getLastMonthKeys(6)
  const revenueByMonth = new Map(monthKeys.map(k => [k, 0]))
  const orderIdsByMonth = new Map(monthKeys.map(k => [k, new Set<string>()]))

  for (const item of rows) {
    const key = monthKeyFromIso(item.created_at)
    if (!key || !revenueByMonth.has(key)) continue

    revenueByMonth.set(
      key,
      (revenueByMonth.get(key) ?? 0) + Number(item.price) * Number(item.quantity),
    )

    if (item.order_id) {
      orderIdsByMonth.get(key)?.add(item.order_id)
    }
  }

  const chart = {
    categories: formatMonthLabels(monthKeys),
    revenue: monthKeys.map(k => revenueByMonth.get(k) ?? 0),
    orderCount: monthKeys.map(k => orderIdsByMonth.get(k)?.size ?? 0),
  }

  return {
    totalRevenue,
    totalOrders: uniqueOrders,
    items: rows,
    chart,
  }
})
