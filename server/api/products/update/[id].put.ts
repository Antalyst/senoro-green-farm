import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'
import { normalizeProductCategory } from '../../../utils/productResponse'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Product ID required' })
  }

  const body = await readBody(event)
  const supabase = await serverSupabaseClient(event)
  
  const { data: existing } = await supabase.from('products').select('seller_id').eq('id', id).single()
  if (!existing || existing.seller_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Not authorized to update this product' })
  }

  const updates = { ...body }

  if (updates.category_id) {
    const { data: category } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', updates.category_id)
      .eq('seller_id', user.id)
      .maybeSingle()

    if (!category) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid product category' })
    }

    updates.category = category.name
  }

  delete updates.categories
  delete updates.seller_id
  delete updates.id
  delete updates.created_at

  const { data: product, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select('id, name, description, price, stock, category, category_id, image_url, created_at, categories!category_id(id, name)')
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update product' })
  }

  return { product: normalizeProductCategory(product) }
})
