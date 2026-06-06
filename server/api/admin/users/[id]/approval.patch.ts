import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../../utils/auth'

const VALID_STATUSES = ['approved', 'rejected'] as const

export default defineEventHandler(async (event) => {
  const caller = requireAuth(event)
  if (caller.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — admin only' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'User ID required' })
  }

  const body = await readBody(event)
  const { approval_status } = body ?? {}

  if (!approval_status || !VALID_STATUSES.includes(approval_status)) {
    throw createError({ statusCode: 400, statusMessage: 'approval_status must be approved or rejected' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: target, error: fetchError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !target) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  if (target.role === 'admin') {
    throw createError({ statusCode: 400, statusMessage: 'Admin accounts cannot be moderated via approval workflow' })
  }

  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({ approval_status })
    .eq('id', id)
    .select('id, full_name, email, role, approval_status, created_at')
    .single()

  if (updateError || !updated) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update approval status' })
  }

  return { user: updated }
})
