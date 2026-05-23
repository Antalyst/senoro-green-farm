import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const supabase = await serverSupabaseClient(event)

  if (user.role === 'admin') {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id, total_amount, status, created_at, buyer_id,
        order_items(id, quantity, price, seller_id)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch orders' })
    }

    return { orders: orders ?? [] }
  }

  if (user.role === 'seller') {
    const { data: items, error } = await supabase
      .from('order_items')
      .select('price, quantity, created_at, order_id, orders(id, status, created_at, total_amount)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch seller orders' })
    }

    return { order_items: items ?? [] }
  }

  throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
})
