<template>
  <div class="pb-40 pt-4 md:pt-8 lg:pb-12">
    <h1 class="text-2xl font-bold text-shop-ink md:text-3xl">Checkout</h1>
    <p class="mt-1 text-sm text-gray-500">Check your address and items, then place your order.</p>

    <p v-if="(pendingCart && !cartData) || (pendingAddresses && !addressesData)" class="py-24 text-center text-sm text-gray-400">
      Loading…
    </p>

    <!-- Nothing to check out -->
    <div v-else-if="!checkedCartItems.length" class="mt-6 rounded-lg bg-shop-mint px-6 py-14 text-center">
      <p class="text-base font-semibold text-shop-ink">No items to check out</p>
      <p class="mt-1 text-sm text-gray-500">They may have been ordered already or removed from your cart.</p>
      <NuxtLink to="/buyer/cart" class="mt-5 inline-flex min-h-[44px] items-center rounded bg-farm-leaf px-6 text-sm font-semibold text-white hover:bg-farm-deep">
        Back to cart
      </NuxtLink>
    </div>

    <div v-else class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px] lg:items-start lg:gap-6">
      <div class="space-y-4">
        <!-- 1. Delivery address -->
        <section class="overflow-hidden rounded-lg border border-gray-100">
          <div class="step-head">
            <span class="step-num">1</span>
            <h2 class="flex-1 text-sm font-semibold text-shop-ink">Deliver to</h2>
            <button v-if="addresses.length" type="button" class="text-sm font-semibold text-farm-leaf hover:text-farm-deep" @click="showAddressSheet = true">
              Change
            </button>
          </div>

          <div v-if="activeAddress" class="flex gap-3 px-4 py-4">
            <Icon name="heroicons:map-pin-solid" class="mt-0.5 h-5 w-5 flex-shrink-0 text-market-orange" />
            <div class="min-w-0">
              <p class="text-sm font-semibold text-shop-ink">
                {{ activeAddress.full_name }}
                <span class="font-normal text-gray-500">· {{ activeAddress.phone_number }}</span>
              </p>
              <p class="mt-0.5 text-sm leading-snug text-gray-600">
                {{ activeAddress.detailed_address }}, Brgy. {{ activeAddress.barangay }}, {{ activeAddress.city }}
              </p>
            </div>
          </div>
          <div v-else class="px-4 py-5 text-center">
            <p class="text-sm text-gray-600">You don't have a delivery address yet.</p>
            <NuxtLink :to="addAddressLink" class="mt-3 inline-flex min-h-[44px] items-center rounded bg-farm-leaf px-5 text-sm font-semibold text-white hover:bg-farm-deep">
              Add address
            </NuxtLink>
          </div>
        </section>

        <!-- 2. Items, one card per shop -->
        <section class="overflow-hidden rounded-lg border border-gray-100">
          <div class="step-head">
            <span class="step-num">2</span>
            <h2 class="flex-1 text-sm font-semibold text-shop-ink">Your items</h2>
            <NuxtLink to="/buyer/cart" class="text-sm font-semibold text-farm-leaf hover:text-farm-deep">Edit</NuxtLink>
          </div>

          <div v-for="group in groups" :key="group.sellerId" class="border-t border-gray-100 first:border-t-0">
            <div class="flex items-center gap-2 px-4 pb-1 pt-3">
              <AccountAvatar :name="group.shopName" :url="group.shopAvatar" class="h-6 w-6 rounded-full bg-farm-leaf text-[10px] text-white" />
              <p class="min-w-0 flex-1 truncate text-sm font-semibold text-shop-ink">{{ group.shopName }}</p>
            </div>

            <ul class="divide-y divide-gray-50">
              <li v-for="item in group.items" :key="item.id" class="flex items-center gap-3 px-4 py-3">
                <img
                  :src="item.products!.image_url || fallbackProductImage(item.products!.category)"
                  :alt="item.products!.name"
                  loading="lazy"
                  class="h-14 w-14 flex-shrink-0 rounded bg-shop-cream object-cover"
                >
                <div class="min-w-0 flex-1">
                  <p class="line-clamp-2 text-sm text-shop-ink">{{ item.products!.name }}</p>
                  <p class="text-xs tabular-nums text-gray-500">
                    {{ item.quantity }} × {{ formatPeso(item.products!.price) }} / {{ item.products!.unit_type || 'pc' }}
                  </p>
                </div>
                <p class="flex-shrink-0 text-sm font-semibold tabular-nums text-shop-ink">{{ formatPeso(lineTotal(item)) }}</p>
              </li>
            </ul>
          </div>
        </section>

        <!-- 3. Payment -->
        <section class="overflow-hidden rounded-lg border border-gray-100">
          <div class="step-head">
            <span class="step-num">3</span>
            <h2 class="flex-1 text-sm font-semibold text-shop-ink">Payment</h2>
          </div>
          <div class="flex items-center gap-3 px-4 py-4">
            <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-shop-mint text-farm-leaf">
              <Icon name="heroicons:banknotes" class="h-5 w-5" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-shop-ink">Cash on delivery</p>
              <p class="text-xs text-gray-500">Pay the rider when your order arrives.</p>
            </div>
            <Icon name="heroicons:check-circle-solid" class="h-6 w-6 flex-shrink-0 text-farm-leaf" />
          </div>
        </section>
      </div>

      <!-- Summary: in the page on phones, sticky on the right on desktop -->
      <!-- Receipt-style summary: everything the buyer pays, and how delivery is calculated -->
      <aside class="overflow-hidden rounded-lg border border-gray-100 lg:sticky lg:top-6">
        <div class="bg-farm-deep px-4 py-3 text-white md:px-5">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold">Order summary</h2>
            <span class="text-xs text-white/70">{{ today }}</span>
          </div>
          <p class="mt-0.5 text-xs text-white/70">Cash on delivery · {{ totalUnits }} {{ totalUnits === 1 ? 'item' : 'items' }} · {{ shopCount }} {{ shopCount === 1 ? 'shop' : 'shops' }}</p>
        </div>

        <div class="space-y-4 bg-white px-4 py-4 md:px-5">
          <!-- Deliver to -->
          <div v-if="activeAddress" class="text-xs leading-snug">
            <p class="font-semibold uppercase tracking-wide text-gray-400">Deliver to</p>
            <p class="mt-1 text-sm text-shop-ink">{{ activeAddress.full_name }} · {{ activeAddress.phone_number }}</p>
            <p class="text-gray-500">{{ activeAddress.detailed_address }}, Brgy. {{ activeAddress.barangay }}, {{ activeAddress.city }}</p>
          </div>

          <!-- Delivery rate -->
          <div class="flex items-center justify-between gap-3 rounded bg-shop-mint px-3 py-2 text-sm">
            <span class="flex items-center gap-2 text-farm-deep">
              <Icon name="heroicons:truck" class="h-4 w-4" />
              Delivery rate
            </span>
            <span class="font-semibold tabular-nums text-farm-deep">
              {{ deliveryQuote ? `${formatPeso(deliveryQuote.rate_per_km)} / km` : quotingDelivery ? 'Loading…' : '—' }}
            </span>
          </div>

          <!-- Per shop -->
          <div v-for="group in groups" :key="group.sellerId" class="border-t border-dashed border-gray-200 pt-3 text-sm">
            <p class="font-semibold text-shop-ink">{{ group.shopName }}</p>
            <ul class="mt-1.5 space-y-1">
              <li v-for="item in group.items" :key="item.id" class="flex justify-between gap-3">
                <span class="min-w-0 text-gray-600">
                  <span class="tabular-nums">{{ item.quantity }}×</span> {{ item.products!.name }}
                </span>
                <span class="flex-shrink-0 tabular-nums text-shop-ink">{{ formatPeso(lineTotal(item)) }}</span>
              </li>
            </ul>
            <div class="mt-1.5 flex justify-between gap-3 text-gray-500">
              <span>Shop subtotal</span>
              <span class="tabular-nums">{{ formatPeso(groupSubtotal(group)) }}</span>
            </div>
            <div class="mt-1 flex justify-between gap-3">
              <span class="min-w-0 text-gray-500">
                Delivery
                <span class="block text-xs tabular-nums" :class="shopDelivery(group.sellerId)?.flat_reason ? 'text-market-orange' : 'text-gray-400'">
                  {{ deliveryMath(group.sellerId) }}
                </span>
              </span>
              <span class="flex-shrink-0 tabular-nums text-shop-ink">
                {{ shopDelivery(group.sellerId) ? formatPeso(shopDelivery(group.sellerId)!.fee) : '—' }}
              </span>
            </div>
          </div>

          <!-- Totals -->
          <dl class="space-y-1.5 border-t border-dashed border-gray-200 pt-3 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500">Items subtotal</dt>
              <dd class="tabular-nums text-shop-ink">{{ formatPeso(itemsSubtotal) }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-gray-500">Delivery fee{{ shopCount > 1 ? ` (${shopCount} shops)` : '' }}</dt>
              <dd class="tabular-nums text-shop-ink">{{ deliveryLabel }}</dd>
            </div>
          </dl>
          <div class="flex items-baseline justify-between gap-3 border-t border-gray-200 pt-3">
            <span class="text-sm font-semibold text-shop-ink">Total to pay</span>
            <span class="text-2xl font-bold tabular-nums text-farm-leaf">{{ formatPeso(totalCheckoutPrice) }}</span>
          </div>

          <p v-if="quoteFailed" class="rounded bg-market-orange/10 px-3 py-2 text-xs text-market-orange">
            We couldn't calculate the delivery fee right now. It will be added when you place the order.
          </p>
          <p v-else class="text-xs leading-relaxed text-gray-400">
            Delivery = rate per km × straight-line distance from each shop to your pinned address.
            <template v-if="shopCount > 1">Each shop is a separate pickup, so each has its own fee.</template>
            <template v-if="hasFlatFee"> Without a map pin, a flat {{ deliveryQuote ? formatPeso(deliveryQuote.fallback_fee) : '' }} fee is used.</template>
          </p>

          <button type="button" class="btn-place hidden w-full lg:inline-flex" :disabled="!canPlaceOrder" @click="checkout">
            {{ placeLabel }}
          </button>
        </div>
      </aside>
    </div>

    <!-- Phones: total + place order, above the tab bar -->
    <div v-if="checkedCartItems.length" class="place-bar lg:hidden">
      <div class="mx-auto flex max-w-page items-center gap-3 px-4 py-2.5">
        <div class="min-w-0 flex-1">
          <p class="text-xs text-gray-500">Total · cash on delivery</p>
          <p class="truncate text-lg font-bold tabular-nums text-farm-leaf">{{ formatPeso(totalCheckoutPrice) }}</p>
        </div>
        <button type="button" class="btn-place flex-shrink-0" :disabled="!canPlaceOrder" @click="checkout">
          {{ placeLabel }}
        </button>
      </div>
    </div>

    <!-- Address picker: bottom sheet on phones, dialog on desktop -->
    <UiSheet :open="showAddressSheet" title="Choose address" @close="showAddressSheet = false">
      <ul class="space-y-2">
        <li v-for="addr in addresses" :key="addr.id">
          <label
            class="flex cursor-pointer items-start gap-3 rounded-md border p-3"
            :class="selectedAddressId === addr.id ? 'border-farm-leaf bg-shop-mint' : 'border-gray-200'"
          >
            <input v-model="selectedAddressId" type="radio" name="address" :value="addr.id" class="mt-0.5 h-5 w-5 flex-shrink-0 accent-farm-leaf">
            <span class="min-w-0">
              <span class="flex flex-wrap items-center gap-2 text-sm font-semibold text-shop-ink">
                {{ addr.full_name }}
                <span v-if="addr.is_default" class="rounded-full bg-market-orange/10 px-2 py-0.5 text-[11px] font-medium text-market-orange">Default</span>
              </span>
              <span class="block text-sm text-gray-500">{{ addr.phone_number }}</span>
              <span class="mt-0.5 block text-sm leading-snug text-gray-600">
                {{ addr.detailed_address }}, Brgy. {{ addr.barangay }}, {{ addr.city }}
              </span>
            </span>
          </label>
        </li>
      </ul>
      <template #footer>
        <div class="flex gap-2">
          <NuxtLink :to="addAddressLink" class="inline-flex min-h-[44px] flex-1 items-center justify-center rounded border border-farm-leaf text-sm font-semibold text-farm-leaf hover:bg-shop-mint">
            Add new address
          </NuxtLink>
          <button type="button" class="inline-flex min-h-[44px] flex-1 items-center justify-center rounded bg-farm-leaf text-sm font-semibold text-white hover:bg-farm-deep" @click="showAddressSheet = false">
            Use this address
          </button>
        </div>
      </template>
    </UiSheet>

    <BuyerToast :show="toast.show" :message="toast.message" :type="toast.type" @close="toast.show = false" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'buyer' })

