<template>
  <div class="space-y-8 py-5 md:py-8">
    <section class="grid gap-4 lg:grid-cols-[1.6fr_0.8fr]">
      <div class="relative min-h-[360px] overflow-hidden border border-farm-light bg-farm-dark text-white">
        <img
          :src="heroImage"
          alt="Fresh vegetable market"
          class="absolute inset-0 h-full w-full object-cover opacity-70"
        >
        <div class="absolute inset-0 bg-gradient-to-r from-farm-dark via-farm-dark/80 to-farm-dark/20" />
        <div class="relative z-10 flex min-h-[360px] flex-col justify-between p-5 md:p-8">
          <div class="flex flex-wrap items-center gap-2">
            <span class="bg-farm-yellow px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-farm-dark">
              Market Mall
            </span>
            <span class="border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em]">
              {{ stores.length }} local stores
            </span>
          </div>

          <div class="max-w-xl">
            <p class="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-market-orange">
              Senoro Marketplace Hub
            </p>
            <h1 class="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl drop-shadow-sm">
              Fresh Farms & Night Market Eats.
            </h1>
            <p class="mt-4 max-w-lg text-sm font-medium leading-6 text-white/90 md:text-base">
              Experience the dual-sector marketplace. Order sizzling local street food or harvest-ready produce directly from sellers.
            </p>
            <div class="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#stores"
                class="inline-flex items-center gap-2 bg-farm-yellow px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-farm-dark transition-colors hover:bg-white"
              >
                <Icon name="heroicons:building-storefront" class="h-4 w-4" />
                View stores
              </a>
              <button
                type="button"
                @click="selectCategory('All')"
                class="inline-flex items-center gap-2 border border-white/45 bg-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-farm-dark"
              >
                <Icon name="heroicons:squares-2x2" class="h-4 w-4" />
                All products
              </button>
            </div>
          </div>
        </div>
      </div>

      <aside class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div class="border border-farm-light bg-farm-light/40 p-5">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-farm-dark/45">Daily deal</p>
              <h2 class="mt-1 text-lg font-semibold text-farm-dark">Bazaar Flash Sale</h2>
            </div>
            <span class="bg-farm-deep px-3 py-1 text-xs font-semibold text-white">{{ countdown }}</span>
          </div>
          <div class="mt-5 space-y-3">
            <NuxtLink
              v-for="item in flashProducts"
              :key="item.id"
              :to="`/buyer/product/${item.id}`"
              class="flex items-center gap-3 border border-farm-light bg-white p-2 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
              :class="item.category.startsWith('street_food_') ? 'hover:border-market-orange/50' : 'hover:border-farm-leaf/50'"
            >
              <img
                :src="item.image_url || productFallbackImage(item.category)"
                :alt="item.name"
                class="h-14 w-14 object-cover"
              >
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-farm-dark">{{ item.name }}</span>
                <span class="text-xs font-semibold" :class="item.category.startsWith('street_food_') ? 'text-market-orange' : 'text-farm-leaf'">
                  PHP {{ formatPrice(item.price) }}
                </span>
              </span>
            </NuxtLink>
          </div>
        </div>

        <div class="relative min-h-[180px] overflow-hidden border border-farm-light bg-farm-deep p-5 text-white">
          <img
            :src="promoImage"
            alt="Vegetable basket"
            class="absolute inset-0 h-full w-full object-cover opacity-35"
          >
          <div class="relative">
            <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">Voucher</p>
            <h2 class="mt-2 max-w-[15rem] text-2xl font-semibold leading-tight">Free delivery on PHP 300+</h2>
            <p class="mt-3 text-xs leading-5 text-white/75">Fresh items from local community sellers, packed for swift routes.</p>
          </div>
        </div>
      </aside>
    </section>

    <section class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div
        v-for="stat in marketStats"
        :key="stat.label"
        class="border border-farm-light bg-white p-4 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
      >
        <p class="text-2xl font-extrabold text-farm-dark">{{ stat.value }}</p>
        <p class="mt-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-farm-dark/45">{{ stat.label }}</p>
      </div>
    </section>

    <!-- THE HUB SPLITTER (Dual-Sector Identity Intercepts) -->
    <section class="grid gap-4 md:grid-cols-2 mt-4">
      <!-- Sector A: Street Food & Eats -->
      <div 
        class="relative overflow-hidden min-h-[220px] bg-[#FFF8F3] border border-market-orange/20 p-6 flex flex-col justify-end group transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg cursor-pointer" 
        @click="selectHubSector('street_food_')"
      >
        <div class="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80" alt="Street Food" class="w-full h-full object-cover opacity-10 group-hover:scale-105 transition-transform duration-700">
          <div class="absolute inset-0 bg-gradient-to-t from-market-orange/90 to-transparent opacity-80"></div>
        </div>
        <div class="relative z-10 text-white">
          <div class="flex items-center gap-2 mb-2">
            <span class="bg-white/20 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-sm rounded">Sizzle</span>
            <span class="bg-white/20 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-sm rounded">Local Snacks</span>
          </div>
          <h2 class="text-3xl font-extrabold tracking-tight mb-2 text-white">Street Food & Eats</h2>
          <p class="text-sm text-white/90 font-medium">Sizzling hot, ready-to-eat local market favorites.</p>
        </div>
      </div>

      <!-- Sector B: Fresh Farm Hub -->
      <div 
        class="relative overflow-hidden min-h-[220px] bg-farm-light border border-farm-leaf/20 p-6 flex flex-col justify-end group transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-farm-deep/20 cursor-pointer" 
        @click="selectHubSector('farm_')"
      >
        <div class="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1595855761358-106b52701f5c?auto=format&fit=crop&w=800&q=80" alt="Farm Produce" class="w-full h-full object-cover opacity-10 group-hover:scale-105 transition-transform duration-700">
          <div class="absolute inset-0 bg-gradient-to-t from-farm-deep/90 to-transparent opacity-90"></div>
        </div>
        <div class="relative z-10 text-white">
          <div class="flex items-center gap-2 mb-3">
            <span class="bg-farm-leaf px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest shadow-sm rounded-sm">Harvest</span>
            <span class="bg-white/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest backdrop-blur-sm rounded-sm">Organic</span>
          </div>
          <h2 class="text-3xl font-extrabold tracking-tight mb-2 text-white">Fresh Farm Hub</h2>
          <p class="text-sm text-white/90 font-medium">Crisp vegetables, fruits, and grains straight from the soil.</p>
        </div>
      </div>
    </section>

    <!-- SHOP BY CATEGORY (Polished Grid Configuration) -->
    <section class="border-t border-farm-light pt-8">
      <h2 class="mb-5 text-xl font-extrabold tracking-tight text-farm-dark">Shop by category</h2>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
        <button
          v-for="cat in categoryOptions"
          :key="cat.value"
          type="button"
          class="flex min-h-24 flex-col justify-between border border-farm-light bg-white p-3 text-left transition-all duration-200 hover:scale-[1.02]"
          :class="[
            activeCategory === cat.value 
              ? cat.value.startsWith('street_food_')
                ? 'border-market-orange bg-orange-50/40 ring-1 ring-market-orange'
                : cat.value === 'All'
                  ? 'border-farm-dark bg-farm-light/60 ring-1 ring-farm-dark'
                  : 'border-farm-deep bg-farm-light/60 ring-1 ring-farm-deep'
              : 'hover:border-farm-leaf/50'
          ]"
          @click="selectCategory(cat.value)"
        >
          <Icon 
            :name="cat.icon" 
            class="h-6 w-6 transition-colors" 
            :class="[
              activeCategory === cat.value
                ? cat.value.startsWith('street_food_') ? 'text-market-orange' : 'text-farm-leaf'
                : cat.value.startsWith('street_food_') ? 'text-orange-400' : 'text-farm-leaf/70'
            ]"
          />
          <span class="text-[11px] font-black uppercase tracking-wide text-farm-dark leading-tight mt-3">
            {{ cat.name }}
          </span>
        </button>
      </div>
    </section>

    <!-- STORES LIST -->
    <section id="stores" class="border-t border-farm-light pt-8">
      <div class="mb-5 flex items-end justify-between gap-4">
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-farm-dark/45">Shop by store</p>
          <h2 class="mt-1 text-2xl font-extrabold tracking-tight text-farm-dark">Market stores</h2>
        </div>
        <span v-if="!loading" class="text-xs font-extrabold text-farm-dark/45">{{ stores.length }} sellers</span>
      </div>

      <div v-if="loading" class="grid gap-4 md:grid-cols-3">
        <div v-for="n in 3" :key="n" class="h-48 animate-pulse bg-farm-light" />
      </div>

      <div v-else-if="stores.length" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="store in stores"
          :key="store.id"
          :to="`/buyer/shop/${store.id}`"
          class="group overflow-hidden border border-farm-light bg-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          :class="store.isStreetFoodStore ? 'hover:border-market-orange/50' : 'hover:border-farm-deep/45'"
        >
          <div class="relative h-32 overflow-hidden bg-farm-light">
            <img
              :src="store.cover"
              :alt="store.name"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-farm-dark/75 to-transparent" />
            <div class="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-base font-extrabold text-white">{{ store.name }}</p>
                <p class="text-xs font-extrabold text-white/75">{{ store.productCount }} products</p>
              </div>
              <span class="bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-farm-deep">
                Visit
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between gap-3 p-4">
            <div class="flex min-w-0 flex-wrap gap-2">
              <span
                v-for="catValue in store.categories.slice(0, 2)"
                :key="catValue"
                class="bg-farm-light px-2 py-1 text-[10px] font-extrabold text-farm-dark/65 truncate max-w-[120px]"
              >
                {{ getCategoryLabel(catValue) }}
              </span>
            </div>
            <span class="text-sm font-extrabold text-farm-leaf">PHP {{ store.minPrice }}+</span>
          </div>
        </NuxtLink>
      </div>

      <div v-else class="border border-farm-light p-12 text-center">
        <p class="text-sm font-extrabold text-farm-dark">No stores available yet</p>
        <p class="mt-1 text-xs font-extrabold text-farm-dark/45">Seller stores will appear once products are listed.</p>
      </div>
    </section>

    <!-- PRODUCTS PICK LIST -->
    <section class="border-t border-farm-light pt-8">
      <div class="mb-5 flex items-end justify-between gap-4">
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-farm-dark/45">Marketplace picks</p>
          <h2 class="mt-1 text-2xl font-extrabold tracking-tight text-farm-dark">
            {{ activeCategory === 'All' ? 'Fresh Products' : getCategoryLabel(activeCategory) }}
          </h2>
        </div>
        <span v-if="!loading" class="text-xs font-extrabold text-farm-dark/45">{{ filteredProducts.length }} items</span>
      </div>

      <div v-if="loading" class="py-20 text-center">
        <Icon name="heroicons:arrow-path" class="mx-auto h-6 w-6 animate-spin text-farm-leaf" />
        <p class="mt-3 text-xs font-extrabold tracking-wide text-farm-dark/45">Loading marketplace...</p>
      </div>

      <div v-else-if="loadError" class="border border-farm-light py-16 text-center">
        <p class="text-sm font-extrabold text-farm-dark/70">{{ loadError }}</p>
        <button
          type="button"
          class="mt-4 border-b border-farm-deep pb-0.5 text-xs font-extrabold uppercase tracking-[0.12em] text-farm-deep"
          @click="fetchProducts"
        >
          Try again
        </button>
      </div>

      <div v-else-if="filteredProducts.length === 0" class="border border-farm-light py-20 text-center">
        <p class="text-sm font-extrabold text-farm-dark">No products available in this scope</p>
        <p class="mt-1 text-xs font-extrabold text-farm-dark/45">Adjust filters or check back soon.</p>
      </div>

      <div v-else class="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        <div 
          v-for="product in filteredProducts" 
          :key="product.id"
          class="transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
        >
          <BuyerProductCard
            :product="product"
            show-savings-hint
            @add-to-cart="handleAddToCart"
            @buy-now="handleBuyNow"
          />
        </div>
      </div>
    </section>
  </div>

  <BuyerToast
    :show="toast.show"
    :message="toast.message"
    :type="toast.type"
    @close="toast.show = false"
  />

  <!-- Promotion Popup -->
  <div v-if="showPromo" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showPromo = false"></div>
    <div class="relative w-full max-w-md bg-white overflow-hidden shadow-2xl scale-100 transition-transform">
      <button 
        @click="showPromo = false" 
        class="absolute top-4 right-4 z-10 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
      >
        <Icon name="heroicons:x-mark" class="w-5 h-5" />
      </button>
      <div class="h-48 relative">
        <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80" alt="Promo Food" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-farm-dark/90 to-transparent"></div>
        <div class="absolute bottom-4 left-4 right-4">
          <span class="inline-block px-2 py-1 bg-market-orange text-white text-[10px] font-extrabold uppercase tracking-widest mb-2 rounded-sm shadow-sm">Limited Time</span>
          <h3 class="text-2xl font-extrabold text-white tracking-tight leading-tight">Unlock Night Market Special Perks!</h3>
        </div>
      </div>
      <div class="p-6 text-center">
        <p class="text-sm font-extrabold text-farm-dark/80 mb-6 leading-relaxed">
          Get exclusive access to hot street food deals, fresh harvest discounts, and free delivery vouchers when you join the Senoro community.
        </p>
        <button 
          @click="claimPromo" 
          class="w-full py-4 bg-market-orange text-white font-extrabold uppercase tracking-widest text-sm hover:bg-[#D35400] transition-colors shadow-lg shadow-market-orange/30 hover:-translate-y-0.5 transform duration-200"
        >
          Claim Your Promo Voucher
        </button>
        <p class="mt-4 text-xs font-extrabold text-farm-dark/40 cursor-pointer hover:text-farm-dark transition-colors" @click="showPromo = false">
          No thanks, I'll pay full price
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BuyerProduct } from '~/components/buyer/ProductCard.vue'

