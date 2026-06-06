<template>
  <div class="py-8 md:py-12 space-y-10 pb-44 md:pb-36">
    <header class="border-b-4 border-farm-dark pb-8">
      <p class="text-[10px] font-bold tracking-[0.2em] uppercase text-market-orange mb-2">
        Checkout
      </p>
      <h1 class="text-3xl md:text-4xl font-black text-farm-dark tracking-tight">
        Place Your Order
      </h1>
    </header>

    <div v-if="pendingCart || pendingAddresses" class="py-24 text-center">
      <Icon name="heroicons:arrow-path" class="w-6 h-6 text-market-orange animate-spin mx-auto" />
      <p class="mt-3 text-xs font-bold text-farm-dark/60 uppercase tracking-widest">Loading checkout…</p>
    </div>

    <div v-else-if="checkedCartItems.length === 0" class="py-24 text-center border-2 border-farm-dark bg-white">
      <p class="text-lg font-bold text-farm-dark">No items selected</p>
      <NuxtLink
        to="/buyer/cart"
        class="inline-block mt-6 px-6 py-3 bg-farm-dark text-white text-[10px] font-bold tracking-[0.15em] uppercase hover:bg-market-orange transition-colors"
      >
        Return to Cart
      </NuxtLink>
    </div>

    <div v-else class="space-y-10">
      <!-- Shopee-Style Address Picker Section -->
      <section class="border-t-[4px] border-t-market-orange bg-white shadow-sm border-2 border-farm-dark border-t-0 p-6 md:p-8">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2 text-farm-dark">
            <Icon name="heroicons:map-pin-solid" class="w-6 h-6 text-market-orange" />
            <h2 class="text-lg font-black tracking-wide">Delivery Address</h2>
          </div>
          <button 
            type="button" 
            @click="showAddressSwitcher = !showAddressSwitcher" 
            class="text-xs font-bold text-farm-leaf uppercase tracking-wider hover:underline"
          >
            {{ showAddressSwitcher ? 'Close' : 'Change Address' }}
          </button>
        </div>
        
        <div v-if="activeAddress">
          <p class="text-base font-black text-farm-dark">
            {{ activeAddress.full_name }} 
            <span class="font-bold text-farm-dark/70 ml-2">{{ activeAddress.phone_number }}</span>
          </p>
          <p class="text-sm font-medium text-farm-dark mt-1">
            {{ activeAddress.detailed_address }}, {{ activeAddress.barangay }}, {{ activeAddress.city }}
          </p>
        </div>
        <div v-else>
          <p class="text-sm text-red-600 font-bold">No delivery address selected or available.</p>
        </div>

        <!-- Inline Address Switcher Sheet -->
        <div v-if="showAddressSwitcher" class="mt-6 border-t-2 border-farm-dark pt-6 space-y-4">
          <label 
            v-for="addr in addresses" 
            :key="addr.id" 
            class="flex items-start gap-4 cursor-pointer p-4 hover:bg-farm-light/30 border-2 border-transparent hover:border-farm-dark transition-colors"
            :class="{ 'border-farm-leaf bg-farm-leaf/5': selectedAddressId === addr.id }"
          >
            <input 
              type="radio" 
              :value="addr.id" 
              v-model="selectedAddressId" 
              class="mt-1 w-5 h-5 text-market-orange accent-market-orange border-2"
            >
            <div>
              <p class="text-base font-bold text-farm-dark">
                {{ addr.full_name }} 
                <span class="font-medium text-farm-dark/70 ml-2">{{ addr.phone_number }}</span>
                <span v-if="addr.is_default" class="ml-3 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-market-orange text-market-orange bg-market-orange/10">Default</span>
              </p>
              <p class="text-sm font-medium text-farm-dark mt-1">
                {{ addr.detailed_address }}, {{ addr.barangay }}, {{ addr.city }}
              </p>
            </div>
          </label>
        </div>
      </section>

      <!-- Line Items Review Box -->
      <section
        v-for="(group, sellerId) in groupedCart"
        :key="sellerId"
        class="border-2 border-farm-dark bg-white shadow-sm"
      >
        <div class="flex items-center gap-3 px-4 md:px-6 py-4 bg-farm-light/50 border-b-2 border-farm-dark">
          <Icon name="heroicons:building-storefront" class="w-6 h-6 text-farm-dark/80" />
          <span class="text-base md:text-lg font-black text-farm-dark uppercase tracking-widest">{{ group.sellerName }}</span>
        </div>

        <ul class="divide-y-2 divide-farm-dark">
          <li
            v-for="item in group.items"
            :key="item.id"
            class="px-4 md:px-6 py-6"
          >
            <template v-if="item.products">
              <div class="flex gap-4 md:gap-6">
                <div class="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-farm-light border-2 border-farm-dark overflow-hidden flex items-center justify-center">
                  <img v-if="item.products.image_url" :src="item.products.image_url" class="w-full h-full object-cover">
                  <div v-else class="text-3xl text-farm-dark/20">
                    {{ getCategoryEmoji(item.products.category) }}
                  </div>
                </div>

                <div class="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 class="text-base md:text-lg font-bold text-farm-dark truncate">
                      {{ item.products.name }}
                    </h3>
                    <div class="mt-2 flex items-center gap-2">
                      <span 
                        class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border"
                        :class="isStreetFood(item.products.category) ? 'text-market-orange border-market-orange/30 bg-market-orange/5' : 'text-farm-leaf border-farm-leaf/30 bg-farm-leaf/5'"
                      >
                        {{ isStreetFood(item.products.category) ? 'Street Food & Eats' : 'Fresh Farm Produce' }}
                      </span>
                    </div>
                  </div>
                  <div class="flex justify-between items-end mt-4">
                    <span class="text-sm font-bold text-farm-dark/60 uppercase tracking-widest">Qty: {{ item.quantity }}</span>
                    <p class="text-base md:text-xl font-black text-farm-dark">
                      ₱{{ formatPrice(item.products.price) }}
                    </p>
                  </div>
                </div>
              </div>
            </template>
          </li>
        </ul>
      </section>
    </div>

    <!-- Sticky Order Placement Ledger Footer -->
    <div
      v-if="checkedCartItems.length > 0"
      class="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-farm-dark shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
    >
      <div class="max-w-page mx-auto w-full px-4 md:px-8 py-4 md:py-5 flex items-center justify-end gap-6">
        <div class="text-right">
          <div class="mb-2 flex flex-col gap-1 items-end text-[10px] font-bold text-farm-dark/60 uppercase tracking-widest">
            <p>Subtotal: <span class="tabular-nums ml-2 text-farm-dark">₱{{ itemsSubtotal.toFixed(2) }}</span></p>
            <p>Delivery Fee: <span class="tabular-nums ml-2 text-farm-dark">₱50.00</span></p>
          </div>
          <p class="text-[10px] font-bold tracking-[0.16em] uppercase text-farm-dark/60">Total Payment</p>
          <p class="text-2xl md:text-3xl font-black text-market-orange tabular-nums">
            ₱{{ totalCheckoutPrice.toFixed(2) }}
          </p>
        </div>
        <button
          type="button"
          :disabled="submittingCheckout || !selectedAddressId || checkedCartItems.length === 0"
          class="px-8 py-4 bg-market-orange text-white text-xs md:text-sm font-black tracking-[0.15em] uppercase hover:bg-[#D35400] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 min-w-[160px] flex-shrink-0 shadow-lg shadow-market-orange/20"
          @click="checkout"
        >
          <span v-if="submittingCheckout" class="flex items-center justify-center gap-2">
            <Icon name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
            Processing
          </span>
          <span v-else>Place Order</span>
        </button>
      </div>
    </div>

    <BuyerToast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </div>
