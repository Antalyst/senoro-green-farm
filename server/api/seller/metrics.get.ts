import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

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

  const totalRevenue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const uniqueOrders = new Set(items.map(i => i.order_id)).size

  return {
    totalRevenue,
    totalOrders: uniqueOrders,
    items
  }
})
