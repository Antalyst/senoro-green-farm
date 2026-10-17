import { randomUUID } from 'node:crypto'
import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

// Uploads a product photo or shop avatar/banner to Supabase Storage and returns its public URL.
// Accepts multipart/form-data (field "image") or JSON { image: dataURI | base64, filename }.
// Needs migration 013 (bucket "product-images").
const BUCKET = 'product-images'
const MAX_BYTES = 5 * 1024 * 1024
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — sellers only' })
  }

  const contentType = getHeader(event, 'content-type') || ''
  let bytes: Buffer
  let mime: string

  if (contentType.includes('multipart/form-data')) {
    const parts = await readMultipartFormData(event)
    const filePart = parts?.find(p => p.name === 'image' && p.data)
    if (!filePart?.data) {
      throw createError({ statusCode: 400, statusMessage: 'Image file is required' })
    }
    bytes = Buffer.from(filePart.data)
    mime = filePart.type ?? ''
  }
  else if (contentType.includes('application/json')) {
    const body = await readBody(event)
    const raw = String(body?.image ?? '')
    if (!raw) throw createError({ statusCode: 400, statusMessage: 'Image is required' })
    const match = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    mime = match?.[1] ?? 'image/jpeg'
    bytes = Buffer.from(match?.[2] ?? raw, 'base64')
  }
  else {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported content type' })
  }

  const ext = EXTENSIONS[mime.toLowerCase()]
  if (!ext) {
    throw createError({ statusCode: 400, statusMessage: 'Use a JPG, PNG, WebP or GIF image.' })
  }
  if (!bytes.length) {
    throw createError({ statusCode: 400, statusMessage: 'The image file is empty.' })
  }
  if (bytes.length > MAX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Image must be 5 MB or smaller.' })
  }

  // Files are grouped per seller: <sellerId>/<time>-<random>.<ext>
  const path = `${user.id}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
  const supabase = await serverSupabaseClient(event)
  const storage = supabase.storage.from(BUCKET)

  const { error } = await storage.upload(path, bytes, {
    contentType: mime,
    cacheControl: '31536000',
    upsert: false,
  })

  if (error) {
    console.error('[upload]', error.message)
    if (/bucket not found/i.test(error.message)) {
      throw createError({ statusCode: 503, statusMessage: 'Image storage is not set up yet. Run database migration 013.' })
    }
    if (/row-level security|unauthorized|not allowed/i.test(error.message)) {
      throw createError({ statusCode: 503, statusMessage: 'Image storage does not allow uploads yet. Run database migration 013.' })
    }
    throw createError({ statusCode: 502, statusMessage: 'Image upload failed. Please try again.' })
  }

  return { url: storage.getPublicUrl(path).data.publicUrl }
})
