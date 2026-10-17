import { randomUUID } from 'node:crypto'
import { serverSupabaseClient } from '#supabase/server'

// Profile photo for any approved account (buyer, seller, rider, admin).
// Stored in the public "product-images" bucket under avatars/<userId>/ (migration 013).
const BUCKET = 'product-images'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const parts = await readMultipartFormData(event)
  const image = readImagePart(parts, 'image', 'Profile photo')

  const supabase = await serverSupabaseClient(event)
  const storage = supabase.storage.from(BUCKET)
  const path = `avatars/${user.id}/${Date.now()}-${randomUUID().slice(0, 8)}.${image.ext}`

  const { error: uploadError } = await storage.upload(path, image.bytes, {
    contentType: image.mime,
    cacheControl: '31536000',
    upsert: false,
  })
  if (uploadError) {
    console.error('[avatar] upload failed:', uploadError.message)
    throw createError({ statusCode: 502, statusMessage: 'Photo upload failed. Please try again.' })
  }

  const avatarUrl = storage.getPublicUrl(path).data.publicUrl
  const { error } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to save your profile photo' })
  }

  return { avatar_url: avatarUrl }
})