interface Address {
  id: string
  full_name: string
  phone_number: string
  city: string
  barangay: string
  detailed_address: string
  is_default: boolean
}

interface CartProduct {
  id: string
  name: string
  price: string | number
  image_url?: string | null
  category?: string
  unit_type?: string | null
  users?: { id?: string; full_name?: string; shop_name?: string | null; shop_avatar_url?: string | null }
}

interface CartLineItem {
  id: string
  quantity: number
  products?: CartProduct
}

interface ShopGroup {
  sellerId: string
  shopName: string
  shopAvatar?: string | null
  items: CartLineItem[]
}

interface DeliveryQuote {
  rate_per_km: number
  fallback_fee: number
  fee: number
  shops: {
    seller_id: string
    distance_km: number | null
    fee: number
    flat_reason?: 'no_buyer_pin' | 'no_shop_pin' | null
  }[]
}

const router = useRouter()
const route = useRoute()
const api = useApiFetch()
const refreshCartCount = inject<(() => void) | undefined>('refreshCartCount')

const checkedItemIds = computed(() => {
  const items = route.query.items
  if (!items) return []
  return String(items).split(',').filter(Boolean)
})

// Come back here after adding an address.
const addAddressLink = computed(() => ({ path: '/buyer/profile/addresses', query: { redirect: route.fullPath } }))

