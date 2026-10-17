// Philippine Standard Geographic Code (PSGC) data from https://psgc.gitlab.io (free, no key).
const PSGC_BASE = 'https://psgc.gitlab.io/api'

// Delivery area: Negros Occidental only.
export const DELIVERY_PROVINCE_CODE = '064500000'

export interface PsgcPlace {
  code: string
  name: string
}

// PSGC names cities "City of Bago"; saved addresses use "Bacolod City".
function normalizeName(name: string): string {
  const match = name.match(/^City of (.+)$/)
  return match ? `${match[1]} City` : name
}

async function fetchPlaces(path: string): Promise<PsgcPlace[]> {
  try {
    // PSGC serves JSON with a text/html content type, so parse it explicitly.
    const rows = await $fetch<{ code: string; name: string }[]>(`${PSGC_BASE}${path}`, {
      timeout: 10000,
      parseResponse: JSON.parse,
    })
    return rows
      .map(row => ({ code: row.code, name: normalizeName(row.name) }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'Failed to load location data. Please try again.' })
  }
}

export function fetchDeliveryCities() {
  return fetchPlaces(`/provinces/${DELIVERY_PROVINCE_CODE}/cities-municipalities/`)
}

export function fetchBarangays(cityCode: string) {
  return fetchPlaces(`/cities-municipalities/${cityCode}/barangays/`)
}
