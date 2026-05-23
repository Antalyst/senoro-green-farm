import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const { name, description, price, stock, category, image_url } = body ?? {}

  if (!name || price === undefined || stock === undefined || !category) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required product fields' })
  }

  const supabase = await serverSupabaseClient(event)
  
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      seller_id: user.id,
      name,
      description,
      price,
      stock,
      category,
      image_url
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create product' })
  }

  return { product }
})
