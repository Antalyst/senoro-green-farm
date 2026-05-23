import { serverSupabaseClient } from '#supabase/server'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body ?? {}

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }

  const supabase = await serverSupabaseClient(event)

  // Look up user by email
  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, password, role')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (error || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  // Verify hashed password
  if (!bcrypt.compareSync(password, user.password)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  const payload = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
  }

  // Sign JWT and set as HttpOnly cookie
  const token = signToken(payload)

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
    // secure: true — enable in production (requires HTTPS)
  })

  return {
    success: true,
    token,
    user: payload,
  }
})
