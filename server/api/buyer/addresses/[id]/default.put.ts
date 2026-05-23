import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Address ID required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: existing } = await supabase
    .from('addresses')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Address not found' })
  }

  await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', user.id)

  const { data: address, error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !address) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to set default address' })
  }

  return { address }
})
