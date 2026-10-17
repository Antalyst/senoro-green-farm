<template>
  <article class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
    <!-- Summary -->
    <header class="flex items-start justify-between gap-3 px-4 pt-4">
      <div class="min-w-0">
        <p class="text-xs text-gray-400">#{{ shortId }} · {{ timeAgo }}</p>
        <p class="mt-0.5 text-sm font-semibold text-shop-ink">
          {{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }} · {{ shops.length }} {{ shops.length === 1 ? 'shop' : 'shops' }}
        </p>
      </div>
      <div class="flex-shrink-0 text-right">
        <p class="text-[10px] font-medium uppercase tracking-wide text-gray-400">Collect (COD)</p>
        <p class="text-lg font-bold leading-tight text-farm-leaf tabular-nums">{{ formatPeso(order.total_amount) }}</p>
      </div>
    </header>

    <!-- Route: pickups → drop-off -->
    <ol class="mt-3 space-y-4 px-4 pb-4">
      <li v-for="shop in shops" :key="shop.id" class="relative flex gap-3">
        <!-- Dashed line from this stop down to the next one -->
        <span class="absolute -bottom-4 left-[15px] top-9 border-l-2 border-dashed border-gray-200" aria-hidden="true" />
        <span
          class="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-4 ring-white"
          :class="shop.picked_up && showPickupProgress ? 'bg-farm-leaf text-white' : 'bg-market-orange/10 text-market-orange'"
        >
          <Icon :name="shop.picked_up && showPickupProgress ? 'heroicons:check' : 'heroicons:building-storefront'" class="h-4 w-4" />
        </span>
        <div class="min-w-0 flex-1">
          <p v-if="shop.picked_up && showPickupProgress" class="text-[10px] font-semibold uppercase tracking-wide text-farm-leaf">Picked up</p>
          <p v-else class="text-[10px] font-semibold uppercase tracking-wide text-market-orange">Pick up</p>
          <p class="truncate text-sm font-medium text-shop-ink">{{ shop.shop_name }}</p>
          <p class="text-xs leading-snug text-gray-500">
            {{ shop.shop_address || (hasPin(shop.shop_latitude, shop.shop_longitude) ? 'Pinned on map' : 'No pickup location set') }}
          </p>
        </div>
        <a
          v-if="hasPin(shop.shop_latitude, shop.shop_longitude)"
          :href="directionsUrl(shop.shop_latitude!, shop.shop_longitude!)"
          target="_blank"
          rel="noopener"
          class="chip-btn flex-shrink-0 self-center"
          :aria-label="`Navigate to ${shop.shop_name}`"
        >
          <Icon name="heroicons:map" class="h-4 w-4" />
          Shop
        </a>
      </li>

      <li class="relative flex gap-3">
        <span class="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-farm-leaf text-white ring-4 ring-white">
          <Icon name="heroicons:map-pin-solid" class="h-4 w-4" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-semibold uppercase tracking-wide text-farm-leaf">Drop off</p>
          <p class="truncate text-sm font-medium text-shop-ink">{{ recipientName }}</p>
          <template v-if="order.addresses">
            <p class="text-xs leading-snug text-gray-500">{{ order.addresses.detailed_address }}</p>
            <p class="text-xs leading-snug text-gray-500">Brgy. {{ order.addresses.barangay }}, {{ order.addresses.city }}</p>
          </template>
          <p v-else class="text-xs text-gray-400">No address on file</p>

          <div class="mt-2.5 flex flex-wrap gap-2">
            <a
              v-if="order.addresses?.phone_number"
              :href="`tel:${order.addresses.phone_number}`"
              class="chip-btn"
            >
              <Icon name="heroicons:phone" class="h-4 w-4" />
              Call
            </a>
            <a
              v-if="dropOffPin"
              :href="directionsUrl(dropOffPin.lat, dropOffPin.lng, pendingPickupPins)"
              target="_blank"
              rel="noopener"
              class="chip-btn"
            >
              <Icon name="heroicons:map" class="h-4 w-4" />
              {{ pendingPickupPins.length ? 'Navigate via shop' : 'Navigate to buyer' }}
            </a>
            <span v-else-if="order.addresses" class="inline-flex items-center gap-1 text-[11px] text-gray-400">
              <Icon name="heroicons:information-circle" class="h-4 w-4" />
              No map pin — use the address
            </span>
          </div>
        </div>
      </li>
    </ol>

    <!-- Items -->
    <details v-if="items.length" class="group border-t border-gray-100 px-4 py-3">
      <summary class="flex cursor-pointer list-none items-center justify-between text-sm text-gray-600">
        <span class="truncate">{{ itemPreview }}</span>
        <Icon name="heroicons:chevron-down" class="h-4 w-4 flex-shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <ul class="mt-2 space-y-1.5">
        <li v-for="item in items" :key="item.id" class="flex items-center justify-between gap-3 text-sm">
          <span class="truncate text-shop-ink">{{ orderItemName(item) }}</span>
          <span class="flex-shrink-0 text-gray-500 tabular-nums">× {{ item.quantity }}</span>
        </li>
      </ul>
    </details>

    <footer v-if="$slots.actions" class="border-t border-gray-100 bg-gray-50/70 p-3">
      <slot name="actions" />
    </footer>
  </article>
