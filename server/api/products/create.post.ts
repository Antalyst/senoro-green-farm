import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { normalizeProductCategory, parseProductUnit } from '../../utils/productResponse'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const { name, description, price, stock, category_id, image_url } = body ?? {}
  const unit_type = parseProductUnit(body?.unit_type) ?? 'pc'

  if (!name || price === undefined || stock === undefined || !category_id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required product fields' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: category } = await supabase
    .from('categories')
    .select('id, name')
    .eq('id', category_id)
    .eq('seller_id', user.id)
    .maybeSingle()

  if (!category) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid product category' })
  }
  
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      seller_id: user.id,
      name,
      description,
      price,
      stock,
      category_id,
      category: category.name,
      image_url,
      unit_type,
    })
    .select('id, name, description, price, stock, category, category_id, image_url, unit_type, created_at, categories!category_id(id, name)')
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create product' })
  }

  return { product: normalizeProductCategory(product) }
})
