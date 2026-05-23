import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, description, price, stock, category, image_url, created_at')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch products' })
  }

  return { products }
})
