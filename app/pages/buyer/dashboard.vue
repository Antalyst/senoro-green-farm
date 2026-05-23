<template>
  <div class="space-y-12 py-8 md:py-12">
      <!-- Hero — minimal promotional canvas -->
      <section class="border border-farm-light bg-farm-light/40 p-8 md:p-12">
        <div class="max-w-lg">
          <p class="text-[11px] font-medium tracking-[0.22em] uppercase text-farm-dark/50 mb-3">
            Senoro Green Farm
          </p>
          <h1 class="text-3xl md:text-4xl font-light text-farm-dark tracking-tight leading-[1.15]">
            Fresh harvest,<br>
            <span class="font-medium text-farm-deep">delivered with care.</span>
          </h1>
          <p class="mt-4 text-sm text-farm-dark/60 leading-relaxed max-w-md">
            Welcome back, {{ displayName }}. Curated organic produce from trusted local farmers — composed for your table.
          </p>
          <div class="mt-8 flex flex-wrap items-center gap-4">
            <NuxtLink
              to="/buyer/categories"
              class="inline-flex items-center gap-2 px-6 py-2.5 border border-farm-deep text-farm-deep text-xs font-medium tracking-[0.12em] uppercase hover:bg-farm-deep hover:text-white transition-colors duration-300"
            >
              Browse collection
            </NuxtLink>
            <span class="text-[11px] text-farm-dark/45 tracking-wide">
              Free delivery · orders ₱300+
            </span>
          </div>
        </div>
      </section>

      <!-- Flash sale — quiet ticker -->
      <section class="border-t border-farm-light pt-10">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-1">
              Limited run
            </p>
            <h2 class="text-xl font-light text-farm-dark tracking-tight">
              Flash selection
            </h2>
          </div>
          <div class="flex items-baseline gap-3 text-farm-dark">
            <span class="text-[10px] uppercase tracking-[0.16em] text-farm-dark/45">Ends in</span>
            <span class="text-lg font-medium tabular-nums tracking-wider">{{ countdown }}</span>
          </div>
        </div>

        <div v-if="flashProducts.length" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="(item, idx) in flashProducts"
            :key="item.id"
            class="border border-farm-light p-4 bg-white"
          >
            <div class="flex justify-between items-start gap-2 mb-3">
              <p class="text-sm font-medium text-farm-dark line-clamp-1">{{ item.name }}</p>
              <span class="text-sm text-farm-leaf font-medium flex-shrink-0">₱{{ formatPrice(item.price) }}</span>
            </div>
            <div class="h-px w-full bg-farm-light overflow-hidden">
              <div
                class="h-full bg-farm-leaf transition-all duration-500"
                :style="{ width: `${flashProgress[idx]}%` }"
              />
            </div>
            <p class="mt-2 text-[10px] text-farm-dark/40 tracking-wide">
              {{ flashProgress[idx] }}% claimed
            </p>
          </div>
        </div>
      </section>

      <!-- Categories — border-only matrix -->
      <section class="border-t border-farm-light pt-10">
        <h2 class="text-xl font-light text-farm-dark tracking-tight mb-6">
          Shop by category
        </h2>
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-px bg-farm-light border border-farm-light">
          <button
            v-for="cat in categoryOptions"
            :key="cat.name"
            type="button"
            class="bg-white py-5 px-2 flex flex-col items-center justify-center gap-2 transition-colors duration-300"
            :class="activeCategory === cat.name
              ? 'ring-1 ring-inset ring-farm-deep bg-farm-light/30'
              : 'hover:bg-farm-light/50'"
            @click="selectCategory(cat.name)"
          >
            <span class="text-lg opacity-70">{{ cat.emoji }}</span>
            <span
              class="text-[10px] font-medium tracking-[0.14em] uppercase"
              :class="activeCategory === cat.name ? 'text-farm-deep' : 'text-farm-dark/55'"
            >
              {{ cat.name }}
            </span>
          </button>
        </div>
      </section>

      <!-- Product grid -->
      <section class="border-t border-farm-light pt-10">
        <div class="flex items-end justify-between mb-8">
          <h2 class="text-xl font-light text-farm-dark tracking-tight">
            Daily discoveries
          </h2>
          <span v-if="!loading" class="text-[11px] text-farm-dark/40 tracking-wide">
            {{ products.length }} items
          </span>
        </div>

        <div v-if="loading" class="py-20 text-center">
          <Icon name="heroicons:arrow-path" class="w-6 h-6 text-farm-leaf animate-spin mx-auto" />
          <p class="mt-3 text-xs text-farm-dark/45 tracking-wide">Loading collection…</p>
        </div>

        <div v-else-if="loadError" class="py-16 text-center border border-farm-light">
          <p class="text-sm text-farm-dark/70">{{ loadError }}</p>
          <button
            type="button"
            class="mt-4 text-xs font-medium tracking-[0.12em] uppercase text-farm-deep border-b border-farm-deep pb-0.5"
            @click="fetchProducts"
          >
            Try again
          </button>
        </div>

        <div v-else-if="products.length === 0" class="py-20 text-center border border-farm-light">
          <p class="text-sm font-medium text-farm-dark">No produce available</p>
          <p class="text-xs text-farm-dark/45 mt-1">Adjust filters or check back soon.</p>
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <BuyerProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
            show-savings-hint
            @add-to-cart="addToCart"
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

const refreshCartCount = inject<(() => void) | undefined>('refreshCartCount')

const countdown = ref('02:35:10')
const activeCategory = ref('All')
const products = ref<BuyerProduct[]>([])
const loading = ref(true)
const loadError = ref('')

const categoryOptions = [
  { name: 'All', emoji: '·' },
  { name: 'Vegetables', emoji: '🥬' },
  { name: 'Fruits', emoji: '🍎' },
  { name: 'Organic', emoji: '🌱' },
  { name: 'Herbs', emoji: '🌿' },
  { name: 'Dairy', emoji: '🥛' },
  { name: 'Grains', emoji: '🌾' },
]

const searchParam = computed(() => (route.query?.search as string) || '')
const categoryParam = computed(() => (route.query?.category as string) || 'All')

const displayName = computed(() => {
  const name = user.value?.full_name
  return name?.split(' ')[0] ?? 'Guest'
})

const flashProducts = computed(() => products.value.slice(0, 3))
const flashProgress = computed(() => {
  const base = [72, 58, 41]
  return flashProducts.value.map((_, i) => base[i] ?? 50)
})

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

async function addToCart(product: BuyerProduct, quantity = 1) {
  if (!product || product.stock === 0) return
  try {
    await api('/api/cart/add', {
      method: 'POST',
      body: { product_id: product.id, quantity },
    })
    triggerToast(`Added ${product.name} to cart.`)
    refreshCartCount?.()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Failed to add item to cart', 'error')
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

useHead({ title: 'Shop — Senoro Green Farm' })
</script>
