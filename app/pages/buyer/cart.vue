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
          to="/buyer/dashboard"
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
              <span class="text-sm font-medium text-farm-dark truncate">{{ group.sellerName }}</span>
            </label>
            <NuxtLink
              :to="`/buyer/shop/${sellerId}`"
              class="text-[10px] font-medium tracking-[0.12em] uppercase text-farm-leaf hover:text-farm-deep flex-shrink-0"
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
                    class="w-20 h-20 flex-shrink-0 bg-farm-light border border-farm-light overflow-hidden"
                  >
                    <div class="w-full h-full flex items-center justify-center text-2xl text-farm-dark/20">
                      {{ getCategoryEmoji(item.products.category) }}
                    </div>
                  </NuxtLink>

                  <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:justify-between gap-4">
                    <div class="min-w-0">
                      <NuxtLink :to="`/buyer/product/${item.products.id}`">
                        <h3 class="text-sm font-medium text-farm-dark hover:text-farm-deep transition-colors truncate">
                          {{ item.products.name }}
                        </h3>
                      </NuxtLink>
                      <p class="text-[11px] text-farm-dark/45 mt-1">{{ item.products.category }}</p>
                      <p class="mt-2 text-sm font-medium text-farm-leaf">
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
      class="fixed bottom-14 left-0 right-0 z-40 bg-white border-t border-farm-light"
    >
      <div class="max-w-page mx-auto w-full px-4 md:px-8 py-4 md:py-5">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              :checked="isAllChecked"
              class="w-4 h-4 accent-farm-deep rounded-none"
              @click.stop="toggleSelectAll"
            >
            <span class="text-[11px] font-medium tracking-[0.12em] uppercase text-farm-dark/50">Select all</span>
          </label>

          <div class="flex items-center justify-between sm:justify-end gap-6">
            <div class="text-right">
              <p class="text-[10px] font-medium tracking-[0.16em] uppercase text-farm-dark/45">Total</p>
              <p class="text-xl font-medium text-farm-leaf tabular-nums">
                ₱{{ totalCheckoutPrice.toFixed(2) }}
              </p>
            </div>
            <button
              type="button"
              :disabled="submittingCheckout || checkedItemIds.length === 0"
              class="px-8 py-3.5 bg-farm-deep text-white text-xs font-medium tracking-[0.14em] uppercase hover:bg-farm-dark transition-colors disabled:opacity-40 min-w-[140px]"
              @click="checkout"
            >
              <span v-if="submittingCheckout" class="flex items-center justify-center gap-2">
                <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
                Processing
              </span>
              <span v-else>Checkout ({{ checkedItemIds.length }})</span>
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

  submittingCheckout.value = true
  try {
    const data = await api<{ success: boolean; total_amount: number }>('/api/cart/checkout', {
      method: 'POST',
      body: { cart_item_ids: checkedItemIds.value },
    })
    triggerToast(`Order placed — ₱${data.total_amount.toFixed(2)}`)
    checkedItemIds.value = []
    refresh()
    refreshCartCount?.()
    setTimeout(() => router.push('/buyer/orders'), 1500)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Checkout failed', 'error')
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

useHead({ title: 'Cart — Senoro Green Farm' })
</script>
