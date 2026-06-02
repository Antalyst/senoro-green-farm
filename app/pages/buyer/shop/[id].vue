<template>
  <PageContainer class="space-y-8 py-5 md:py-8">
    <header class="relative overflow-hidden border border-farm-light bg-farm-dark text-white">
      <img
        :src="storeHeroImage"
        :alt="data?.seller?.full_name ?? 'Farm store'"
        class="absolute inset-0 h-full w-full object-cover opacity-45"
      >
      <div class="absolute inset-0 bg-gradient-to-r from-farm-dark via-farm-dark/85 to-farm-dark/30" />
      <div class="relative p-5 md:p-8">
        <p class="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/65">
          Farm shop
        </p>
        <h1 class="text-3xl font-semibold tracking-tight md:text-5xl">
          {{ data?.seller?.full_name ?? 'Loading store...' }}
        </h1>
        <p class="mt-3 max-w-xl text-sm leading-6 text-white/75">
          {{ data?.seller?.location ?? 'Bago City' }} seller with {{ data?.products?.length ?? 0 }} fresh listings ready for your basket.
        </p>
        <div class="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span class="inline-flex items-center gap-1 bg-white px-3 py-2 text-farm-dark">
            <Icon name="heroicons:star-solid" class="h-4 w-4 text-farm-yellow" />
            <span class="font-semibold">{{ data?.seller?.average_rating?.toFixed(1) ?? '0.0' }}</span>
          </span>
          <span class="border border-white/30 bg-white/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-white">
            {{ data?.seller?.review_count ?? 0 }} reviews
          </span>
          <span class="border border-white/30 bg-white/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-white">
            {{ categories.length }} categories
          </span>
        </div>
      </div>
    </header>

    <section class="flex flex-col gap-3 border border-farm-light bg-white p-4 md:flex-row">
      <div class="flex flex-1 items-center gap-2 border border-farm-light bg-farm-light/30 px-3 py-2">
        <Icon name="heroicons:magnifying-glass" class="h-4 w-4 text-farm-dark/35" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search this shop..."
          class="min-w-0 flex-1 bg-transparent text-sm text-farm-dark outline-none placeholder:text-farm-dark/35"
        >
      </div>
      <select
        v-model="categoryFilter"
        class="border border-farm-light bg-white px-3 py-2 text-xs uppercase tracking-wide text-farm-dark/70"
      >
        <option value="All">All categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <select
        v-model="sortBy"
        class="border border-farm-light bg-white px-3 py-2 text-xs uppercase tracking-wide text-farm-dark/70"
      >
        <option value="default">Sort: Default</option>
        <option value="price-asc">Price: Low to high</option>
        <option value="price-desc">Price: High to low</option>
      </select>
    </section>

    <section class="border border-farm-light">
      <div v-if="pending" class="p-12 text-center text-xs text-farm-dark/40">Loading shop...</div>
      <div v-else-if="!filteredProducts.length" class="p-12 text-center">
        <p class="text-sm font-medium text-farm-dark">No products match your filters</p>
      </div>
      <div v-else class="grid grid-cols-2 gap-px bg-farm-light md:grid-cols-3 lg:grid-cols-4">
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

const storeHeroImage = computed(() => {
  const firstProductImage = data.value?.products?.find(product => product.image_url)?.image_url
  return firstProductImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80'
})

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