</template>

<script setup lang="ts">
export interface DeliveryShop {
  id: string
  shop_name: string
  shop_avatar_url: string | null
  shop_latitude?: number | null
  shop_longitude?: number | null
  shop_address?: string | null
  picked_up?: boolean
}

export interface DeliveryOrder {
  id: string
  buyer_id?: string | null
  delivery_rider_id?: string | null
  status: string
  total_amount: number | string
  created_at: string
  addresses?: {
    full_name: string
    phone_number?: string
    barangay?: string
    city?: string
    detailed_address?: string
    latitude?: number | null
    longitude?: number | null
  } | null
  users?: { full_name?: string } | null
  order_items?: { id: string; quantity: number; product_name?: string | null; products?: { name?: string } | null }[]
  shops?: DeliveryShop[]
}

const props = defineProps<{ order: DeliveryOrder }>()

const shops = computed(() => props.order.shops ?? [])
// Pickup ticks only matter once the rider owns the job (not in the open queue).
const showPickupProgress = computed(() => props.order.status === 'out_for_delivery' || (props.order.status === 'ready_for_pickup' && !!props.order.delivery_rider_id))
const items = computed(() => props.order.order_items ?? [])
const itemCount = computed(() => items.value.reduce((sum, i) => sum + Number(i.quantity), 0))
const itemPreview = computed(() => {
  const names = items.value.map(i => orderItemName(i))
  return names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2} more` : names.join(', ')
})
const shortId = computed(() => props.order.id.slice(0, 8).toUpperCase())
const recipientName = computed(() => props.order.addresses?.full_name ?? props.order.users?.full_name ?? 'Buyer')

const dropOffPin = computed(() => {
  const a = props.order.addresses
  return a && hasPin(a.latitude, a.longitude) ? { lat: a.latitude!, lng: a.longitude! } : null
})

// Shops still to visit: routed as stops before the buyer so "Navigate" follows the real job order.
const pendingPickupPins = computed(() => shops.value
  .filter(s => !(s.picked_up && showPickupProgress.value) && hasPin(s.shop_latitude, s.shop_longitude))
  .map(s => ({ lat: s.shop_latitude!, lng: s.shop_longitude! })))

const timeAgo = computed(() => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(props.order.created_at).getTime()) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return new Date(props.order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
})

function hasPin(lat?: number | null, lng?: number | null) {
  return lat != null && lng != null
}

// Free link: opens the Google Maps app on phones. Origin is the rider's current location.
function directionsUrl(lat: number, lng: number, stops: { lat: number; lng: number }[] = []) {
  const waypoints = stops.length ? `&waypoints=${encodeURIComponent(stops.map(p => `${p.lat},${p.lng}`).join('|'))}` : ''
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${waypoints}&travelmode=driving`
}
</script>

<style scoped>
.chip-btn {
  @apply inline-flex h-9 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 text-xs font-semibold text-shop-ink transition hover:border-farm-leaf hover:text-farm-leaf;
}
details summary::-webkit-details-marker {
  display: none;
}
</style>
