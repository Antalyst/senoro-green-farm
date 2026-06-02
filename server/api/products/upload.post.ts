import { requireAuth } from '../../utils/auth'

interface ImgBBResponse {
  data?: {
    url?: string
    display_url?: string
    delete_url?: string
  }
  success?: boolean
  error?: { message?: string }
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — sellers only' })
  }

  const config = useRuntimeConfig()
  const apiKey = config.imgbbApiKey as string
  if (!apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Image upload is not configured. Set IMGBB_API_KEY in your environment.',
    })
  }

  const contentType = getHeader(event, 'content-type') || ''
  let base64 = ''
  let filename = `product-${Date.now()}`

  if (contentType.includes('multipart/form-data')) {
    const parts = await readMultipartFormData(event)
    const filePart = parts?.find(p => p.name === 'image' && p.data)

    if (!filePart?.data) {
      throw createError({ statusCode: 400, statusMessage: 'image file is required' })
    }

    const mime = filePart.type ?? 'image/jpeg'
    if (!mime.startsWith('image/')) {
      throw createError({ statusCode: 400, statusMessage: 'Only image uploads are allowed' })
    }

    if (filePart.data.length > 10 * 1024 * 1024) {
      throw createError({ statusCode: 400, statusMessage: 'Image must be 10 MB or smaller' })
    }

    base64 = Buffer.from(filePart.data).toString('base64')
    filename = filePart.filename ?? filename
  } else if (contentType.includes('application/json')) {
    const body = await readBody(event)
    if (!body?.image) {
      throw createError({ statusCode: 400, statusMessage: 'image is required' })
    }
    
    // Extract base64 from data URI if present
    const match = body.image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/)
    if (match) {
      base64 = match[2]
    } else {
      base64 = body.image
    }
    filename = body.filename ?? filename

    if (base64.length > 14 * 1024 * 1024) {
      throw createError({ statusCode: 400, statusMessage: 'Image must be 10 MB or smaller' })
    }
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported content type' })
  }

  try {
    const response = await $fetch<ImgBBResponse>('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: new URLSearchParams({
        key: apiKey,
        image: base64,
        name: filePart.filename ?? `product-${Date.now()}`,
      }),
    })

    const url = response.data?.url ?? response.data?.display_url
    if (!response.success || !url) {
      throw createError({
        statusCode: 502,
        statusMessage: response.error?.message ?? 'Cloud image host rejected the upload',
      })
    }

    return { url, delete_url: response.data?.delete_url ?? null }
  }
  catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 502, statusMessage: 'Failed to upload image to cloud storage' })
  }
})
