import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // requireAuth reads the cookie, verifies JWT, returns user payload or throws 401
  const session = requireAuth(event, { allowUnverified: true })

  // Read the account fresh: an admin may have approved or rejected it since the token was issued.
  const supabase = await serverSupabaseClient(event)
  const { data: row, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, approval_status, avatar_url')
    .eq('id', session.id)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load account' })
  }
  if (!row) {
    throw createError({ statusCode: 401, statusMessage: 'Account no longer exists' })
  }

  const payload = {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    approval_status: row.approval_status,
  }

  // Re-issue the session when the approval status changed so other endpoints see it.
  const token = payload.approval_status !== session.approval_status || payload.full_name !== session.full_name
    ? startSession(event, payload)
    : undefined

  return { user: { ...payload, avatar_url: row.avatar_url }, token }
})
