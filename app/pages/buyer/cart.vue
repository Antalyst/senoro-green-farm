<template>
  <div class="py-8 md:py-12 space-y-10">
      <header class="border-b border-farm-light pb-8">
        <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-2">
          Checkout
        </p>
        <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight">
          Your cart
        </h1>
      </header>

      <div v-if="pending" class="py-24 text-center">
        <Icon name="heroicons:arrow-path" class="w-6 h-6 text-farm-leaf animate-spin mx-auto" />
        <p class="mt-3 text-xs text-farm-dark/45">Loading cart…</p>
      </div>

      <div v-else-if="cartItems.length === 0" class="py-24 text-center border border-farm-light">
        <p class="text-sm font-medium text-farm-dark">Your cart is empty</p>
        <p class="text-xs text-farm-dark/45 mt-2">Discover fresh produce from local farms.</p>
        <NuxtLink
          to="/"
          class="inline-block mt-6 px-6 py-2.5 border border-farm-deep text-farm-deep text-[10px] font-medium tracking-[0.14em] uppercase hover:bg-farm-deep hover:text-white transition-colors"
        >
          Browse shop
        </NuxtLink>
      </div>

      <!-- Vendor ledger groups -->
      <div v-else class="space-y-10">
        <section
          v-for="(group, sellerId) in groupedCart"
          :key="sellerId"
          class="border border-farm-light"
        >
          <!-- Vendor header -->
          <div class="flex items-center justify-between gap-4 px-4 md:px-6 py-4 bg-farm-light/30 border-b border-farm-light">
            <label class="flex items-center gap-3 cursor-pointer min-w-0">
              <input
                type="checkbox"
                :checked="isSellerAllChecked(String(sellerId))"
                class="w-4 h-4 border-farm-light text-farm-deep focus:ring-farm-leaf rounded-none accent-farm-deep"
                @change="toggleSellerSelection(String(sellerId))"
              >
              <Icon name="heroicons:building-storefront" class="w-5 h-5 text-farm-dark/50 flex-shrink-0" />
              <span class="text-base md:text-lg font-bold text-farm-dark truncate">{{ group.sellerName }}</span>
            </label>
            <NuxtLink
              :to="`/buyer/shop/${sellerId}`"
              class="text-[10px] font-bold tracking-[0.12em] uppercase text-farm-leaf hover:text-farm-deep flex-shrink-0 border border-farm-leaf px-2 py-1"
            >
              Visit shop
            </NuxtLink>
          </div>

          <!-- Line items -->
          <ul class="divide-y divide-farm-light">
            <li
              v-for="item in group.items"
              :key="item.id"
              class="px-4 md:px-6 py-5"
            >
              <template v-if="item.products">
                <div class="flex gap-4 md:gap-6">
                  <input
                    type="checkbox"
                    v-model="checkedItemIds"
                    :value="item.id"
                    class="mt-1 w-4 h-4 border-farm-light text-farm-deep accent-farm-deep rounded-none flex-shrink-0"
                  >

                  <NuxtLink
                    :to="`/buyer/product/${item.products.id}`"
                    class="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-farm-light border border-farm-light overflow-hidden flex items-center justify-center"
                  >
                    <img v-if="item.products.image_url" :src="item.products.image_url" class="w-full h-full object-cover">
                    <div v-else class="text-3xl text-farm-dark/20">
                      {{ getCategoryEmoji(item.products.category) }}
                    </div>
                  </NuxtLink>

                  <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:justify-between gap-4">
                    <div class="min-w-0 flex flex-col items-start">
                      <NuxtLink :to="`/buyer/product/${item.products.id}`">
                        <h3 class="text-base md:text-lg font-bold text-farm-dark hover:text-farm-deep transition-colors truncate">
                          {{ item.products.name }}
                        </h3>
                      </NuxtLink>
                      <div class="mt-1 flex items-center gap-2">
                        <span 
                          class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border"
                          :class="isStreetFood(item.products.category) ? 'text-market-orange border-market-orange/30 bg-market-orange/5' : 'text-farm-leaf border-farm-leaf/30 bg-farm-leaf/5'"
                        >
                          {{ isStreetFood(item.products.category) ? 'Street Food & Eats' : 'Fresh Farm Produce' }}
                        </span>
                      </div>
                      <p class="mt-auto pt-2 text-base md:text-lg font-black text-farm-dark">
                        ₱{{ formatPrice(item.products.price) }}
                      </p>
                    </div>

                    <div class="flex items-center gap-4 flex-shrink-0">
                      <div class="inline-flex border border-farm-light">
                        <button
                          type="button"
                          class="w-9 h-9 flex items-center justify-center text-farm-dark hover:bg-farm-light border-r border-farm-light disabled:opacity-30"
                          :disabled="item.quantity <= 1"
                          @click="updateQty(item, item.quantity - 1)"
                        >
                          <Icon name="heroicons:minus" class="w-3.5 h-3.5" />
                        </button>
                        <span class="w-10 h-9 flex items-center justify-center text-sm font-medium tabular-nums text-farm-dark">
                          {{ item.quantity }}
                        </span>
                        <button
                          type="button"
                          class="w-9 h-9 flex items-center justify-center text-farm-dark hover:bg-farm-light border-l border-farm-light disabled:opacity-30"
                          :disabled="item.quantity >= (item.products.stock ?? 99)"
                          @click="updateQty(item, item.quantity + 1)"
                        >
                          <Icon name="heroicons:plus" class="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        class="p-2 text-farm-dark/30 hover:text-red-600 transition-colors"
                        aria-label="Remove"
                        @click="deleteItem(item)"
                      >
                        <Icon name="heroicons:trash" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </template>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <!-- Checkout sheet -->
    <div
      v-if="cartItems.length > 0"
      class="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 bg-white border-t border-farm-light shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
    >
      <div class="max-w-page mx-auto w-full">
        <!-- Address banner removed, moved to checkout.vue -->

        <div class="px-4 md:px-8 py-4 md:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              :checked="isAllChecked"
              class="w-5 h-5 accent-farm-deep rounded-none border-2"
              @click.stop="toggleSelectAll"
            >
            <span class="text-[11px] font-bold tracking-[0.12em] uppercase text-farm-dark">Select all</span>
          </label>

          <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            <div class="text-right">
              <p class="text-[10px] font-bold tracking-[0.16em] uppercase text-farm-dark/60">Total Payment</p>
              <p class="text-2xl md:text-3xl font-black text-market-orange tabular-nums">
                ₱{{ totalCheckoutPrice.toFixed(2) }}
              </p>
            </div>
            <button
              type="button"
              :disabled="submittingCheckout || checkedItemIds.length === 0"
              class="px-8 py-4 bg-market-orange text-white text-xs md:text-sm font-black tracking-[0.14em] uppercase hover:bg-[#D35400] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 min-w-[160px] flex-shrink-0 shadow-lg shadow-market-orange/20"
              @click="checkout"
            >
              <span v-if="submittingCheckout" class="flex items-center justify-center gap-2">
                <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
                Processing
              </span>
              <span v-else>Check Out ({{ checkedItemIds.length }})</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <BuyerToast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'buyer' })

