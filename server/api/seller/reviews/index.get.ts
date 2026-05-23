import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supabase = await serverSupabaseClient(event)
  
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(`
      id, rating, comment, seller_reply, created_at,
      products!inner(id, name, seller_id),
      users!buyer_id(id, full_name)
    `)
    .eq('products.seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch reviews' })
  }

  return { reviews }
})
