import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Cart item ID required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: existing } = await supabase.from('cart_items').select('buyer_id').eq('id', id).single()
  if (!existing || existing.buyer_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Not authorized to remove this item' })
  }

  const { error } = await supabase.from('cart_items').delete().eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to remove from cart' })
  }

  return { success: true }
})