const router = useRouter()
const api = useApiFetch()
const { requireAddressOrRedirect } = useShippingAddressGuard()

const refreshCartCount = inject<(() => void) | undefined>('refreshCartCount')

const checkedItemIds = ref<string[]>([])
const submittingCheckout = ref(false)

const { data: cartData, pending, refresh } = await useAsyncData(
  'buyer:cart-items',
  () => api<{ cart_items?: CartLineItem[] } | CartLineItem[]>('/api/cart'),
  { server: false },
)

interface CartProduct {
  id: string
  name: string
  price: string | number
  image_url?: string
  category?: string
  stock?: number
  users?: { id?: string; full_name?: string }
}

interface CartLineItem {
  id: string
  quantity: number
  products?: CartProduct
}

const cartItems = computed<CartLineItem[]>(() => {
  const data = cartData.value
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.cart_items ?? []
})

const groupedCart = computed(() => {
  const groups: Record<string, { sellerName: string; items: CartLineItem[] }> = {}
  for (const item of cartItems.value) {
    const product = item?.products
    if (!product?.id) continue
    const seller = product.users
    const sellerId = seller?.id ?? 'unknown_seller'
    const sellerName = seller?.full_name ?? 'Independent Farmer'
    if (!groups[sellerId]) groups[sellerId] = { sellerName, items: [] }
    groups[sellerId].items.push(item)
  }
  return groups
})

