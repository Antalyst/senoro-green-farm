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

  const supabase = await serverSupabaseClient(event)
  
  const { data: existing } = await supabase.from('products').select('seller_id').eq('id', id).single()
  if (!existing || existing.seller_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Not authorized to delete this product' })
  }

  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete product' })
  }

  return { success: true }
})
