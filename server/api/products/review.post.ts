import { randomUUID } from 'node:crypto'
import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

// Buyer posts a review: 1–5 stars, a comment and/or up to 3 photos.
// JSON body:      { product_id, rating, comment }
// Multipart form: product_id, rating, comment, images (up to 3 files, JPG/PNG/WebP, max 5 MB each)
// Photos go to the public "product-images" bucket under reviews/<buyerId>/ (review photos are public,
// like the review itself) and need migration 018 (reviews.image_urls).
const BUCKET = 'product-images'
const MAX_PHOTOS = 3

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const isMultipart = (getHeader(event, 'content-type') || '').includes('multipart/form-data')
  const parts = isMultipart ? await readMultipartFormData(event) : undefined
  const body = isMultipart ? multipartFields(parts) : (await readBody(event)) ?? {}

  const productId = String(body.product_id ?? '')
  const rating = Number(body.rating)
  const comment = String(body.comment ?? '').trim().slice(0, 1000) || null

  if (!productId || !rating) {
    throw createError({ statusCode: 400, statusMessage: 'product_id and rating are required' })
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw createError({ statusCode: 400, statusMessage: 'Rating must be between 1 and 5' })
  }

  // Check every photo before uploading any of them.
  const photoParts = (parts ?? []).filter(p => p.name === 'images' && p.filename !== undefined && p.data?.length)
  if (photoParts.length > MAX_PHOTOS) {
    throw createError({ statusCode: 400, statusMessage: `You can add up to ${MAX_PHOTOS} photos.` })
  }
  const photos = photoParts.map((part, i) => readImagePart([part], 'images', `Photo ${i + 1}`))

  if (!comment && !photos.length) {
    throw createError({ statusCode: 400, statusMessage: 'Write a comment or add a photo.' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: product } = await supabase.from('products').select('id').eq('id', productId).maybeSingle()
  if (!product) throw createError({ statusCode: 404, statusMessage: 'Product not found' })

  const storage = supabase.storage.from(BUCKET)
  const uploadedPaths: string[] = []
  const imageUrls: string[] = []
  for (const photo of photos) {
    const path = `reviews/${user.id}/${Date.now()}-${randomUUID().slice(0, 8)}.${photo.ext}`
    const { error } = await storage.upload(path, photo.bytes, {
      contentType: photo.mime,
      cacheControl: '31536000',
      upsert: false,
    })
    if (error) {
      console.error('[review] photo upload failed:', error.message)
      if (uploadedPaths.length) await storage.remove(uploadedPaths)
      throw createError({ statusCode: 502, statusMessage: 'Could not upload your photo. Please try again.' })
    }
    uploadedPaths.push(path)
    imageUrls.push(storage.getPublicUrl(path).data.publicUrl)
  }

  const row: Record<string, unknown> = { product_id: productId, buyer_id: user.id, rating, comment }
  if (imageUrls.length) row.image_urls = imageUrls

  const { data: review, error } = await supabase.from('reviews').insert(row).select().single()

  if (error || !review) {
    console.error('[review] insert failed:', error?.code, error?.message)
    if (uploadedPaths.length) await storage.remove(uploadedPaths)
    if (imageUrls.length && (error?.code === 'PGRST204' || error?.code === '42703' || /image_urls/.test(error?.message ?? ''))) {
      throw createError({ statusCode: 503, statusMessage: 'Review photos need a database update (migration 018).' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Failed to submit review' })
  }

  return { review: { ...review, image_urls: review.image_urls ?? [] } }
})
