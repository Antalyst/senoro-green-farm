<template>
  <div class="pb-8">
    <!-- Shop Header Banner (without back button) -->
    <div class="relative bg-farm-gradient-dark pt-5 pb-12 px-4 text-white">
      <div class="flex items-center gap-4">
        <!-- Shop Initial Avatar -->
        <div class="w-16 h-16 rounded-full bg-farm-yellow border-2 border-white/20 flex items-center justify-center text-farm-deep text-3xl font-black shadow-md flex-shrink-0">
          {{ data?.seller?.full_name?.charAt(0).toUpperCase() ?? 'S' }}
        </div>

        <div class="min-w-0">
          <h2 class="text-lg font-black leading-tight flex items-center gap-1.5">
            <span>{{ data?.seller?.full_name ?? 'Loading Store...' }}</span>
            <span class="px-1.5 py-0.5 rounded-md bg-farm-yellow text-farm-deep text-[8px] font-black uppercase tracking-wider">
              Preferred
            </span>
          </h2>
          <p class="text-white/60 text-xs mt-0.5 truncate">{{ data?.seller?.email }}</p>
          <div class="flex items-center gap-3 text-[10px] text-white/85 font-semibold mt-1">
            <span>⭐ 4.9 Rating</span>
            <span>•</span>
            <span>{{ data?.products?.length ?? 0 }} Items listed</span>
          </div>
        </div>
      </div>

      <!-- Wave decoration -->
      <svg class="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 375 20" preserveAspectRatio="none" fill="#EEF5EE">
        <path d="M0,20 C100,0 275,0 375,20 L375,20 L0,20 Z" fill="#EEF5EE" />
      </svg>
    </div>

    <!-- Products grid -->
    <div class="px-4 space-y-4">
      <h3 class="font-black text-gray-900 text-sm uppercase tracking-wider">Seller Harvests</h3>

      <div v-if="pending" class="text-center py-12 text-gray-400 text-sm">
        <div class="animate-pulse flex flex-col items-center gap-2">
          <Icon name="heroicons:arrow-path" class="w-8 h-8 text-farm-leaf animate-spin" />
          <span>Loading shop inventory...</span>
        </div>
      </div>

      <div v-else-if="!data?.products || data.products.length === 0" class="farm-card p-12 text-center text-gray-400 text-sm bg-white">
        🌾 No harvests currently listed by this seller.
      </div>

      <div v-else class="grid grid-cols-2 gap-3">
        <NuxtLink
          v-for="product in data.products"
          :key="product.id"
          :to="`/buyer/product/${product.id}`"
          class="farm-card bg-white flex flex-col justify-between overflow-hidden relative group hover:shadow-md transition-shadow duration-300 cursor-pointer"
        >
          <!-- Product image visual -->
          <div :class="`h-28 flex items-center justify-center text-5xl relative transition-all group-hover:scale-105 ${getCategoryInfo(product.category).bg}`">
            {{ getCategoryInfo(product.category).emoji }}
            <span v-if="product.stock === 0" class="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-black uppercase tracking-wider">
              Sold Out
            </span>
          </div>

          <!-- Product description info -->
          <div class="p-3 flex-1 flex flex-col justify-between">
            <div>
              <span class="text-[9px] uppercase font-extrabold tracking-widest text-farm-leaf">{{ product.category }}</span>
              <h4 class="font-extrabold text-gray-950 text-sm leading-tight line-clamp-2 mt-0.5">
                {{ product.name }}
              </h4>
              <p class="text-xs text-gray-500 line-clamp-1 mt-0.5">
                {{ product.description || 'Grown fresh and organic.' }}
              </p>
            </div>

            <div class="flex items-center justify-between mt-3">
              <span class="text-farm-deep font-black text-base">₱{{ parseFloat(product.price).toFixed(2) }}</span>
              
              <button
                @click.stop="addToCart(product)"
                :disabled="product.stock === 0"
                class="w-8 h-8 rounded-full bg-farm-deep text-white flex items-center justify-center shadow-md active:scale-90 hover:bg-farm-leaf disabled:bg-gray-100 disabled:text-gray-400 disabled:scale-100 transition-all flex-shrink-0"
              >
                <Icon name="heroicons:shopping-cart" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>


    <!-- Custom Toast -->
    <Transition name="slide-up">
      <div
        v-if="toast.show"
        :class="`fixed bottom-8 left-4 right-4 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white font-semibold text-sm ${
          toast.type === 'success' ? 'bg-farm-deep' : 'bg-red-600'
        }`"
      >
        <Icon :name="toast.type === 'success' ? 'heroicons:check-circle' : 'heroicons:exclamation-circle'" class="w-5 h-5 flex-shrink-0" />
        <span class="flex-1">{{ toast.message }}</span>
        <button @click="toast.show = false" class="p-1 hover:bg-white/10 rounded-full">
          <Icon name="heroicons:x-mark" class="w-4 h-4" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'buyer' })

const router = useRouter()
const route = useRoute()
const api = useApiFetch()

const refreshCartCount = inject('refreshCartCount') as () => void
const setSubPageTitle = inject('setSubPageTitle') as (title: string) => void

// Get public profile and seller product list
const { data, pending } = await useAsyncData(
  `buyer:shop-${route.params.id}`,
  () => api(`/api/seller/profile/${route.params.id}`),
  { server: false }
)

// Watch dynamic data and set subpage title
watchEffect(() => {
  if (data.value?.seller?.full_name && setSubPageTitle) {
    setSubPageTitle(data.value.seller.full_name)
  }
})

const getCategoryInfo = (category: string) => {
  const map: Record<string, { emoji: string; bg: string }> = {
    Vegetables: { emoji: '🥬', bg: 'bg-green-50' },
    Fruits: { emoji: '🍎', bg: 'bg-red-50' },
    Organic: { emoji: '🌱', bg: 'bg-emerald-50' },
    Herbs: { emoji: '🌿', bg: 'bg-teal-50' },
    Dairy: { emoji: '🥛', bg: 'bg-blue-50' },
    Grains: { emoji: '🌾', bg: 'bg-yellow-50' },
  }
  return map[category] ?? { emoji: '🌱', bg: 'bg-green-50' }
}


// Toast notification state
const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value.message = message
  toast.value.type = type
  toast.value.show = true
  setTimeout(() => {
    toast.value.show = false
  }, 4000)
}

// Add to Cart
async function addToCart(product: any, quantity = 1) {
  if (product.stock === 0) return
  try {
    await api('/api/cart/add', {
      method: 'POST',
      body: {
        product_id: product.id,
        quantity: quantity
      }
    })
    triggerToast(`Added ${quantity} unit(s) of ${product.name} to cart.`)
    // Refresh parent tab cart count
    if (refreshCartCount) refreshCartCount()
  } catch (err: any) {
    triggerToast(err.data?.statusMessage || 'Failed to add item to cart', 'error')
  }
}


useHead({ title: 'Seller Shop — Senoro Green Farm' })
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