const submittingCheckout = ref(false)
const orderPlaced = ref(false)
const showAddressSheet = ref(false)
const selectedAddressId = ref<string | null>(null)

// Addresses
const { data: addressesData, pending: pendingAddresses } = await useAsyncData(
  'buyer:addresses-checkout',
  () => api<Address[] | { addresses: Address[] }>('/api/buyer/addresses'),
  { server: false },
)

const addresses = computed<Address[]>(() => {
  const raw = addressesData.value
  if (!raw) return []
  return Array.isArray(raw) ? raw : raw.addresses ?? []
})
const activeAddress = computed(() => addresses.value.find(a => a.id === selectedAddressId.value) ?? null)

watchEffect(() => {
  if (!selectedAddressId.value && addresses.value.length > 0) {
    const defaultAddr = addresses.value.find(a => a.is_default)
    selectedAddressId.value = defaultAddr ? defaultAddr.id : addresses.value[0]!.id
  }
})

// Cart items picked on the cart page
const { data: cartData, pending: pendingCart, refresh } = await useAsyncData(
  'buyer:cart-items-checkout',
  () => api<{ cart_items?: CartLineItem[] } | CartLineItem[]>('/api/cart'),
  { server: false },
)

const cartItems = computed<CartLineItem[]>(() => {
  const data = cartData.value
  const list = !data ? [] : Array.isArray(data) ? data : data.cart_items ?? []
  return list.filter(item => item?.products?.id)
})

