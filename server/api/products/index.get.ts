import { serverSupabaseClient } from '#supabase/server'
import { normalizeProductCategories } from '../../utils/productResponse'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = query.category as string
  const category_id = query.category_id as string
  const search = query.search as string

  const supabase = await serverSupabaseClient(event)
  
  let req = supabase
    .from('products')
    .select('id, name, description, price, stock, category, category_id, image_url, users!seller_id(id, full_name, shop_name, shop_avatar_url, shop_banner_url), categories!category_id(id, name)')
    .order('created_at', { ascending: false })

  if (category_id) {
    req = req.eq('category_id', category_id)
  }
  else if (category) {
    req = req.eq('category', category)
  }
  if (search) {
    req = req.ilike('name', `%${search}%`)
  }

  const { data: products, error } = await req

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch products' })
  }

  return { products: normalizeProductCategories(products) }
})
