import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

const BASE_COLUMNS = 'id, full_name, email, role, shop_name, shop_avatar_url, shop_banner_url, created_at'
const LOCATION_COLUMNS = 'shop_latitude, shop_longitude, shop_address'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supabase = await serverSupabaseClient(event)
  const query = (columns: string) => supabase
    .from('users')
    .select(columns)
    .eq('id', user.id)
    .eq('role', 'seller')
    .single()

  let { data: seller, error } = await query(`${BASE_COLUMNS}, ${LOCATION_COLUMNS}`)
  let locationSupported = true

  // DB without migration 010: return the profile without location fields.
  if (isMissingCoordinateColumns(error)) {
    locationSupported = false
    ;({ data: seller, error } = await query(BASE_COLUMNS))
  }

  if (error || !seller) {
    throw createError({ statusCode: 404, statusMessage: 'Seller profile not found' })
  }

  return { seller, location_supported: locationSupported }
})
