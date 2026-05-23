<template>
  <PageContainer class="space-y-12 py-8 md:py-12">
    <header class="border-b border-farm-light pb-8">
      <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-2">
        Farm shop
      </p>
      <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight">
        {{ data?.seller?.full_name ?? 'Loading store…' }}
      </h1>
      <p class="text-sm text-farm-dark/50 mt-2">
        {{ data?.seller?.location ?? 'Bago City' }} · {{ data?.products?.length ?? 0 }} listings
      </p>
      <div class="flex items-center gap-3 mt-3 text-sm text-farm-dark">
        <span class="flex items-center gap-1">
          <Icon name="heroicons:star-solid" class="w-4 h-4 text-farm-yellow" />
          <span class="font-medium">{{ data?.seller?.average_rating?.toFixed(1) ?? '—' }}</span>
        </span>
        <span class="text-farm-dark/30">|</span>
        <span class="text-xs text-farm-dark/45">{{ data?.seller?.review_count ?? 0 }} reviews</span>
      </div>
    </header>

    <section class="flex flex-col md:flex-row gap-3 border border-farm-light p-4">
      <div class="flex-1 flex items-center border border-farm-light bg-farm-light/30 px-3 py-2 gap-2">
        <Icon name="heroicons:magnifying-glass" class="w-4 h-4 text-farm-dark/35" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search this shop…"
          class="bg-transparent text-sm text-farm-dark flex-1 outline-none placeholder:text-farm-dark/35"
        >
      </div>
      <select
        v-model="categoryFilter"
        class="text-xs border border-farm-light px-3 py-2 text-farm-dark/70 bg-white uppercase tracking-wide"
      >
        <option value="All">All categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <select
        v-model="sortBy"
        class="text-xs border border-farm-light px-3 py-2 text-farm-dark/70 bg-white uppercase tracking-wide"
      >
        <option value="default">Sort: Default</option>
        <option value="price-asc">Price: Low to high</option>
        <option value="price-desc">Price: High to low</option>
      </select>
    </section>

    <section class="border border-farm-light">
      <div v-if="pending" class="p-12 text-center text-xs text-farm-dark/40">Loading shop…</div>
      <div v-else-if="!filteredProducts.length" class="p-12 text-center">
        <p class="text-sm font-medium text-farm-dark">No products match your filters</p>
      </div>
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-farm-light">
        <BuyerProductCard
          v-for="product in filteredProducts"
          :key="product.id"
          :product="product"
          class="bg-white"
          @add-to-cart="handleAddToCart"
          @buy-now="handleBuyNow"
        />
      </div>
    </section>

    <BuyerToast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </PageContainer>
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
  location?: string
  average_rating?: number
  review_count?: number
}

const searchQuery = ref('')
const categoryFilter = ref('All')
const sortBy = ref<'default' | 'price-asc' | 'price-desc'>('default')

const { data, pending } = await useAsyncData(
  () => `buyer:shop-${route.params.id}`,
  () => api<{ seller: ShopSeller; products: BuyerProduct[] }>(`/api/seller/profile/${route.params.id}`),
  { server: false },
)

watchEffect(() => {
  if (data.value?.seller?.full_name) setSubPageTitle?.(data.value.seller.full_name)
})

const categories = computed(() => {
  const set = new Set((data.value?.products ?? []).map(p => p.category))
  return Array.from(set).sort()
})

const filteredProducts = computed(() => {
  let list = [...(data.value?.products ?? [])]
  if (categoryFilter.value !== 'All') {
    list = list.filter(p => p.category === categoryFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(p => p.name.toLowerCase().includes(q))
  }
  if (sortBy.value === 'price-asc') {
    list.sort((a, b) => parseFloat(String(a.price)) - parseFloat(String(b.price)))
  }
  else if (sortBy.value === 'price-desc') {
    list.sort((a, b) => parseFloat(String(b.price)) - parseFloat(String(a.price)))
  }
  return list
})

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 4000)
}

async function handleAddToCart(product: BuyerProduct) {
  try {
    await addToCart(product.id)
    triggerToast(`Added ${product.name} to cart.`)
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

useHead({ title: 'Shop — Senoro Green Farm' })
</script>
