import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Address ID required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: existing } = await supabase
    .from('addresses')
    .select('id, is_default')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Address not found' })
  }

  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete address' })
  }

  if (existing.is_default) {
    const { data: next } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (next) {
      await supabase.from('addresses').update({ is_default: true }).eq('id', next.id)
    }
  }

  return { success: true }
})
