import { serverSupabaseClient } from '#supabase/server'
import { normalizeProductCategory } from '../../utils/productResponse'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Product ID required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: product, error } = await supabase
    .from('products')
    .select('id, name, description, price, stock, category, category_id, image_url, seller_id, users!seller_id(id, full_name, shop_name, email, created_at), categories!category_id(id, name)')
    .eq('id', id)
    .single()

  if (error || !product) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  return { product: normalizeProductCategory(product) }
})
