import { randomUUID } from 'node:crypto'
import { serverSupabaseClient } from '#supabase/server'
import bcrypt from 'bcryptjs'

const VALID_ROLES = ['admin', 'seller', 'buyer', 'delivery'] as const

// Every new account (buyer, seller, rider) sends a selfie and a photo of a valid ID as
// multipart/form-data, and stays "pending" until an admin checks them. The user is signed in
// right away but can only see the verification status page until approved.
export default defineEventHandler(async (event) => {
  const contentType = getHeader(event, 'content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    throw createError({ statusCode: 400, statusMessage: 'Please attach your selfie and ID photo.' })
  }

  const parts = await readMultipartFormData(event)
  const { full_name, email, password, role, id_type } = multipartFields(parts)

  if (!full_name?.trim() || !email?.trim() || !password || !role) {
    throw createError({ statusCode: 400, statusMessage: 'All fields are required' })
  }

  if (!VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid role' })
  }

  if (role === 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin accounts cannot be created via public registration' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 6 characters.' })
  }

  const idType = id_type?.trim().slice(0, 60)
  if (!idType) {
    throw createError({ statusCode: 400, statusMessage: 'Please choose the type of ID you are uploading.' })
  }

  const selfie = readImagePart(parts, 'selfie', 'Your selfie')
  const idPhoto = readImagePart(parts, 'id_document', 'Your ID photo')

  const supabase = await serverSupabaseClient(event)
  const normalizedEmail = email.toLowerCase().trim()

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Email already registered' })
  }

  // The photos are stored under the new user's id, so pick it before inserting.
  const userId = randomUUID()
  const selfiePath = await storeVerificationPhoto(event, userId, 'selfie', selfie)
  let idPath: string
  try {
    idPath = await storeVerificationPhoto(event, userId, 'id', idPhoto)
  }
  catch (err) {
    await removeVerificationPhotos(event, [selfiePath])
    throw err
  }

  const hashedPassword = bcrypt.hashSync(password, 10)
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      full_name: full_name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      approval_status: 'pending',
      selfie_path: selfiePath,
      id_document_path: idPath,
      id_type: idType,
      verification_submitted_at: new Date().toISOString(),
    })
    .select('id, full_name, email, role, approval_status, avatar_url')
    .single()

  if (error || !newUser) {
    console.error('[register] insert failed:', error?.message)
    await removeVerificationPhotos(event, [selfiePath, idPath])
    throw createError({ statusCode: 500, statusMessage: 'Failed to create account' })
  }

  const payload = {
    id: newUser.id,
    full_name: newUser.full_name,
    email: newUser.email,
    role: newUser.role,
    approval_status: newUser.approval_status,
  }
  const token = startSession(event, payload)

  return {
    success: true,
    token,
    user: { ...payload, avatar_url: newUser.avatar_url },
  }
})
