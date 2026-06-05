import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Category ID required' })
  }

  const supabase = await serverSupabaseClient(event)
  const { data: category, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('seller_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete category' })
  }

  if (!category) {
    throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  }

  return { success: true }
})
