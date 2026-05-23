import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Product ID required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: product, error } = await supabase
    .from('products')
    .select('id, name, description, price, stock, category, image_url, seller_id, users!seller_id(id, full_name, email, created_at)')
    .eq('id', id)
    .single()

  if (error || !product) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  return { product }
})
