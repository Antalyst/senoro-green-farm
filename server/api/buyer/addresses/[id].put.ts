import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Address ID required' })
  }

  const body = await readBody(event)
  const { full_name, phone_number, city, barangay, detailed_address, is_default } = body ?? {}

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

  if (is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
  }

  const updates: Record<string, unknown> = {}
  if (full_name !== undefined) updates.full_name = String(full_name).trim()
  if (phone_number !== undefined) updates.phone_number = String(phone_number).trim()
  if (city !== undefined) updates.city = String(city).trim()
  if (barangay !== undefined) updates.barangay = String(barangay).trim()
  if (detailed_address !== undefined) updates.detailed_address = String(detailed_address).trim()
  if (is_default !== undefined) updates.is_default = Boolean(is_default)

  const { data: address, error } = await supabase
    .from('addresses')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !address) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update address' })
  }

  return { address }
})