const checkedCartItems = computed(() => cartItems.value.filter(item => checkedItemIds.value.includes(item.id)))

const groups = computed<ShopGroup[]>(() => {
  const map = new Map<string, ShopGroup>()
  for (const item of checkedCartItems.value) {
    const seller = item.products?.users
    const sellerId = seller?.id ?? 'unknown'
    if (!map.has(sellerId)) {
      map.set(sellerId, {
        sellerId,
        shopName: seller?.shop_name || seller?.full_name || 'Local seller',
        shopAvatar: seller?.shop_avatar_url,
        items: [],
      })
    }
    map.get(sellerId)!.items.push(item)
  }
  return [...map.values()]
})

const shopCount = computed(() => groups.value.length)
const lineTotal = (item: CartLineItem) => Number(item.products?.price ?? 0) * (item.quantity ?? 1)
const itemsSubtotal = computed(() => checkedCartItems.value.reduce((sum, i) => sum + lineTotal(i), 0))
const totalUnits = computed(() => checkedCartItems.value.reduce((sum, i) => sum + (i.quantity ?? 1), 0))

// Rate per km (set by admin) × distance from each shop to the selected address.
// The server recalculates this at checkout; this is the preview.
const deliveryQuote = ref<DeliveryQuote | null>(null)
const quotingDelivery = ref(false)
const quoteFailed = ref(false)