definePageMeta({ layout: 'buyer' })

const auth = useAuth()
const router = useRouter()
const route = useRoute()
const api = useApiFetch()

const showPromo = ref(false)
const countdown = ref('02:35:10')
const activeCategory = ref('All')
const products = ref<BuyerProduct[]>([])
const loading = ref(true)
const loadError = ref('')

const heroImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80'
const promoImage = 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=900&q=80'

const fallbackImages = [
  'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1557844352-761f2565b576?auto=format&fit=crop&w=900&q=80',
]

// The aligned dual-sector category configuration mapping
const categoryOptions = [
  { name: 'All', value: 'All', icon: 'heroicons:squares-2x2' },
  { name: 'Fried & Grilled', value: 'street_food_fried_grilled', icon: 'heroicons:fire' },
  { name: 'Steamed & Dimsum', value: 'street_food_steamed_dimsum', icon: 'heroicons:cloud' },
  { name: 'Local Snacks', value: 'street_food_snacks_kakanin', icon: 'heroicons:cake' },
  { name: 'Drinks & Desserts', value: 'street_food_beverages_desserts', icon: 'heroicons:academic-cap' },
  { name: 'Vegetables', value: 'farm_vegetables', icon: 'heroicons:sparkles' },
  { name: 'Fruits', value: 'farm_fruits', icon: 'heroicons:variable' },
  { name: 'Herbs & Spices', value: 'farm_herbs_spices', icon: 'heroicons:beaker' },
  { name: 'Rice & Grains', value: 'farm_rice_grains', icon: 'heroicons:building-storefront' },
  { name: 'Poultry & Dairy', value: 'farm_poultry_dairy', icon: 'heroicons:shopping-bag' }
]

