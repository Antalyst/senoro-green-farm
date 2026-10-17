import { serverSupabaseClient } from '#supabase/server'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body ?? {}

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, password, role, approval_status, avatar_url')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (error || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  if (!bcrypt.compareSync(password, user.password)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  // Pending and rejected accounts can sign in, but the token only opens the
  // verification status page (requireAuth blocks every other endpoint).
  const payload = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    approval_status: user.approval_status,
  }

  const token = startSession(event, payload)

  return {
    success: true,
    token,
    user: { ...payload, avatar_url: user.avatar_url },
  }
})
