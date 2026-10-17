export interface Coordinates {
  latitude: number | null
  longitude: number | null
}

/**
 * Reads latitude/longitude from a request body.
 * Returns undefined when neither is sent (leave as is), nulls to clear the pin, or validated numbers.
 */
export function parseCoordinates(latitude: unknown, longitude: unknown): Coordinates | undefined {
  if (latitude === undefined && longitude === undefined) return undefined
  if (latitude === null && longitude === null) return { latitude: null, longitude: null }

  const lat = Number(latitude)
  const lng = Number(longitude)
  if (
    !Number.isFinite(lat) || !Number.isFinite(lng)
    || lat < -90 || lat > 90 || lng < -180 || lng > 180
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid map location' })
  }

  // ~1 cm precision is plenty.
  return { latitude: Number(lat.toFixed(7)), longitude: Number(lng.toFixed(7)) }
}

/** True when location columns are missing (migration 009 for addresses, 010 for shops not run yet). */
export function isMissingCoordinateColumns(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return error.code === 'PGRST204' || error.code === '42703' || /latitude|longitude|shop_address/.test(error.message ?? '')
}

/** Seller id → pickup location. Empty map if the DB has no shop location columns yet. */
export async function fetchShopLocations(
  supabase: { from: (table: string) => any },
  sellerIds: string[],
) {
  const locations = new Map<string, { shop_latitude: number | null; shop_longitude: number | null; shop_address: string | null }>()
  if (!sellerIds.length) return locations

  const { data, error } = await supabase
    .from('users')
    .select('id, shop_latitude, shop_longitude, shop_address')
    .in('id', sellerIds)

  if (error) {
    if (!isMissingCoordinateColumns(error)) console.error('fetchShopLocations:', error.message)
    return locations
  }
  for (const row of data ?? []) {
    locations.set(row.id, {
      shop_latitude: row.shop_latitude,
      shop_longitude: row.shop_longitude,
      shop_address: row.shop_address,
    })
  }
  return locations
}
