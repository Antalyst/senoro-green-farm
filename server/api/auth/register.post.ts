import { serverSupabaseClient } from '#supabase/server'
import bcrypt from 'bcryptjs'

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

  if (role === 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin accounts cannot be created via public registration' })
  }

  const supabase = await serverSupabaseClient(event)
  const approvalStatus = role === 'buyer' ? 'approved' : 'pending'

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Email already registered' })
  }

  const hashedPassword = bcrypt.hashSync(password, 10)
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      approval_status: approvalStatus,
    })
    .select('id, full_name, email, role, approval_status')
    .single()

  if (error || !newUser) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create account' })
  }

  if (newUser.approval_status === 'pending') {
    return {
      success: true,
      pendingApproval: true,
      message: 'Your account is pending admin review. You will be able to sign in once approved.',
      user: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        approval_status: newUser.approval_status,
      },
    }
  }

  const payload = {
    id: newUser.id,
    full_name: newUser.full_name,
    email: newUser.email,
    role: newUser.role,
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
