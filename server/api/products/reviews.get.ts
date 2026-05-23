import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const productId = query.product_id as string

  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: 'product_id is required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(`
      id, rating, comment, seller_reply, created_at,
      users!buyer_id(id, full_name)
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch reviews' })
  }

  return { reviews }
})
