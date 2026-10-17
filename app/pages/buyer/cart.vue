<template>
  <div class="pb-40 pt-4 md:pt-8 lg:pb-12">
    <div class="flex items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-shop-ink md:text-3xl">Your cart</h1>
        <p v-if="cartItems.length" class="mt-1 text-sm text-gray-500">
          {{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }} from {{ shopCount }} {{ shopCount === 1 ? 'shop' : 'shops' }}
        </p>
      </div>
      <NuxtLink v-if="cartItems.length" to="/" class="text-sm font-semibold text-farm-leaf hover:text-farm-deep">Keep shopping</NuxtLink>
    </div>

    <p v-if="pending && !cartData" class="py-24 text-center text-sm text-gray-400">Loading…</p>

    <!-- Empty -->
    <div v-else-if="!cartItems.length" class="mt-6 rounded-lg bg-shop-mint px-6 py-14 text-center">
      <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-farm-leaf">
        <Icon name="heroicons:shopping-cart" class="h-7 w-7" />
      </span>
      <p class="mt-4 text-base font-semibold text-shop-ink">Your cart is empty</p>
      <p class="mt-1 text-sm text-gray-500">Fresh produce from local farmers is waiting.</p>
      <NuxtLink to="/" class="mt-5 inline-flex min-h-[44px] items-center rounded bg-farm-leaf px-6 text-sm font-semibold text-white hover:bg-farm-deep">
        Browse products
      </NuxtLink>
    </div>

    <div v-else class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
      <!-- Shops -->
      <div class="space-y-4">
        <section
          v-for="group in groups"
          :key="group.sellerId"
          class="overflow-hidden rounded-lg border border-gray-100"
        >
          <!-- Shop header -->
          <div class="flex items-center gap-3 bg-shop-mint px-4 py-3">
            <input
              type="checkbox"
              class="check"
              :checked="isGroupChecked(group)"
              :disabled="!group.items.some(isBuyable)"
              :aria-label="`Select all from ${group.shopName}`"
              @change="toggleGroup(group)"
            >
            <AccountAvatar :name="group.shopName" :url="group.shopAvatar" class="h-8 w-8 rounded-full bg-farm-leaf text-xs text-white" />
            <NuxtLink
              :to="`/buyer/shop/${group.sellerId}`"
              class="min-w-0 flex-1 truncate text-sm font-semibold text-shop-ink hover:text-farm-leaf"
            >
              {{ group.shopName }}
            </NuxtLink>
            <Icon name="heroicons:chevron-right" class="h-4 w-4 flex-shrink-0 text-gray-400" />
          </div>

          <!-- Items -->
          <ul class="divide-y divide-gray-100">
            <li v-for="item in group.items" :key="item.id" class="flex gap-3 px-4 py-4" :class="{ 'bg-gray-50/60': !isBuyable(item) }">
              <input
                v-model="checkedItemIds"
                type="checkbox"
                class="check mt-7"
                :value="item.id"
                :disabled="!isBuyable(item)"
                :aria-label="`Select ${item.products!.name}`"
              >

              <NuxtLink :to="`/buyer/product/${item.products!.id}`" class="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-shop-cream md:h-24 md:w-24">
                <img
                  :src="item.products!.image_url || fallbackProductImage(item.products!.category)"
                  :alt="item.products!.name"
                  loading="lazy"
                  class="h-full w-full object-cover"
                  :class="{ 'opacity-50': !isBuyable(item) }"
                >
              </NuxtLink>

              <div class="flex min-w-0 flex-1 flex-col">
                <div class="flex items-start justify-between gap-2">
                  <NuxtLink :to="`/buyer/product/${item.products!.id}`" class="min-w-0">
                    <h3 class="line-clamp-2 text-sm font-medium text-shop-ink hover:text-farm-leaf">{{ item.products!.name }}</h3>
                  </NuxtLink>
                  <button
                    type="button"
                    class="-mr-2 -mt-2 flex h-10 w-10 flex-shrink-0 items-center justify-center text-gray-400 hover:text-red-600"
                    :aria-label="`Remove ${item.products!.name}`"
                    :disabled="busyId === item.id"
                    @click="deleteItem(item)"
                  >
                    <Icon name="heroicons:trash" class="h-[18px] w-[18px]" />
                  </button>
                </div>

                <p class="text-sm tabular-nums">
                  <span class="font-semibold text-farm-leaf">{{ formatPeso(item.products!.price) }}</span>
                  <span class="text-xs text-gray-400"> / {{ unitOf(item) }}</span>
                </p>

                <p v-if="stockOf(item) <= 0" class="mt-1 text-xs font-medium text-red-600">Sold out. Remove it to continue.</p>
                <p v-else-if="item.quantity > stockOf(item)" class="mt-1 text-xs font-medium text-market-orange">
                  Only {{ stockOf(item) }} left. Lower the quantity.
                </p>
                <p v-else-if="stockOf(item) <= 5" class="mt-1 text-xs text-market-orange">Only {{ stockOf(item) }} left</p>

                <div class="mt-auto flex items-center justify-between gap-2 pt-2">
                  <div v-if="stockOf(item) > 0" class="qty">
                    <button
                      type="button"
                      class="qty-btn"
                      aria-label="Decrease quantity"
                      :disabled="item.quantity <= 1 || busyId === item.id"
                      @click="updateQty(item, item.quantity - 1)"
                    >
                      <Icon name="heroicons:minus" class="h-4 w-4" />
                    </button>
                    <span class="qty-value">{{ item.quantity }}</span>
                    <button
                      type="button"
                      class="qty-btn"
                      aria-label="Increase quantity"
                      :disabled="item.quantity >= stockOf(item) || busyId === item.id"
                      @click="updateQty(item, item.quantity + 1)"
                    >
                      <Icon name="heroicons:plus" class="h-4 w-4" />
                    </button>
                  </div>
                  <span v-else />
                  <span class="text-sm font-semibold tabular-nums text-shop-ink">{{ formatPeso(lineTotal(item)) }}</span>
                </div>
              </div>
            </li>
          </ul>

          <div class="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm">
            <span class="text-gray-500">Shop subtotal</span>
            <span class="font-semibold tabular-nums text-shop-ink">{{ formatPeso(groupSubtotal(group)) }}</span>
          </div>
        </section>
      </div>

      <!-- Desktop summary -->
      <aside class="hidden rounded-lg bg-shop-cream p-5 lg:sticky lg:top-6 lg:block">
        <h2 class="text-base font-semibold text-shop-ink">Order summary</h2>
        <label class="mt-4 flex cursor-pointer items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" class="check" :checked="isAllChecked" :disabled="!buyableItems.length" @change="toggleSelectAll">
          Select all ({{ buyableItems.length }})
        </label>
        <dl class="mt-4 space-y-2 border-t border-black/5 pt-4 text-sm">
          <div class="flex justify-between">
            <dt class="text-gray-500">Items selected</dt>
            <dd class="tabular-nums text-shop-ink">{{ selectedCount }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-500">Subtotal</dt>
            <dd class="tabular-nums text-shop-ink">{{ formatPeso(totalCheckoutPrice) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-500">Delivery</dt>
            <dd class="text-gray-500">At checkout</dd>
          </div>
        </dl>
        <div class="mt-4 flex items-baseline justify-between border-t border-black/5 pt-4">
          <span class="text-sm font-semibold text-shop-ink">Total</span>
          <span class="text-2xl font-bold tabular-nums text-farm-leaf">{{ formatPeso(totalCheckoutPrice) }}</span>
        </div>
        <button type="button" class="btn-checkout mt-4 w-full" :disabled="!canCheckout" @click="checkout">
          {{ submittingCheckout ? 'Please wait…' : `Check out (${selectedCount})` }}
        </button>
        <p class="mt-3 flex items-start gap-2 text-xs text-gray-500">
          <Icon name="heroicons:banknotes" class="h-4 w-4 flex-shrink-0 text-farm-leaf" />
          Cash on delivery. The delivery fee is based on distance and shown at checkout.
        </p>
      </aside>
    </div>

    <!-- Phones: total + checkout, above the tab bar -->
    <div v-if="cartItems.length" class="checkout-bar lg:hidden">
      <div class="mx-auto flex max-w-page items-center gap-3 px-4 py-2.5">
        <label class="flex flex-shrink-0 cursor-pointer flex-col items-center text-[11px] text-gray-500">
          <input type="checkbox" class="check" :checked="isAllChecked" :disabled="!buyableItems.length" aria-label="Select all" @change="toggleSelectAll">
          All
        </label>
        <div class="min-w-0 flex-1">
          <p class="text-xs text-gray-500">Total · delivery at checkout</p>
          <p class="truncate text-lg font-bold tabular-nums text-farm-leaf">{{ formatPeso(totalCheckoutPrice) }}</p>
        </div>
        <button type="button" class="btn-checkout flex-shrink-0" :disabled="!canCheckout" @click="checkout">
          Check out ({{ selectedCount }})
        </button>
      </div>
    </div>

    <BuyerToast :show="toast.show" :message="toast.message" :type="toast.type" @close="toast.show = false" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'buyer' })

interface CartProduct {
  id: string
  name: string
  price: string | number
  image_url?: string | null
  category?: string
  stock?: number
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

const api = useApiFetch()
const { requireAddressOrRedirect } = useShippingAddressGuard()
const refreshCartCount = inject<(() => void) | undefined>('refreshCartCount')

const checkedItemIds = ref<string[]>([])
const submittingCheckout = ref(false)
const busyId = ref<string | null>(null)

const { data: cartData, pending, refresh } = await useAsyncData(
  'buyer:cart-items',
  () => api<{ cart_items?: CartLineItem[] } | CartLineItem[]>('/api/cart'),
  { server: false },
)

const cartItems = computed<CartLineItem[]>(() => {
  const data = cartData.value
  const list = !data ? [] : Array.isArray(data) ? data : data.cart_items ?? []
  return list.filter(item => item?.products?.id)
})

const stockOf = (item: CartLineItem) => Number(item.products?.stock ?? 0)
const unitOf = (item: CartLineItem) => item.products?.unit_type || 'pc'
const isBuyable = (item: CartLineItem) => stockOf(item) > 0 && item.quantity <= stockOf(item)
const lineTotal = (item: CartLineItem) => Number(item.products?.price ?? 0) * (item.quantity ?? 1)

const groups = computed<ShopGroup[]>(() => {
  const map = new Map<string, ShopGroup>()
  for (const item of cartItems.value) {
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

const itemCount = computed(() => cartItems.value.length)
const shopCount = computed(() => groups.value.length)
const buyableItems = computed(() => cartItems.value.filter(isBuyable))

// Select everything that can be bought when the cart first loads, and drop
// selections for items that were removed or became unavailable.
let initialised = false
watch(cartItems, (items) => {
  const buyable = new Set(items.filter(isBuyable).map(i => i.id))
  if (!initialised && items.length) {
    checkedItemIds.value = [...buyable]
    initialised = true
    return
  }
  checkedItemIds.value = checkedItemIds.value.filter(id => buyable.has(id))
}, { immediate: true })

const selectedItems = computed(() => cartItems.value.filter(i => checkedItemIds.value.includes(i.id)))
const selectedCount = computed(() => selectedItems.value.length)
const totalCheckoutPrice = computed(() => selectedItems.value.reduce((sum, i) => sum + lineTotal(i), 0))
const canCheckout = computed(() => selectedCount.value > 0 && !submittingCheckout.value)

const isAllChecked = computed(() =>
  buyableItems.value.length > 0 && buyableItems.value.every(i => checkedItemIds.value.includes(i.id)),
)

function toggleSelectAll() {
  checkedItemIds.value = isAllChecked.value ? [] : buyableItems.value.map(i => i.id)
}

function isGroupChecked(group: ShopGroup) {
  const buyable = group.items.filter(isBuyable)
  return buyable.length > 0 && buyable.every(i => checkedItemIds.value.includes(i.id))
}

function toggleGroup(group: ShopGroup) {
  const ids = group.items.filter(isBuyable).map(i => i.id)
  if (isGroupChecked(group)) {
    checkedItemIds.value = checkedItemIds.value.filter(id => !ids.includes(id))
  }
  else {
    checkedItemIds.value = [...new Set([...checkedItemIds.value, ...ids])]
  }
}

function groupSubtotal(group: ShopGroup) {
  return group.items.filter(i => checkedItemIds.value.includes(i.id)).reduce((sum, i) => sum + lineTotal(i), 0)
}

function errorMessage(err: unknown, fallback: string) {
  return (err as { data?: { statusMessage?: string } }).data?.statusMessage || fallback
}

async function updateQty(item: CartLineItem, newQty: number) {
  const productId = item.products?.id
  if (!productId || newQty < 1) return
  busyId.value = item.id
  try {
    await api('/api/cart/add', {
      method: 'POST',
      body: { product_id: productId, quantity: newQty, is_update: true },
    })
    await refresh()
  }
  catch (err: unknown) {
    triggerToast(errorMessage(err, 'Failed to update quantity'), 'error')
  }
  finally {
    busyId.value = null
  }
}

async function deleteItem(item: CartLineItem) {
  busyId.value = item.id
  try {
    await api(`/api/cart/${item.id}`, { method: 'DELETE' })
    triggerToast(`${item.products?.name ?? 'Item'} removed.`)
    await refresh()
    refreshCartCount?.()
  }
  catch (err: unknown) {
    triggerToast(errorMessage(err, 'Failed to remove item'), 'error')
  }
  finally {
    busyId.value = null
  }
}

async function checkout() {
  if (!canCheckout.value) return
  submittingCheckout.value = true
  try {
    const canProceed = await requireAddressOrRedirect((message) => {
      triggerToast(message, 'error')
    })
    if (!canProceed) return

    await navigateTo({
      path: '/buyer/checkout',
      query: { items: checkedItemIds.value.join(',') },
    })
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

useHead({ title: 'Cart — NFWM' })
</script>

<style scoped>
.check {
  @apply h-5 w-5 flex-shrink-0 cursor-pointer rounded border-gray-300 accent-farm-leaf disabled:cursor-not-allowed disabled:opacity-40;
}
.qty {
  @apply inline-flex items-center rounded border border-gray-200;
}
.qty-btn {
  @apply flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:text-farm-leaf disabled:text-gray-300;
}
.qty-value {
  @apply w-8 text-center text-sm font-semibold tabular-nums text-shop-ink;
}
.btn-checkout {
  @apply inline-flex min-h-[44px] items-center justify-center rounded bg-market-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-[#cf6d17] disabled:cursor-not-allowed disabled:opacity-50;
}

/* Sits right above the buyer tab bar on phones (same as the product page) */
.checkout-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(60px + env(safe-area-inset-bottom, 0px));
  z-index: 40;
  background: #ffffff;
  border-top: 1px solid #f3f4f6;
}
@media (min-width: 768px) {
  .checkout-bar {
    bottom: 0;
  }
}
</style>