</template>

<script setup lang="ts">
import BuyerToast from '~/components/buyer/BuyerToast.vue'

definePageMeta({ layout: 'buyer' })

const router = useRouter()
const route = useRoute()
const api = useApiFetch()
const refreshCartCount = inject<(() => void) | undefined>('refreshCartCount')

const checkedItemIds = computed(() => {
  const items = route.query.items
  if (!items) return []
  return String(items).split(',').filter(Boolean)
})

const submittingCheckout = ref(false)
const showAddressSwitcher = ref(false)
const selectedAddressId = ref<string | null>(null)

interface Address {
  id: string
  full_name: string
  phone_number: string
  city: string
  barangay: string
  detailed_address: string
  is_default: boolean
}

// Fetch addresses
const { data: addressesData, pending: pendingAddresses } = await useAsyncData(
  'buyer:addresses-checkout',
  () => api<Address[]>('/api/buyer/addresses'),
  { server: false }
)

const addresses = computed<Address[]>(() => {
  const raw = addressesData.value
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object' && 'addresses' in raw) return (raw as { addresses: Address[] }).addresses ?? []
  return []
})
const activeAddress = computed(() => addresses.value.find((a: Address) => a.id === selectedAddressId.value) || null)

watchEffect(() => {
  if (!selectedAddressId.value && addresses.value.length > 0) {
    const defaultAddr = addresses.value.find(a => a.is_default)
    selectedAddressId.value = defaultAddr ? defaultAddr.id : addresses.value[0].id
  }
})

// Fetch cart items
interface CartProduct {
  id: string
  name: string
  price: string | number
  image_url?: string
  category?: string
  users?: { id?: string; full_name?: string }
}

interface CartLineItem {
  id: string
  quantity: number
  products?: CartProduct
}

const { data: cartData, pending: pendingCart, refresh } = await useAsyncData(
  'buyer:cart-items-checkout',
  () => api<{ cart_items?: CartLineItem[] } | CartLineItem[]>('/api/cart'),
  { server: false }
)

const cartItems = computed<CartLineItem[]>(() => {
  const data = cartData.value
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.cart_items ?? []
})

const checkedCartItems = computed(() => {
  return cartItems.value.filter(item => checkedItemIds.value.includes(item.id))
})

const groupedCart = computed(() => {
  const groups: Record<string, { sellerName: string; items: CartLineItem[] }> = {}
  for (const item of checkedCartItems.value) {
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

const itemsSubtotal = computed(() => {
  let total = 0
  for (const item of checkedCartItems.value) {
    const price = item.products?.price
    if (price == null) continue
    total += parseFloat(String(price)) * (item.quantity ?? 1)
  }
  return total
})

const deliveryFee = 50

const totalCheckoutPrice = computed(() => {
  return itemsSubtotal.value + deliveryFee
})

async function checkout() {
  if (checkedItemIds.value.length === 0 || !selectedAddressId.value) return

  submittingCheckout.value = true
  try {
    const data = await api<{ success: boolean; total_amount: number }>('/api/cart/checkout', {
      method: 'POST',
      body: { 
        cart_item_ids: checkedItemIds.value,
        address_id: selectedAddressId.value
      },
    })
    triggerToast(`Order placed successfully — ₱${data.total_amount.toFixed(2)}`)
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

useHead({ title: 'Checkout — Senoro Green Farm' })
</script>
