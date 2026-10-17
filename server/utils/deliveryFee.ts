import { fetchShopLocations } from './geo'

type Db = { from: (table: string) => any }

export interface DeliverySettings {
  rate_per_km: number
  fallback_fee: number
}

export interface ShopDeliveryQuote {
  seller_id: string
  /** Straight-line km from the shop to the buyer, or null when either side has no map pin. */
  distance_km: number | null
  fee: number
  /** Why the flat fallback fee was used, or null when the fee is rate × distance. */
  flat_reason: 'no_buyer_pin' | 'no_shop_pin' | null
}

export interface DeliveryQuote {
  rate_per_km: number
  fallback_fee: number
  fee: number
  shops: ShopDeliveryQuote[]
}

/** Used until migration 015 is run. */
const DEFAULT_SETTINGS: DeliverySettings = { rate_per_km: 15, fallback_fee: 50 }

export async function getDeliverySettings(supabase: Db): Promise<DeliverySettings> {
  const { data, error } = await supabase
    .from('delivery_settings')
    .select('rate_per_km, fallback_fee')
    .eq('id', 1)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('getDeliverySettings:', error.message)
    return DEFAULT_SETTINGS
  }
  return { rate_per_km: Number(data.rate_per_km), fallback_fee: Number(data.fallback_fee) }
}

/** Great-circle distance in km between two lat/lng points. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

const roundMoney = (n: number) => Math.round(n * 100) / 100

/**
 * Delivery fee = rate per km × distance from each shop to the buyer, summed over shops
 * (each shop is a separate pickup). Shops or addresses without a pin use the fallback fee.
 */
export async function quoteDeliveryFee(
  supabase: Db,
  sellerIds: string[],
  address: { latitude?: number | null; longitude?: number | null },
): Promise<DeliveryQuote> {
  const settings = await getDeliverySettings(supabase)
  const shopLocations = await fetchShopLocations(supabase, sellerIds)
  const hasBuyerPin = address.latitude != null && address.longitude != null

  const shops = sellerIds.map((sellerId): ShopDeliveryQuote => {
    const shop = shopLocations.get(sellerId)
    if (!hasBuyerPin) {
      return { seller_id: sellerId, distance_km: null, fee: settings.fallback_fee, flat_reason: 'no_buyer_pin' }
    }
    if (shop?.shop_latitude == null || shop?.shop_longitude == null) {
      return { seller_id: sellerId, distance_km: null, fee: settings.fallback_fee, flat_reason: 'no_shop_pin' }
    }
    const km = Math.round(
      distanceKm(shop.shop_latitude, shop.shop_longitude, address.latitude!, address.longitude!) * 10,
    ) / 10
    return { seller_id: sellerId, distance_km: km, fee: roundMoney(settings.rate_per_km * km), flat_reason: null }
  })

  return {
    rate_per_km: settings.rate_per_km,
    fallback_fee: settings.fallback_fee,
    fee: roundMoney(shops.reduce((sum, s) => sum + s.fee, 0)),
    shops,
  }
}
