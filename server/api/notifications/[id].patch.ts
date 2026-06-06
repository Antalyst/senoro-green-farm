import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }

  const supabase = await serverSupabaseClient(event)
  
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: body?.is_read === true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update notification' })
  }

  return { success: true }
})
