import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'

// Saves the shop pickup pin + pickup address/landmark text.
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const coordinates = parseCoordinates(body?.latitude ?? null, body?.longitude ?? null)
  const shopAddress = String(body?.shop_address ?? '').trim()

  if (shopAddress.length > 300) {
    throw createError({ statusCode: 400, statusMessage: 'Pickup address must be 300 characters or fewer' })
  }

  const supabase = await serverSupabaseClient(event)
  const { data, error } = await supabase
    .from('users')
    .update({
      shop_latitude: coordinates?.latitude ?? null,
      shop_longitude: coordinates?.longitude ?? null,
      shop_address: shopAddress || null,
    })
    .eq('id', user.id)
    .eq('role', 'seller')
    .select('shop_latitude, shop_longitude, shop_address')
    .single()

  if (isMissingCoordinateColumns(error)) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Shop location is not available yet. Ask the admin to run database migration 010.',
    })
  }
  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to save shop location' })
  }

  return { location: data }
})
