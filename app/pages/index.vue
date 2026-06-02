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
              Farm mall
            </span>
            <span class="border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em]">
              {{ stores.length }} local stores
            </span>
          </div>

          <div class="max-w-xl">
            <p class="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-white/70">
              Senoro Green Farm
            </p>
            <h1 class="text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
              Shop fresh vegetables by trusted farm store.
            </h1>
            <p class="mt-4 max-w-lg text-sm leading-6 text-white/78 md:text-base">
              Browse sellers like a marketplace, open each store, and pick harvest-ready products for your cart.
            </p>
            <div class="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#stores"
                class="inline-flex items-center gap-2 bg-farm-yellow px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-farm-dark transition-colors hover:bg-white"
              >
                <Icon name="heroicons:building-storefront" class="h-4 w-4" />
                View stores
              </a>
              <NuxtLink
                to="/buyer/categories"
                class="inline-flex items-center gap-2 border border-white/45 bg-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-farm-dark"
              >
                <Icon name="heroicons:squares-2x2" class="h-4 w-4" />
                All products
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <aside class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div class="border border-farm-light bg-farm-light/40 p-5">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-farm-dark/45">Daily deal</p>
              <h2 class="mt-1 text-lg font-semibold text-farm-dark">Harvest flash sale</h2>
            </div>
            <span class="bg-farm-deep px-3 py-1 text-xs font-semibold text-white">{{ countdown }}</span>
          </div>
          <div class="mt-5 space-y-3">
            <NuxtLink
              v-for="item in flashProducts"
              :key="item.id"
              :to="`/buyer/product/${item.id}`"
              class="flex items-center gap-3 border border-farm-light bg-white p-2 transition-colors hover:border-farm-leaf/50"
            >
              <img
                :src="item.image_url || productFallbackImage(item.category)"
                :alt="item.name"
                class="h-14 w-14 object-cover"
              >
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-farm-dark">{{ item.name }}</span>
                <span class="text-xs font-semibold text-farm-leaf">PHP {{ formatPrice(item.price) }}</span>
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
            <p class="mt-3 text-xs leading-5 text-white/75">Fresh produce from nearby sellers, packed for same-day routes.</p>
          </div>
        </div>
      </aside>
    </section>

    <section class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div
        v-for="stat in marketStats"
        :key="stat.label"
        class="border border-farm-light bg-white p-4"
      >
        <p class="text-2xl font-semibold text-farm-dark">{{ stat.value }}</p>
        <p class="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-farm-dark/45">{{ stat.label }}</p>
      </div>
    </section>

    <section id="stores" class="border-t border-farm-light pt-8">
      <div class="mb-5 flex items-end justify-between gap-4">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-farm-dark/45">Shop by store</p>
          <h2 class="mt-1 text-2xl font-semibold tracking-tight text-farm-dark">Farm stores</h2>
        </div>
        <span v-if="!loading" class="text-xs text-farm-dark/45">{{ stores.length }} sellers</span>
      </div>

      <div v-if="loading" class="grid gap-4 md:grid-cols-3">
        <div v-for="n in 3" :key="n" class="h-48 animate-pulse bg-farm-light" />
      </div>

      <div v-else-if="stores.length" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="store in stores"
          :key="store.id"
          :to="`/buyer/shop/${store.id}`"
          class="group overflow-hidden border border-farm-light bg-white transition-colors hover:border-farm-deep/45"
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
                <p class="truncate text-base font-semibold text-white">{{ store.name }}</p>
                <p class="text-xs text-white/75">{{ store.productCount }} products</p>
              </div>
              <span class="bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-farm-deep">
                Visit
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between gap-3 p-4">
            <div class="flex min-w-0 flex-wrap gap-2">
              <span
                v-for="cat in store.categories.slice(0, 3)"
                :key="cat"
                class="bg-farm-light px-2 py-1 text-[10px] font-medium text-farm-dark/65"
              >
                {{ cat }}
              </span>
            </div>
            <span class="text-sm font-semibold text-farm-leaf">PHP {{ store.minPrice }}+</span>
          </div>
        </NuxtLink>
      </div>

      <div v-else class="border border-farm-light p-12 text-center">
        <p class="text-sm font-medium text-farm-dark">No stores available yet</p>
        <p class="mt-1 text-xs text-farm-dark/45">Seller stores will appear once products are listed.</p>
      </div>
    </section>

    <section class="border-t border-farm-light pt-8">
      <h2 class="mb-5 text-xl font-semibold tracking-tight text-farm-dark">Shop by category</h2>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-7">
        <button
          v-for="cat in categoryOptions"
          :key="cat.name"
          type="button"
          class="flex min-h-24 flex-col justify-between border border-farm-light bg-white p-3 text-left transition-colors"
          :class="activeCategory === cat.name ? 'border-farm-deep bg-farm-light/60' : 'hover:border-farm-leaf/50'"
          @click="selectCategory(cat.name)"
        >
          <Icon :name="cat.icon" class="h-6 w-6 text-farm-leaf" />
          <span class="text-xs font-semibold uppercase tracking-[0.1em] text-farm-dark">{{ cat.name }}</span>
        </button>
      </div>
    </section>

    <section class="border-t border-farm-light pt-8">
      <div class="mb-5 flex items-end justify-between gap-4">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-farm-dark/45">Marketplace picks</p>
          <h2 class="mt-1 text-2xl font-semibold tracking-tight text-farm-dark">Fresh products</h2>
        </div>
        <span v-if="!loading" class="text-xs text-farm-dark/45">{{ products.length }} items</span>
      </div>

      <div v-if="loading" class="py-20 text-center">
        <Icon name="heroicons:arrow-path" class="mx-auto h-6 w-6 animate-spin text-farm-leaf" />
        <p class="mt-3 text-xs tracking-wide text-farm-dark/45">Loading marketplace...</p>
      </div>

      <div v-else-if="loadError" class="border border-farm-light py-16 text-center">
        <p class="text-sm text-farm-dark/70">{{ loadError }}</p>
        <button
          type="button"
          class="mt-4 border-b border-farm-deep pb-0.5 text-xs font-medium uppercase tracking-[0.12em] text-farm-deep"
          @click="fetchProducts"
        >
          Try again
        </button>
      </div>

      <div v-else-if="products.length === 0" class="border border-farm-light py-20 text-center">
        <p class="text-sm font-medium text-farm-dark">No produce available</p>
        <p class="mt-1 text-xs text-farm-dark/45">Adjust filters or check back soon.</p>
      </div>

      <div v-else class="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        <BuyerProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          show-savings-hint
          @add-to-cart="handleAddToCart"
          @buy-now="handleBuyNow"
        />
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

