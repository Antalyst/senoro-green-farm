import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const { product_id, rating, comment } = body ?? {}

  if (!product_id || !rating) {
    throw createError({ statusCode: 400, statusMessage: 'product_id and rating are required' })
  }

  if (rating < 1 || rating > 5) {
    throw createError({ statusCode: 400, statusMessage: 'Rating must be between 1 and 5' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      product_id,
      buyer_id: user.id,
      rating,
      comment: comment || null
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to submit review' })
  }

  return { review }
})
