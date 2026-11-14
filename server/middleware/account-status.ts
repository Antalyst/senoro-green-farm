import { serverSupabaseClient } from '#supabase/server'
import { type UserPayload, verifyToken } from '../utils/auth'
import { accountStatusError, loadAccountStatus } from '../utils/accountStatus'

// Stops blocked or deleted accounts on every API request, even with a sign-in token that is
// still valid (tokens last 7 days). Sign-in itself checks the same thing in /api/auth/login.
const SKIP = ['/api/auth/login', '/api/auth/register', '/api/auth/logout']

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? ''
  if (!path.startsWith('/api/') || SKIP.includes(path)) return

  let token = getCookie(event, 'auth_token')
  const header = getHeader(event, 'authorization')
  if (!token && header?.startsWith('Bearer ')) token = header.slice(7)
  if (!token) return

  let user: UserPayload
  try {
    user = verifyToken(token)
  }
  catch {
    return // the endpoint answers 401 itself
  }
  if (user.role === 'admin') return // admins cannot be blocked

  const supabase = await serverSupabaseClient(event)
  const status = await loadAccountStatus(supabase, user.id)
  if (!status) return

  deleteCookie(event, 'auth_token', { path: '/' })
  throw accountStatusError(status)
})