const { user } = useAuth()
const router = useRouter()
const route = useRoute()
const api = useApiFetch()

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

const categoryOptions = [
  { name: 'All', icon: 'heroicons:sparkles' },
  { name: 'Vegetables', icon: 'heroicons:squares-2x2' },
  { name: 'Fruits', icon: 'heroicons:heart' },
  { name: 'Organic', icon: 'heroicons:globe-alt' },
  { name: 'Herbs', icon: 'heroicons:beaker' },
  { name: 'Dairy', icon: 'heroicons:shopping-bag' },
  { name: 'Grains', icon: 'heroicons:cube' },
]

const searchParam = computed(() => (route.query?.search as string) || '')
const categoryParam = computed(() => (route.query?.category as string) || 'All')

const displayName = computed(() => {
  const name = user.value?.full_name
  return name?.split(' ')[0] ?? 'Guest'
})

const stores = computed(() => {
  const map = new Map<string, {
    id: string
    name: string
    productCount: number
    categories: Set<string>
    minPrice: number
    cover: string
  }>()

  products.value.forEach((product) => {
    const sellerId = product.users?.id
    if (!sellerId) return

    const existing = map.get(sellerId)
    const price = parseFloat(String(product.price ?? 0))
    if (existing) {
      existing.productCount += 1
      existing.categories.add(product.category)
      existing.minPrice = Math.min(existing.minPrice, price)
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

function productFallbackImage(category: string) {
  const index = Math.abs(category.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % fallbackImages.length
  return fallbackImages[index]
}

function formatPrice(price: string | number) {
  return parseFloat(String(price ?? 0)).toFixed(2)
}

async function fetchProducts() {
  loading.value = true
  loadError.value = ''
  try {
    const params: Record<string, string> = {}
    const cat = categoryParam.value
    const search = searchParam.value
    if (cat && cat !== 'All') params.category = cat
    if (search) params.search = search

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

function selectCategory(cat: string) {
  activeCategory.value = cat
  router.replace({ query: { ...route.query, category: cat === 'All' ? undefined : cat } })
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
  activeCategory.value = categoryParam.value

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
  fetchProducts()
})

useHead({ title: 'Shop - Senoro Green Farm' })
</script>
