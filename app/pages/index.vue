<template>
  <div class="space-y-8 py-5 md:py-8">
    <!-- Clean Hero Section without Categories -->
    <header class="bg-farm-deep py-16 px-4 sm:px-6 lg:px-8 text-center text-white relative overflow-hidden rounded-xl">
      <img
        :src="heroImage"
        alt="Fresh vegetable market"
        class="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay"
      >
      <div class="relative z-10">
        <h1 class="text-3xl font-extrabold tracking-tight sm:text-5xl drop-shadow-md">Negros Farmers Weekend Market</h1>
        <p class="mt-4 text-lg max-w-2xl mx-auto drop-shadow-sm">Support local sellers and find fresh products directly from the source.</p>
        <form class="mt-8 flex max-w-xl mx-auto gap-2 bg-white p-2 rounded-lg shadow-lg" @submit.prevent="applySearch">
          <div class="flex min-w-0 flex-1 items-center gap-2 px-2">
            <Icon name="heroicons:magnifying-glass" class="h-5 w-5 flex-shrink-0 text-farm-dark/35" />
            <input
              v-model="searchInput"
              type="text"
              placeholder="Search products or stores"
              class="min-w-0 flex-1 bg-transparent text-sm font-semibold text-farm-dark outline-none placeholder:text-farm-dark/35"
            >
          </div>
          <button
            type="submit"
            class="bg-farm-deep px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-farm-leaf rounded-md"
          >
            Search
          </button>
        </form>
      </div>
    </header>

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

    <section id="stores" class="border-t border-farm-light pt-8">
      <div class="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight text-farm-dark">Explore Local Shops</h2>
        </div>
        <span v-if="!loading" class="text-sm font-semibold text-farm-dark/50">{{ filteredStores.length }} sellers</span>
      </div>

      <div v-if="loading" class="flex justify-center py-10">
        <Icon name="heroicons:arrow-path" class="w-8 h-8 text-farm-leaf animate-spin" />
      </div>

      <div v-else-if="filteredStores.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <NuxtLink
          v-for="store in filteredStores"
          :key="store.id"
          :to="`/buyer/shop/${store.id}`"
          class="bg-white rounded-2xl shadow-sm border border-farm-light hover:shadow-lg hover:border-farm-deep/30 transition-all overflow-hidden flex flex-col items-center p-6 group"
        >
          <div class="w-20 h-20 rounded-full border border-farm-light overflow-hidden bg-white mx-auto flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-sm mb-4">
            <img
              v-if="store.shop_avatar_url"
              :src="store.shop_avatar_url"
              :alt="store.shop_name"
              class="w-full h-full object-cover"
            />
            <img
              v-else
              :src="store.shop_banner_url || store.cover"
              :alt="store.shop_name"
              class="w-full h-full object-cover"
            />
          </div>
          <h3 class="text-base font-extrabold text-farm-dark text-center line-clamp-2 w-full">
            {{ store.name }}
          </h3>
          <p class="text-xs font-semibold text-farm-dark/50 mt-1">{{ store.productCount }} products</p>
        </NuxtLink>
      </div>

      <div v-else class="text-center py-16 bg-white rounded-xl border border-farm-light shadow-sm">Y
        <p class="text-farm-dark/50 text-lg font-semibold">No shops available at the moment.</p>
      </div>
    </section>

    <section class="border-t border-farm-light pt-8">
      <div class="mb-5 flex items-end justify-between gap-4">
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-farm-dark/45">Marketplace picks</p>
          <h2 class="mt-1 text-2xl font-extrabold tracking-tight text-farm-dark">Fresh Products</h2>
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
        <p class="text-sm font-extrabold text-farm-dark">No products available</p>
        <p class="mt-1 text-xs font-extrabold text-farm-dark/45">Try a different search or check back soon.</p>
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
</template>

<script setup lang="ts">
import type { BuyerProduct } from '~/components/buyer/ProductCard.vue'

definePageMeta({ layout: 'buyer' })

const router = useRouter()
const route = useRoute()
const api = useApiFetch()

const searchInput = ref((route.query?.search as string) || '')
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

const searchParam = computed(() => (route.query?.search as string) || '')

const filteredProducts = computed(() => {
  const q = searchParam.value.toLowerCase().trim()
  if (!q) return products.value

  return products.value.filter(product => {
    const sellerName = product.users?.shop_name ?? product.users?.full_name ?? ''
    return [
      product.name,
      product.category,
      sellerName,
    ].some(value => String(value ?? '').toLowerCase().includes(q))
  })
})

const stores = computed(() => {
  const map = new Map<string, {
    id: string
    name: string
    productCount: number
    categories: Set<string>
    minPrice: number
    cover: string
    avatar?: string
    shop_avatar_url?: string | null
    shop_banner_url?: string | null
    shop_name: string
  }>()

  products.value.forEach((product) => {
    const sellerId = product.users?.id
    if (!sellerId) return

    const existing = map.get(sellerId)
    const price = parseFloat(String(product.price ?? 0))
    const category = product.category || 'Uncategorized'

    if (existing) {
      existing.productCount += 1
      existing.categories.add(category)
      existing.minPrice = Math.min(existing.minPrice, price)
      if (!existing.cover && product.image_url) existing.cover = product.image_url
      return
    }

    map.set(sellerId, {
      id: sellerId,
      name: product.users?.shop_name || product.users?.full_name || 'Market Seller',
      shop_name: product.users?.shop_name || product.users?.full_name || 'Market Seller',
      shop_avatar_url: (product.users as any)?.shop_avatar_url ?? null,
      shop_banner_url: (product.users as any)?.shop_banner_url ?? null,
      avatar: (product.users as any)?.shop_avatar_url ?? null,
      productCount: 1,
      categories: new Set([category]),
      minPrice: price,
      cover: product.image_url || fallbackImages[map.size % fallbackImages.length],
    })
  })

  return Array.from(map.values()).map(store => ({
    ...store,
    categories: Array.from(store.categories),
    minPrice: formatPrice(store.minPrice),
  }))
})

const filteredStores = computed(() => {
  const q = searchParam.value.toLowerCase().trim()
  if (!q) return stores.value

  return stores.value.filter(store =>
    [store.name, ...store.categories].some(value => value.toLowerCase().includes(q)),
  )
})

const featuredProducts = computed(() => products.value.slice(0, 3))

const marketStats = computed(() => [
  { label: 'Stores', value: stores.value.length },
  { label: 'Products', value: products.value.length },
  { label: 'Shop Categories', value: uniqueCategories.value.length },
  { label: 'Local Sellers', value: stores.value.length },
])

const uniqueCategories = computed(() => {
  return Array.from(new Set(products.value.map(product => product.category).filter(Boolean)))
})

function productFallbackImage(category: string) {
  const cleanedStr = category || 'All'
  const index = Math.abs(cleanedStr.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % fallbackImages.length
  return fallbackImages[index]
}

function formatPrice(price: string | number) {
  return parseFloat(String(price ?? 0)).toFixed(2)
}

async function fetchProducts() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await api<{ products?: BuyerProduct[] } | BuyerProduct[]>('/api/products')
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

function applySearch() {
  router.replace({
    query: {
      ...route.query,
      search: searchInput.value.trim() || undefined,
    },
  })
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

onMounted(() => {
  fetchProducts()
})

watch(searchParam, value => {
  searchInput.value = value
})

useHead({ title: 'Shop - Senoro Green Farm' })
</script>
