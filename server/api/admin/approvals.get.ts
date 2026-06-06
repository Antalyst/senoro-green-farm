import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const caller = requireAuth(event)
  if (caller.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — admin only' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, approval_status, created_at')
    .eq('approval_status', 'pending')
    .in('role', ['seller', 'delivery'])
    .order('created_at', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch pending approvals' })
  }

  return { users: users ?? [] }
})
