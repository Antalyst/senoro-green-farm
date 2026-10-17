import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export interface ImageFile {
  bytes: Buffer
  mime: string
  ext: string
}

type MultipartPart = NonNullable<Awaited<ReturnType<typeof readMultipartFormData>>>[number]

const MAX_BYTES = 5 * 1024 * 1024
const PHOTO_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** Text fields of a multipart form, by name. */
export function multipartFields(parts: MultipartPart[] | undefined): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const part of parts ?? []) {
    if (part.name && !part.filename) fields[part.name] = part.data.toString('utf8')
  }
  return fields
}

/** Validates one image file from a multipart form (JPG, PNG or WebP, up to 5 MB). */
export function readImagePart(parts: MultipartPart[] | undefined, name: string, label: string): ImageFile {
  const part = parts?.find(p => p.name === name && p.filename !== undefined)
  if (!part?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: `${label} is required.` })
  }
  const mime = (part.type ?? '').toLowerCase()
  const ext = PHOTO_TYPES[mime]
  if (!ext) {
    throw createError({ statusCode: 400, statusMessage: `${label} must be a JPG, PNG or WebP image.` })
  }
  if (part.data.length > MAX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: `${label} must be 5 MB or smaller.` })
  }
  return { bytes: Buffer.from(part.data), mime, ext }
}

// Selfies and ID photos: private bucket, service-role key only (migration 016).
const VERIFICATION_BUCKET = 'verification-docs'

function verificationStorage(event: H3Event) {
  try {
    return serverSupabaseServiceRole(event).storage.from(VERIFICATION_BUCKET)
  }
  catch (err) {
    console.error('[verification] service role client unavailable:', err)
    throw createError({ statusCode: 503, statusMessage: 'Identity verification storage is not configured (missing SUPABASE_SECRET_KEY).' })
  }
}

/** Stores a selfie or ID photo as <userId>/<kind>-<time>-<random>.<ext> and returns its storage path. */
export async function storeVerificationPhoto(event: H3Event, userId: string, kind: 'selfie' | 'id', file: ImageFile) {
  const path = `${userId}/${kind}-${Date.now()}-${randomUUID().slice(0, 8)}.${file.ext}`
  const { error } = await verificationStorage(event).upload(path, file.bytes, {
    contentType: file.mime,
    upsert: false,
  })
  if (error) {
    console.error('[verification] upload failed:', error.message)
    if (/bucket not found/i.test(error.message)) {
      throw createError({ statusCode: 503, statusMessage: 'Verification storage is not set up yet. Run database migration 016.' })
    }
    throw createError({ statusCode: 502, statusMessage: 'Could not upload your verification photos. Please try again.' })
  }
  return path
}

/** Best effort cleanup, e.g. when signup fails after the photos were uploaded. */
export async function removeVerificationPhotos(event: H3Event, paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => !!p)
  if (!list.length) return
  try {
    const { error } = await verificationStorage(event).remove(list)
    if (error) console.error('[verification] cleanup failed:', error.message)
  }
  catch (err) {
    console.error('[verification] cleanup failed:', err)
  }
}

/** Short-lived links so an admin can view the photos; they are never public. */
export async function signedVerificationUrls(event: H3Event, paths: string[], expiresInSeconds = 600) {
  const urls = new Map<string, string>()
  if (!paths.length) return urls
  const { data, error } = await verificationStorage(event).createSignedUrls(paths, expiresInSeconds)
  if (error) {
    console.error('[verification] signing failed:', error.message)
    return urls
  }
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) urls.set(row.path, row.signedUrl)
  }
  return urls
}
