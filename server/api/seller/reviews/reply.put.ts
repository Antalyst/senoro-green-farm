import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const { review_id, reply } = body ?? {}

  if (!review_id || !reply) {
    throw createError({ statusCode: 400, statusMessage: 'review_id and reply are required' })
  }

  const supabase = await serverSupabaseClient(event)
  
  const { data: review } = await supabase
    .from('reviews')
    .select('id, products!inner(seller_id)')
    .eq('id', review_id)
    .single()

  // @ts-ignore
  if (!review || review.products.seller_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Not authorized to reply to this review' })
  }

  const { data: updatedReview, error } = await supabase
    .from('reviews')
    .update({ seller_reply: reply })
    .eq('id', review_id)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to reply' })
  }

  return { review: updatedReview }
})
