import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
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
    .insert({ seller_id: user.id, name })
    .select('id, seller_id, name, created_at, updated_at')
    .single()

  if (error) {
    const message = error.code === '23505' ? 'Category already exists' : 'Failed to create category'
    throw createError({ statusCode: error.code === '23505' ? 409 : 500, statusMessage: message })
  }

  return { category }
})
