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
    .select('id, full_name, email, password, role, approval_status')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (error || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  if (!bcrypt.compareSync(password, user.password)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  if (user.approval_status === 'pending') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Your account is pending admin approval. Please check back later.',
    })
  }

  if (user.approval_status === 'rejected') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Your registration was not approved. Contact support if you believe this is an error.',
    })
  }

  const payload = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
  }

  const token = signToken(payload)

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })

  return {
    success: true,
    token,
    user: payload,
  }
})
