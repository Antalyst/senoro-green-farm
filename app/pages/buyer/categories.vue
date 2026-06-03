<template>
  <div class="space-y-10 py-8 md:py-12">
      <header class="border-b border-farm-light pb-8">
        <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-2">
          Catalogue
        </p>
        <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight">
          Browse categories
        </h1>
      </header>

      <!-- Sector Tabs -->
      <section>
        <div class="flex border-b-2 border-farm-light">
          <button
            v-for="sector in sectors"
            :key="sector.key"
            type="button"
            class="flex-1 py-4 text-center text-xs font-bold tracking-[0.15em] uppercase transition-colors border-b-[3px] -mb-[2px]"
            :class="activeSector === sector.key
              ? sector.key === 'street_food'
                ? 'text-market-orange border-market-orange'
                : 'text-farm-leaf border-farm-leaf'
              : 'text-farm-dark/40 border-transparent hover:text-farm-dark/70'"
            @click="activeSector = sector.key"
          >
            <span class="text-base mr-1.5">{{ sector.emoji }}</span>
            {{ sector.label }}
          </button>
        </div>
      </section>

      <!-- Sub-Category Filter Toggles -->
      <section>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] uppercase border transition-colors"
            :class="activeCategory === 'all'
              ? activeSector === 'street_food'
                ? 'bg-market-orange text-white border-market-orange'
                : 'bg-farm-leaf text-white border-farm-leaf'
              : 'text-farm-dark/60 border-farm-light hover:border-farm-dark/30'"
            @click="activeCategory = 'all'"
          >
            All
          </button>
          <button
            v-for="cat in activeSectorCategories"
            :key="cat.value"
            type="button"
            class="px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] uppercase border transition-colors"
            :class="activeCategory === cat.value
              ? activeSector === 'street_food'
                ? 'bg-market-orange text-white border-market-orange'
                : 'bg-farm-leaf text-white border-farm-leaf'
              : 'text-farm-dark/60 border-farm-light hover:border-farm-dark/30'"
            @click="activeCategory = cat.value"
          >
            {{ cat.emoji }} {{ cat.shortLabel }}
          </button>
        </div>
      </section>

      <!-- Products -->
      <section class="border-t border-farm-light pt-10">
        <div class="flex items-end justify-between mb-8">
          <h2 class="text-xl font-light text-farm-dark tracking-tight">
            {{ activeSectorLabel }}
            <span v-if="activeCategory !== 'all'" class="text-farm-dark/50"> / {{ activeCategoryLabel }}</span>
          </h2>
          <span v-if="!pending" class="text-[11px] text-farm-dark/40">
            {{ productList.length }} items
          </span>
        </div>

        <div v-if="pending" class="py-20 text-center">
          <Icon name="heroicons:arrow-path" class="w-6 h-6 text-farm-leaf animate-spin mx-auto" />
          <p class="mt-3 text-xs text-farm-dark/45">Searching inventory…</p>
        </div>

        <div v-else-if="productList.length === 0" class="py-20 text-center border border-farm-light">
          <p class="text-sm font-medium text-farm-dark">No items found</p>
          <p class="text-xs text-farm-dark/45 mt-1">Try another category or sector.</p>
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <BuyerProductCard
            v-for="product in productList"
            :key="product.id"
            :product="product"
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

const route = useRoute()
const api = useApiFetch()

const refreshCartCount = inject<(() => void) | undefined>('refreshCartCount')

// Dual-Sector definition
const sectors = [
  { key: 'street_food', label: 'Street Food & Eats', emoji: '🔥' },
  { key: 'farm', label: 'Fresh Farm Hub', emoji: '🌿' },
]

const productCategories = [
  // Street Food & Eats Sector
  { value: 'street_food_fried_grilled', label: 'Street Food - Fried & Grilled', shortLabel: 'Fried & Grilled', emoji: '🍗', sector: 'street_food' },
  { value: 'street_food_steamed_dimsum', label: 'Street Food - Steamed & Dimsum', shortLabel: 'Steamed & Dimsum', emoji: '🥟', sector: 'street_food' },
  { value: 'street_food_snacks_kakanin', label: 'Street Food - Local Snacks & Kakanin', shortLabel: 'Snacks & Kakanin', emoji: '🍢', sector: 'street_food' },
  { value: 'street_food_beverages_desserts', label: 'Street Food - Beverages & Desserts', shortLabel: 'Beverages & Desserts', emoji: '🥤', sector: 'street_food' },
  // Fresh Farm Hub Sector
  { value: 'farm_vegetables', label: 'Farm - Vegetables', shortLabel: 'Vegetables', emoji: '🥬', sector: 'farm' },
  { value: 'farm_fruits', label: 'Farm - Fruits', shortLabel: 'Fruits', emoji: '🍎', sector: 'farm' },
  { value: 'farm_herbs_spices', label: 'Farm - Herbs & Spices', shortLabel: 'Herbs & Spices', emoji: '🌿', sector: 'farm' },
  { value: 'farm_rice_grains', label: 'Farm - Rice & Grains', shortLabel: 'Rice & Grains', emoji: '🌾', sector: 'farm' },
  { value: 'farm_poultry_dairy', label: 'Farm - Poultry & Dairy', shortLabel: 'Poultry & Dairy', emoji: '🥛', sector: 'farm' },
]

const activeSector = ref('street_food')
const activeCategory = ref('all')

// Reset sub-category when sector changes
watch(activeSector, () => {
  activeCategory.value = 'all'
})

const activeSectorCategories = computed(() =>
  productCategories.filter(c => c.sector === activeSector.value)
)

const activeSectorLabel = computed(() =>
  sectors.find(s => s.key === activeSector.value)?.label ?? ''
)

const activeCategoryLabel = computed(() =>
  productCategories.find(c => c.value === activeCategory.value)?.shortLabel ?? ''
)

const searchParam = computed(() => (route.query.search as string) || '')

// Fetch all products for the current sector prefix, then filter client-side by sub-category
const { data: productsData, pending } = await useAsyncData(
  'buyer:categories-products',
  () => {
    const params: Record<string, string> = {}
    // If a specific sub-category is chosen, use exact match
    if (activeCategory.value !== 'all') {
      params.category = activeCategory.value
    }
    if (searchParam.value) params.search = searchParam.value
    return api<{ products?: BuyerProduct[] }>('/api/products', { params })
  },
  { watch: [activeCategory, searchParam], server: false },
)

const productList = computed<BuyerProduct[]>(() => {
  const all = productsData.value?.products ?? []
  // When "all" is selected, filter by sector prefix client-side
  if (activeCategory.value === 'all') {
    const prefix = activeSector.value + '_'
    return all.filter(p => (p as any).category?.startsWith(prefix))
  }
  return all
})

const { addToCart, buyNow } = useProductActions()

async function handleAddToCart(product: BuyerProduct) {
  if (!product || product.stock === 0) return
  try {
    await addToCart(product.id)
    triggerToast(`Added ${product.name} to cart.`)
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

useHead({ title: 'Categories — Senoro Green Farm' })
</script>
