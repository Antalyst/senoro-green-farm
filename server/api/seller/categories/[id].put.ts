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

  const body = await readBody(event)
  const name = String(body?.name ?? '').trim()

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Category name is required' })
  }

  if (name.length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'Category name must be 120 characters or fewer' })
  }

  const supabase = await serverSupabaseClient(event)
  const { data: category, error } = await supabase
    .from('categories')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('seller_id', user.id)
    .select('id, seller_id, name, created_at, updated_at')
    .maybeSingle()

  if (error) {
    const message = error.code === '23505' ? 'Category already exists' : 'Failed to update category'
    throw createError({ statusCode: error.code === '23505' ? 409 : 500, statusMessage: message })
  }

  if (!category) {
    throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  }

  return { category }
})
