<template>
  <div class="min-h-screen bg-gray-50 pb-16">
    <div v-if="data?.seller">
      <!-- HEADER BANNER -->
      <div class="relative h-48 sm:h-64 md:h-80 w-full bg-gradient-to-r from-gray-900 to-gray-800 overflow-hidden">
        <img 
          v-if="data.seller.shop_banner_url || storeHeroImage" 
          :src="data.seller.shop_banner_url || storeHeroImage" 
          :alt="shopDisplayName" 
          class="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div class="absolute bottom-0 left-0 w-full p-4 sm:p-6 lg:p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end">
          <div class="flex items-center gap-4 sm:gap-6 w-full max-w-7xl mx-auto">
            <div class="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-4 border-white overflow-hidden bg-white flex-shrink-0 shadow-xl">
              <img 
                v-if="data.seller.shop_avatar_url" 
                :src="data.seller.shop_avatar_url" 
                :alt="shopDisplayName" 
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                <img 
                    v-if="data.seller.shop_banner_url || storeHeroImage" 
                    :src="data.seller.shop_banner_url || storeHeroImage" 
                    :alt="shopDisplayName" 
                    class=" w-full h-full object-cover "
                  />
              </div>
            </div>
            <div class="text-white pb-1 sm:pb-3">
              <h1 class="text-xl sm:text-3xl md:text-4xl font-bold drop-shadow-lg">
                {{ shopDisplayName }}
              </h1>
              <p class="text-xs sm:text-sm text-white/80 mt-1">{{ data.seller.location || 'Negros Weekend Market' }} seller</p>
            </div>
          </div>
        </div>
      </div>

      <!-- LAYOUT SPLIT -->
      <div class="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 mt-0 md:mt-8">
        <div class="md:grid md:grid-cols-[250px_1fr] md:gap-8">
          
          <!-- NAVIGATION -->
          <div class="bg-white md:bg-transparent shadow-sm md:shadow-none border-b border-gray-200 md:border-none sticky top-0 z-20 md:static">
            <!-- Mobile Horizontal Swipe Navigation -->
            <div class="md:hidden overflow-x-auto whitespace-nowrap scrollbar-none flex px-4 py-3 gap-2">
              <button 
                v-for="category in navCategories"
                :key="category.id"
                @click="activeCategory = category.id"
                :class="[
                  'px-5 py-2 rounded-full text-sm font-semibold transition-all border whitespace-nowrap',
                  activeCategory === category.id 
                    ? 'bg-farm-deep text-white border-farm-deep shadow-md' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                ]"
              >
                {{ category.name }}
              </button>
            </div>
            
            <!-- Desktop Sticky Sidebar -->
            <div class="hidden md:block sticky top-24">
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h2 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">Categories</h2>
                <ul class="space-y-1">
                  <li v-for="category in navCategories" :key="category.id">
                    <button 
                      @click="activeCategory = category.id"
                      :class="[
                        'w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex justify-between items-center',
                        activeCategory === category.id 
                          ? 'bg-farm-deep/10 text-farm-deep font-bold' 
                          : 'text-gray-700 hover:bg-gray-50'
                      ]"
                    >
                      <span>{{ category.name }}</span>
                      <span class="text-xs opacity-70">{{ category.count }}</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- PRODUCT CARDS GRID -->
          <div class="p-4 sm:p-0 min-w-0">
            <div v-if="pending" class="py-12 text-center text-sm text-farm-dark/50">Loading shop...</div>
            <div v-else-if="!visibleProducts.length" class="py-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
              <p class="text-sm font-medium text-farm-dark">No products match your filters</p>
            </div>
            
            <div v-else-if="activeCategory === 'All'" class="space-y-8">
              <section v-for="section in groupedProducts" :key="section.category" class="space-y-4">
                <div class="flex items-end justify-between border-b border-gray-200 pb-3">
                  <h2 class="text-xl font-bold text-gray-900">{{ section.category }}</h2>
                  <span class="text-xs font-bold text-gray-500">{{ section.products.length }} items</span>
                </div>
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-5">
                  <BuyerProductCard
                    v-for="product in section.products"
                    :key="product.id"
                    :product="product"
                    class="transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg h-full"
                    @add-to-cart="handleAddToCart"
                    @buy-now="handleBuyNow"
                  />
                </div>
              </section>
            </div>

            <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-5">
              <BuyerProductCard
                v-for="product in visibleProducts"
                :key="product.id"
                :product="product"
                class="transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg h-full"
                @add-to-cart="handleAddToCart"
                @buy-now="handleBuyNow"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="!pending" class="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md w-full">
        <h2 class="text-2xl font-bold text-gray-900 mb-3">Shop Unavailable</h2>
        <p class="text-gray-500 mb-8">The seller you're looking for doesn't exist or their store is currently hidden.</p>
        <NuxtLink to="/buyer" class="bg-farm-deep text-white px-6 py-3 rounded-xl font-bold hover:bg-farm-leaf transition-colors block w-full">
          Return to Marketplace
        </NuxtLink>
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
import type { BuyerProduct } from '~/components/buyer/ProductCard.vue'
import PageContainer from '~/components/ui/PageContainer.vue'

