import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { getDeliverySettings } from '../../utils/deliveryFee'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — admin only' })
  }

  const supabase = await serverSupabaseClient(event)
  return { settings: await getDeliverySettings(supabase) }
})
