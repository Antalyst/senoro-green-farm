import { serverSupabaseClient } from '#supabase/server'

const VALID_ROLES = ['admin', 'seller', 'buyer', 'delivery'] as const

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { full_name, email, password, role } = body ?? {}

  if (!full_name || !email || !password || !role) {
    throw createError({ statusCode: 400, statusMessage: 'All fields are required' })
  }

  if (!VALID_ROLES.includes(role)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid role' })
  }

  const supabase = await serverSupabaseClient(event)

  // Check if email already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Email already registered' })
  }

  // Insert new user
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      password, // plain text — prototype only
      role,
    })
    .select('id, full_name, email, role')
    .single()

  if (error || !newUser) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create account' })
  }

  const payload = {
    id: newUser.id,
    full_name: newUser.full_name,
    email: newUser.email,
    role: newUser.role,
  }

  // Sign JWT and set as HttpOnly cookie
  const token = signToken(payload)

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })

  return {
    user: payload,
  }
})
