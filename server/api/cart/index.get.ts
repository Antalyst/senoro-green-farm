import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supabase = await serverSupabaseClient(event)
  
  const { data: cart_items, error } = await supabase
    .from('cart_items')
    .select(`
      id, quantity, created_at,
      products!inner(id, name, price, category, stock, image_url, users!seller_id(id, full_name))
    `)
    .eq('buyer_id', user.id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch cart' })
  }

  return { cart_items }
})
