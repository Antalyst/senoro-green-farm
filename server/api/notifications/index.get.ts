import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const supabase = await serverSupabaseClient(event)
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch notifications' })
  }

  const unreadCount = data?.filter(n => !n.is_read).length || 0

  return {
    list: data || [],
    unreadCount
  }
})
