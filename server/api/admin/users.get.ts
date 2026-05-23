import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // Verify caller is an admin
  const caller = requireAuth(event)
  if (caller.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — admin only' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch users' })
  }

  return { users }
})
