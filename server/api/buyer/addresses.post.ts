import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const { full_name, phone_number, city, barangay, detailed_address, is_default = false } = body ?? {}

  if (!full_name?.trim() || !phone_number?.trim() || !city?.trim() || !barangay?.trim() || !detailed_address?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'All address fields are required' })
  }

  const supabase = await serverSupabaseClient(event)

  if (is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
  }

  const { count } = await supabase
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const makeDefault = is_default || (count ?? 0) === 0

  const { data: address, error } = await supabase
    .from('addresses')
    .insert({
      user_id: user.id,
      full_name: full_name.trim(),
      phone_number: phone_number.trim(),
      city: city.trim(),
      barangay: barangay.trim(),
      detailed_address: detailed_address.trim(),
      is_default: makeDefault,
    })
    .select()
    .single()

  if (error || !address) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create address' })
  }

  return { address }
})