const searchParam = computed(() => (route.query?.search as string) || '')
const categoryParam = computed(() => (route.query?.category as string) || 'All')

const displayName = computed(() => {
  const name = auth.user.value?.full_name
  return name?.split(' ')[0] ?? 'Guest'
})

// Client-Side filtering block mapping handles Hub-level queries smoothly
const filteredProducts = computed(() => {
  if (activeCategory.value === 'All') return products.value
  
  // Custom interception filter for Sector Splits (e.g. 'street_food_' prefix or 'farm_' prefix matching)
  if (activeCategory.value.endsWith('_')) {
    return products.value.filter(p => p.category && p.category.startsWith(activeCategory.value))
  }
  
  // Strict matching for specific individual categories
  return products.value.filter(p => p.category === activeCategory.value)
})

const stores = computed(() => {
  const map = new Map<string, {
    id: string
    name: string
    productCount: number
    categories: Set<string>
    minPrice: number
    cover: string
    isStreetFoodStore: boolean
  }>()

  products.value.forEach((product) => {
    const sellerId = product.users?.id
    if (!sellerId) return

    const existing = map.get(sellerId)
    const price = parseFloat(String(product.price ?? 0))
    const isStreetFood = String(product.category || '').startsWith('street_food_')

    if (existing) {
      existing.productCount += 1
      existing.categories.add(product.category)
      existing.minPrice = Math.min(existing.minPrice, price)
      if (isStreetFood) existing.isStreetFoodStore = true
      if (!existing.cover && product.image_url) existing.cover = product.image_url
      return
    }

    map.set(sellerId, {
      id: sellerId,
      name: product.users?.full_name ?? 'Senoro Seller',
      productCount: 1,
      categories: new Set([product.category]),
      minPrice: price,
      cover: product.image_url || fallbackImages[map.size % fallbackImages.length],
      isStreetFoodStore: isStreetFood
    })
  })

  return Array.from(map.values()).map(store => ({
    ...store,
    categories: Array.from(store.categories),
    minPrice: formatPrice(store.minPrice),
  }))
})

