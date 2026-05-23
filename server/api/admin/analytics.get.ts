import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { formatMonthLabels, getLastMonthKeys, monthKeyFromIso } from '../../utils/chartMonths'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — admin only' })
  }

  const supabase = await serverSupabaseClient(event)

  const [{ data: users, error: usersError }, { data: orders, error: ordersError }] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .order('created_at', { ascending: false }),
  ])

  if (usersError || ordersError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load analytics' })
  }

  const userRows = users ?? []
  const orderRows = orders ?? []

  const monthKeys = getLastMonthKeys(6)
  const orderVolume = new Map(monthKeys.map(k => [k, 0]))
  const fulfilledVolume = new Map(monthKeys.map(k => [k, 0]))

  for (const order of orderRows) {
    const key = monthKeyFromIso(order.created_at)
    if (!key || !orderVolume.has(key)) continue

    orderVolume.set(key, (orderVolume.get(key) ?? 0) + 1)

    if (order.status === 'delivered') {
      fulfilledVolume.set(key, (fulfilledVolume.get(key) ?? 0) + 1)
    }
  }

  const roles = {
    buyer: userRows.filter(u => u.role === 'buyer').length,
    seller: userRows.filter(u => u.role === 'seller').length,
    delivery: userRows.filter(u => u.role === 'delivery').length,
    admin: userRows.filter(u => u.role === 'admin').length,
  }

  return {
    users: userRows,
    orders: orderRows,
    chart: {
      categories: formatMonthLabels(monthKeys),
      orderVolume: monthKeys.map(k => orderVolume.get(k) ?? 0),
      fulfilledVolume: monthKeys.map(k => fulfilledVolume.get(k) ?? 0),
    },
    roles,
  }
})