definePageMeta({ layout: 'buyer' })

const route = useRoute()
const api = useApiFetch()
const { addToCart, buyNow } = useProductActions()

const setSubPageTitle = inject<(title: string) => void>('setSubPageTitle')

interface ShopSeller {
  id: string
  full_name: string
  shop_name?: string | null
  shop_avatar_url?: string | null
  shop_banner_url?: string | null
  created_at?: string
  location?: string
  average_rating?: number
  review_count?: number
}

interface ShopCategory {
  id: string
  name: string
}

interface ShopPayload {
  seller: ShopSeller
  categories: ShopCategory[]
  products: BuyerProduct[]
}

const searchQuery = ref('')
const activeCategory = ref('All')
const sortBy = ref<'default' | 'price-asc' | 'price-desc'>('default')

const { data, pending } = await useAsyncData(
  () => `buyer:shop-${route.params.id}`,
  () => api<ShopPayload>(`/api/seller/profile/${route.params.id}`),
  { server: false },
)

const shopDisplayName = computed(() =>
  data.value?.seller?.shop_name || data.value?.seller?.full_name || 'Loading store...',
)

const storeHeroImage = computed(() => {
  const firstProductImage = data.value?.products?.find(product => product.image_url)?.image_url
  return firstProductImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80'
})

const joinedDate = computed(() => {
  const created = data.value?.seller?.created_at
  if (!created) return 'New'
  return new Date(created).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
})

const navCategories = computed(() => {
  const products = data.value?.products ?? []
  const customCategories = data.value?.categories ?? []
  const counts = new Map<string, number>()

  products.forEach((product) => {
    const key = product.category_id ?? 'uncategorized'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })

  const mapped = customCategories.map(category => ({
    id: category.id,
    name: category.name,
    count: counts.get(category.id) ?? 0,
  }))

  const uncategorizedCount = products.filter(product => !product.category_id).length
  if (uncategorizedCount > 0) {
    mapped.push({ id: 'uncategorized', name: 'Uncategorized', count: uncategorizedCount })
  }

  return [
    { id: 'All', name: 'All', count: products.length },
    ...mapped,
  ]
})

watchEffect(() => {
  if (shopDisplayName.value) setSubPageTitle?.(shopDisplayName.value)
})

const visibleProducts = computed(() => {
  let list = [...(data.value?.products ?? [])]

  if (activeCategory.value !== 'All') {
    list = activeCategory.value === 'uncategorized'
      ? list.filter(product => !product.category_id)
      : list.filter(product => product.category_id === activeCategory.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(product =>
      [product.name, product.category].some(value => String(value ?? '').toLowerCase().includes(q)),
    )
  }

  if (sortBy.value === 'price-asc') {
    list.sort((a, b) => parseFloat(String(a.price)) - parseFloat(String(b.price)))
  }
  else if (sortBy.value === 'price-desc') {
    list.sort((a, b) => parseFloat(String(b.price)) - parseFloat(String(a.price)))
  }

  return list
})

const groupedProducts = computed(() => {
  const groups = new Map<string, BuyerProduct[]>()

  visibleProducts.value.forEach((product) => {
    const label = product.category || 'Uncategorized'
    const products = groups.get(label) ?? []
    products.push(product)
    groups.set(label, products)
  })

  return Array.from(groups.entries()).map(([category, products]) => ({ category, products }))
})

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 4000)
}

async function handleAddToCart(product: BuyerProduct) {
  try {
    const added = await addToCart(product.id)
    if (added) triggerToast(`Added ${product.name} to cart.`)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Failed to add to cart', 'error')
  }
}

async function handleBuyNow(product: BuyerProduct) {
  try {
    await buyNow(product.id)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Failed to start checkout', 'error')
  }
}

useHead({ title: 'Shop - Senoro Green Farm' })
</script>
