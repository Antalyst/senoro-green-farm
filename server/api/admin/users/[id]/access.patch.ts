import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../../utils/auth'

// Admin blocks, unblocks, (soft) deletes or restores an account. Needs migration 018.
// Body: { action: 'block' | 'unblock' | 'delete' | 'restore', reason?: string (block, up to 300) }
// - block:   the person is signed out and cannot sign in; a seller's products are hidden.
// - delete:  same as block, and the account is listed under "Deleted". Nothing is erased,
//            so orders, reviews and chats keep working, and "restore" brings it back.
const ACTIONS = ['block', 'unblock', 'delete', 'restore'] as const
type Action = typeof ACTIONS[number]

export default defineEventHandler(async (event) => {
  const caller = requireAuth(event)
  if (caller.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — admin only' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'User ID required' })
  if (id === caller.id) throw createError({ statusCode: 400, statusMessage: 'You cannot block or delete your own account.' })

  const body = await readBody(event).catch(() => ({}))
  const action = String(body?.action ?? '') as Action
  if (!ACTIONS.includes(action)) {
    throw createError({ statusCode: 400, statusMessage: 'action must be block, unblock, delete or restore' })
  }
  const reason = String(body?.reason ?? '').trim().replace(/\s+/g, ' ').slice(0, 300) || null

  const supabase = await serverSupabaseClient(event)
  const { data: target, error: loadError } = await supabase
    .from('users')
    .select(`id, role, ${ACCOUNT_STATUS_COLUMNS}`)
    .eq('id', id)
    .maybeSingle()

  if (isMissingAccountStatusSchema(loadError)) {
    throw createError({ statusCode: 503, statusMessage: 'Blocking accounts needs a database update (migration 018).' })
  }
  if (loadError || !target) throw createError({ statusCode: 404, statusMessage: 'User not found' })
  if (target.role === 'admin') throw createError({ statusCode: 400, statusMessage: 'Admin accounts cannot be blocked or deleted.' })

  const now = new Date().toISOString()
  let changes: Record<string, unknown>
  if (action === 'block') {
    if (target.blocked_at) throw createError({ statusCode: 400, statusMessage: 'This account is already blocked.' })
    changes = { blocked_at: now, blocked_reason: reason }
  }
  else if (action === 'unblock') {
    if (!target.blocked_at) throw createError({ statusCode: 400, statusMessage: 'This account is not blocked.' })
    changes = { blocked_at: null, blocked_reason: null }
  }
  else if (action === 'delete') {
    if (target.deleted_at) throw createError({ statusCode: 400, statusMessage: 'This account is already deleted.' })
    changes = { deleted_at: now }
  }
  else {
    if (!target.deleted_at) throw createError({ statusCode: 400, statusMessage: 'This account is not deleted.' })
    changes = { deleted_at: null }
  }

  const { data: updated, error } = await supabase
    .from('users')
    .update(changes)
    .eq('id', id)
    .select(`id, full_name, email, role, approval_status, avatar_url, created_at, ${ACCOUNT_STATUS_COLUMNS}`)
    .single()

  if (error || !updated) {
    console.error('[admin/access]', error?.message)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update the account' })
  }

  forgetAccountStatus(id)
  return { user: updated }
})