watch(
  [selectedAddressId, () => checkedCartItems.value.map(i => i.id).join(',')],
  async ([addressId, itemIds]) => {
    quoteFailed.value = false
    if (!addressId || !itemIds) {
      deliveryQuote.value = null
      return
    }
    quotingDelivery.value = true
    try {
      deliveryQuote.value = await api<DeliveryQuote>('/api/cart/delivery-quote', {
        method: 'POST',
        body: { cart_item_ids: itemIds.split(','), address_id: addressId },
      })
    }
    catch {
      deliveryQuote.value = null
      quoteFailed.value = true
    }
    finally {
      quotingDelivery.value = false
    }
  },
  { immediate: true },
)

const deliveryFee = computed(() => deliveryQuote.value?.fee ?? 0)
const totalCheckoutPrice = computed(() => itemsSubtotal.value + deliveryFee.value)

const deliveryLabel = computed(() => {
  if (quotingDelivery.value) return 'Calculating…'
  if (!deliveryQuote.value) return '—'
  return formatPeso(deliveryFee.value)
})

function shopDelivery(sellerId: string) {
  return deliveryQuote.value?.shops.find(s => s.seller_id === sellerId) ?? null
}

/** The calculation shown under each shop's delivery line, e.g. "3.2 km × ₱15.00/km". */
function deliveryMath(sellerId: string) {
  if (quotingDelivery.value) return 'Calculating…'
  const shop = shopDelivery(sellerId)
  const quote = deliveryQuote.value
  if (!shop || !quote) return 'Not calculated yet'
  if (shop.flat_reason === 'no_buyer_pin') return 'Flat fee: your address has no map pin'
  if (shop.flat_reason === 'no_shop_pin' || shop.distance_km == null) return 'Flat fee: shop has no map pin'
  return `${shop.distance_km} km × ${formatPeso(quote.rate_per_km)}/km`
}

const hasFlatFee = computed(() => (deliveryQuote.value?.shops ?? []).some(s => s.distance_km == null))

function groupSubtotal(group: ShopGroup) {
  return group.items.reduce((sum, i) => sum + lineTotal(i), 0)
}

const today = new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

const canPlaceOrder = computed(() =>
  !!selectedAddressId.value
  && checkedCartItems.value.length > 0
  && !quotingDelivery.value
  && !submittingCheckout.value
  && !orderPlaced.value,
)

const placeLabel = computed(() => {
  if (orderPlaced.value) return 'Order placed'
  if (submittingCheckout.value) return 'Placing order…'
  if (!selectedAddressId.value) return 'Add an address'
  return 'Place order'
})

async function checkout() {
  if (!canPlaceOrder.value) return

  submittingCheckout.value = true
  try {
    const data = await api<{ success: boolean; total_amount: number }>('/api/cart/checkout', {
      method: 'POST',
      body: {
        cart_item_ids: checkedItemIds.value,
        address_id: selectedAddressId.value,
      },
    })
    orderPlaced.value = true
    triggerToast(`Order placed. Total ${formatPeso(data.total_amount)}, cash on delivery.`)
    refreshCartCount?.()
    setTimeout(() => router.push('/buyer/orders'), 1500)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Checkout failed', 'error')
    refresh()
  }
  finally {
    submittingCheckout.value = false
  }
}

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 4000)
}

useHead({ title: 'Checkout — NFWM' })
</script>

<style scoped>
.step-head {
  @apply flex items-center gap-3 bg-shop-mint px-4 py-3;
}
.step-num {
  @apply flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-farm-leaf text-xs font-semibold text-white;
}
.btn-place {
  @apply inline-flex min-h-[48px] items-center justify-center rounded bg-market-orange px-6 text-sm font-semibold text-white transition-colors hover:bg-[#cf6d17] disabled:cursor-not-allowed disabled:opacity-50;
}

/* Sits right above the buyer tab bar on phones (same as cart and product pages) */
.place-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(60px + env(safe-area-inset-bottom, 0px));
  z-index: 40;
  background: #ffffff;
  border-top: 1px solid #f3f4f6;
}
@media (min-width: 768px) {
  .place-bar {
    bottom: 0;
  }
}
</style>
