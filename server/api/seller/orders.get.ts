import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: sellerItems, error: itemsError } = await supabase
    .from('order_items')
    .select('id, order_id, quantity, price, product_id, is_confirmed, products(id, name, category, image_url)')
    .eq('seller_id', user.id)

  if (itemsError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch seller order items' })
  }

  const orderIds = [...new Set((sellerItems ?? []).map(i => i.order_id).filter(Boolean))]

  if (!orderIds.length) {
    return { orders: [] }
  }

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id, status, total_amount, created_at,
      addresses(id, full_name, phone_number, city, barangay, detailed_address),
      users:buyer_id(id, full_name, email)
    `)
    .in('id', orderIds)
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: false })

  if (ordersError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch orders' })
  }

  const itemsByOrder = new Map<string, typeof sellerItems>()
  for (const item of sellerItems ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? []
    list.push(item)
    itemsByOrder.set(item.order_id, list)
  }

  const result = (orders ?? []).map((order) => {
    const lines = itemsByOrder.get(order.id) ?? []
    const seller_subtotal = lines.reduce(
      (sum, line) => sum + Number(line.price) * Number(line.quantity),
      0,
    )
    const seller_confirmed = lines.length > 0 && lines.every(line => line.is_confirmed)
    return {
      ...order,
      buyer: order.users,
      address: order.addresses,
      seller_items: lines,
      seller_subtotal,
      seller_confirmed,
    }
  })

  return { orders: result }
})
