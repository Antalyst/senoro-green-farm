import { requireAuth } from '../../utils/auth'

// Reverse geocoding with OpenStreetMap Nominatim (free).
// Usage policy: max 1 request/second, identify the app with a User-Agent, cache results.
// https://operations.osmfoundation.org/policies/nominatim/
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'
const USER_AGENT = 'NFWM-Marketplace/1.0 (+https://nfwm.vercel.app)'

interface NominatimResponse {
  display_name?: string
  address?: Record<string, string>
}

let nextSlot = 0
async function waitForRateLimit() {
  const now = Date.now()
  const wait = Math.max(0, nextSlot - now)
  nextSlot = Math.max(now, nextSlot) + 1100
  if (wait) await new Promise(resolve => setTimeout(resolve, wait))
}

const reverseGeocode = defineCachedFunction(async (lat: number, lng: number) => {
  await waitForRateLimit()

  let res: NominatimResponse
  try {
    res = await $fetch<NominatimResponse>(NOMINATIM_URL, {
      query: { format: 'jsonv2', lat, lon: lng, zoom: 18, addressdetails: 1 },
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
      timeout: 10000,
      parseResponse: JSON.parse,
    })
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'Could not look up this location. Please try again.' })
  }

  const a = res.address ?? {}
  return {
    label: res.display_name ?? '',
    road: a.road ?? a.pedestrian ?? '',
    city: a.city ?? a.town ?? a.municipality ?? '',
    // Possible barangay names, most specific first. The client matches them to the PSGC list.
    barangayCandidates: [a.village, a.suburb, a.quarter, a.neighbourhood, a.hamlet].filter(Boolean) as string[],
    postcode: a.postcode ?? '',
    inPhilippines: a.country_code === 'ph',
  }
}, {
  maxAge: 60 * 60 * 24 * 7,
  name: 'nominatim-reverse',
  getKey: (lat: number, lng: number) => `${lat},${lng}`,
})

export default defineEventHandler(async (event) => {
  // Login required so the public cannot use our server as a free geocoding proxy.
  requireAuth(event)

  const query = getQuery(event)
  const lat = Number(query.lat)
  const lng = Number(query.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw createError({ statusCode: 400, statusMessage: 'lat and lng are required' })
  }

  // Round to ~1 m so nearby pins share a cache entry.
  return await reverseGeocode(Number(lat.toFixed(5)), Number(lng.toFixed(5)))
})