const flashProducts = computed(() => products.value.slice(0, 3))

const marketStats = computed(() => [
  { label: 'Stores', value: stores.value.length },
  { label: 'Products', value: products.value.length },
  { label: 'Categories', value: uniqueCategories.value.length },
  { label: 'Welcome', value: displayName.value },
])

const uniqueCategories = computed(() => {
  return Array.from(new Set(products.value.map(product => product.category).filter(Boolean)))
})

function getCategoryLabel(value: string) {
  const found = categoryOptions.find(c => c.value === value)
  return found ? found.name : value
}

function productFallbackImage(category: string) {
  const cleanedStr = category || 'All'
  const index = Math.abs(cleanedStr.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % fallbackImages.length
  return fallbackImages[index]
}

function formatPrice(price: string | number) {
  return parseFloat(String(price ?? 0)).toFixed(2)
}

// Fetch modified to hit the general route endpoint, keeping client filtering flawless
async function fetchProducts() {
  loading.value = true
  loadError.value = ''
  try {
    const params: Record<string, string> = {}
    const search = searchParam.value
    if (search) params.search = search

    // We pull the general listing array so client-side prefix interception performs accurately
    const data = await api<{ products?: BuyerProduct[] } | BuyerProduct[]>('/api/products', { params })
    products.value = Array.isArray(data) ? data : (data?.products ?? [])
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string }
    loadError.value = e.data?.statusMessage || e.message || 'Failed to load products'
    products.value = []
  }
  finally {
    loading.value = false
  }
}

