import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

// Every account for the admin's Users page, with block / delete state (migration 018).
// `access_supported: false` means migration 018 is not run yet (block / delete buttons are hidden).
const BASE_COLUMNS = 'id, full_name, email, role, approval_status, avatar_url, shop_name, created_at'

export default defineEventHandler(async (event) => {
  const caller = requireAuth(event)
  if (caller.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — admin only' })
  }

  const supabase = await serverSupabaseClient(event)

  let accessSupported = true
  let { data: users, error } = await supabase
    .from('users')
    .select(`${BASE_COLUMNS}, ${ACCOUNT_STATUS_COLUMNS}`)
    .order('created_at', { ascending: false })

  if (isMissingAccountStatusSchema(error)) {
    accessSupported = false
    ;({ data: users, error } = await supabase
      .from('users')
      .select(BASE_COLUMNS)
      .order('created_at', { ascending: false }) as any)
  }

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch users' })
  }

  return {
    users: (users ?? []).map((u: any) => ({ blocked_at: null, blocked_reason: null, deleted_at: null, ...u })),
    access_supported: accessSupported,
  }
})
