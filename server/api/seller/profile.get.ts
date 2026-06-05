import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supabase = await serverSupabaseClient(event)
  const { data: seller, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, shop_name, created_at')
    .eq('id', user.id)
    .eq('role', 'seller')
    .single()

  if (error || !seller) {
    throw createError({ statusCode: 404, statusMessage: 'Seller profile not found' })
  }

  return { seller }
})