function selectCategory(catValue: string) {
  activeCategory.value = catValue
  router.replace({ query: { ...route.query, category: catValue === 'All' ? undefined : catValue } })
}

// Intercepts the Split Hub Banners seamlessly without triggering undefined API responses
function selectHubSector(prefix: 'street_food_' | 'farm_') {
  activeCategory.value = prefix
  router.replace({ query: { ...route.query, category: prefix } })
}

const { addToCart, buyNow } = useProductActions()

async function handleAddToCart(product: BuyerProduct) {
  if (!product || product.stock === 0) return
  try {
    const added = await addToCart(product.id)
    if (added) triggerToast(`Added ${product.name} to cart.`)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Failed to add item to cart', 'error')
  }
}

async function handleBuyNow(product: BuyerProduct) {
  if (!product || product.stock === 0) return
  try {
    await buyNow(product.id)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Failed to start checkout', 'error')
  }
}

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 4000)
}

function claimPromo() {
  showPromo.value = false
  if (!auth.isAuthenticated.value) {
    router.push('/auth/login')
  }
}

onMounted(() => {
  activeCategory.value = categoryParam.value

  setTimeout(() => {
    if (!sessionStorage.getItem('promoShown')) {
      showPromo.value = true
      sessionStorage.setItem('promoShown', 'true')
    }
  }, 1000)

  let secs = 8320
  const timer = setInterval(() => {
    secs--
    if (secs <= 0) { clearInterval(timer); return }
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    countdown.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, 1000)

  fetchProducts()
})

watch([categoryParam, searchParam], () => {
  activeCategory.value = categoryParam.value
  // Keep empty string queries handled without hitting full network updates unless search modifications happen
})

useHead({ title: 'Shop - Senoro Green Farm' })
</script>