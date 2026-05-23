import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'

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

  const { data: product, error } = await supabase
    .from('products')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update product' })
  }

  return { product }
})
