<template>
  <div class="space-y-12 py-8 md:py-12">
      <header class="border-b border-farm-light pb-8">
        <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-2">
          Catalogue
        </p>
        <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight">
          Browse categories
        </h1>
      </header>

      <!-- Category matrix -->
      <section>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-px bg-farm-light border border-farm-light">
          <button
            v-for="cat in categories"
            :key="cat.name"
            type="button"
            class="bg-white py-8 px-4 flex flex-col items-center justify-center gap-3 transition-colors duration-300"
            :class="activeCategory === cat.name
              ? 'ring-1 ring-inset ring-farm-deep'
              : 'hover:bg-farm-light/40'"
            @click="selectCategory(cat.name)"
          >
            <span class="text-2xl opacity-60">{{ cat.emoji }}</span>
            <span
              class="text-[11px] font-medium tracking-[0.16em] uppercase"
              :class="activeCategory === cat.name ? 'text-farm-deep' : 'text-farm-dark/50'"
            >
              {{ cat.name }}
            </span>
          </button>
        </div>
      </section>

      <!-- Products -->
      <section class="border-t border-farm-light pt-10">
        <div class="flex items-end justify-between mb-8">
          <h2 class="text-xl font-light text-farm-dark tracking-tight">
            {{ activeCategory }}
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
          <p class="text-sm font-medium text-farm-dark">No items in {{ activeCategory }}</p>
          <p class="text-xs text-farm-dark/45 mt-1">Try another category.</p>
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <BuyerProductCard
            v-for="product in productList"
            :key="product.id"
            :product="product"
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

const route = useRoute()
const api = useApiFetch()

const refreshCartCount = inject<(() => void) | undefined>('refreshCartCount')

const activeCategory = ref('Vegetables')

const categories = [
  { name: 'Vegetables', emoji: '🥬' },
  { name: 'Fruits', emoji: '🍎' },
  { name: 'Organic', emoji: '🌱' },
  { name: 'Herbs', emoji: '🌿' },
  { name: 'Dairy', emoji: '🥛' },
  { name: 'Grains', emoji: '🌾' },
]

const searchParam = computed(() => (route.query.search as string) || '')

const { data: productsData, pending, refresh } = await useAsyncData(
  'buyer:categories-products',
  () => {
    const params: Record<string, string> = { category: activeCategory.value }
    if (searchParam.value) params.search = searchParam.value
    return api<{ products?: BuyerProduct[] }>('/api/products', { params })
  },
  { watch: [activeCategory, searchParam], server: false },
)

const productList = computed<BuyerProduct[]>(() => productsData.value?.products ?? [])

function selectCategory(catName: string) {
  activeCategory.value = catName
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

useHead({ title: 'Categories — Senoro Green Farm' })
</script>