const categoryEmojis: Record<string, string> = {
  Vegetables: '🥬', Fruits: '🍎', Organic: '🌱', Herbs: '🌿', Dairy: '🥛', Grains: '🌾',
}

function getCategoryEmoji(category?: string) {
  return categoryEmojis[category ?? ''] ?? '🌱'
}

function isStreetFood(category?: string) {
  return (category || '').startsWith('street_food_')
}

function formatPrice(price: string | number) {
  return parseFloat(String(price ?? 0)).toFixed(2)
}

const isAllChecked = computed(() => {
  if (cartItems.value.length === 0) return false
  return checkedItemIds.value.length === cartItems.value.length
})

function isSellerAllChecked(sellerId: string): boolean {
  const sellerItems = groupedCart.value[sellerId]?.items ?? []
  if (sellerItems.length === 0) return false
  return sellerItems.every(item => checkedItemIds.value.includes(item.id))
}

function toggleSellerSelection(sellerId: string) {
  const sellerItems = groupedCart.value[sellerId]?.items ?? []
  const allChecked = isSellerAllChecked(sellerId)
  if (allChecked) {
    const itemIds = sellerItems.map(i => i.id)
    checkedItemIds.value = checkedItemIds.value.filter(id => !itemIds.includes(id))
  }
  else {
    for (const item of sellerItems) {
      if (!checkedItemIds.value.includes(item.id)) checkedItemIds.value.push(item.id)
    }
  }
}

function toggleSelectAll() {
  checkedItemIds.value = isAllChecked.value ? [] : cartItems.value.map(item => item.id)
}

const totalCheckoutPrice = computed(() => {
  let total = 0
  for (const item of cartItems.value) {
    if (!checkedItemIds.value.includes(item.id)) continue
    const price = item.products?.price
    if (price == null) continue
    total += parseFloat(String(price)) * (item.quantity ?? 1)
  }
  return total
})

async function updateQty(item: CartLineItem, newQty: number) {
  const productId = item.products?.id
  if (!productId || newQty < 1) return
  try {
    await api('/api/cart/add', {
      method: 'POST',
      body: { product_id: productId, quantity: newQty, is_update: true },
    })
    refresh()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Failed to update quantity', 'error')
  }
}

async function deleteItem(item: CartLineItem) {
  try {
    await api(`/api/cart/${item.id}`, { method: 'DELETE' })
    triggerToast('Item removed.')
    checkedItemIds.value = checkedItemIds.value.filter(id => id !== item.id)
    refresh()
    refreshCartCount?.()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Failed to remove item', 'error')
  }
}

async function checkout() {
  if (checkedItemIds.value.length === 0) return

  const canProceed = await requireAddressOrRedirect((message) => {
    triggerToast(message, 'error')
  })
  if (!canProceed) return

  navigateTo({
    path: '/buyer/checkout',
    query: { items: checkedItemIds.value.join(',') }
  })
}

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 4000)
}

useHead({ title: 'Cart — Senoro Green Farm' })
</script>
