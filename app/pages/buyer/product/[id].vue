<template>
  <div class="pb-36">
    <div v-if="pending" class="py-32 text-center">
      <Icon name="heroicons:arrow-path" class="w-6 h-6 text-farm-leaf animate-spin mx-auto" />
      <p class="mt-3 text-xs text-farm-dark/45 tracking-wide">Loading product…</p>
    </div>

    <div v-else-if="!product" class="py-32 text-center border border-farm-light">
      <p class="text-sm font-medium text-farm-dark">Product not found</p>
      <NuxtLink
        to="/buyer/dashboard"
        class="inline-block mt-4 text-xs font-medium tracking-[0.12em] uppercase text-farm-deep border-b border-farm-deep"
      >
        Return to shop
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Apple-style 50/50 editorial layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 py-8 md:py-12">
        <!-- Left: image showcase -->
        <div class="bg-farm-light border border-farm-light">
          <div class="aspect-square relative flex items-center justify-center overflow-hidden">
            <img
              v-if="product.image_url"
              :src="product.image_url"
              :alt="product.name"
              class="w-full h-full object-cover"
            >
            <span v-else class="text-7xl text-farm-dark/15">{{ visualEmoji }}</span>
            <span
              v-if="product.stock === 0"
              class="absolute inset-0 bg-farm-dark/50 flex items-center justify-center text-[11px] font-medium tracking-[0.2em] uppercase text-white"
            >
              Sold Out
            </span>
          </div>
        </div>

        <!-- Right: details column -->
        <div class="flex flex-col lg:py-4">
          <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-3">
            {{ product.category }}
          </p>
          <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight leading-tight">
            {{ product.name }}
          </h1>

          <p class="mt-6 text-2xl font-medium text-farm-leaf tracking-tight">
            ₱{{ formatPrice(product.price) }}
          </p>
          <p class="text-[11px] text-farm-dark/40 mt-1">per unit · taxes included</p>

          <div class="mt-8 pt-8 border-t border-farm-light space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-farm-dark/50">Availability</span>
              <span class="font-medium" :class="product.stock > 0 ? 'text-farm-leaf' : 'text-red-600'">
                {{ product.stock > 0 ? `${product.stock} in stock` : 'Unavailable' }}
              </span>
            </div>
          </div>

          <p class="mt-8 text-sm text-farm-dark/65 leading-relaxed">
            {{ product.description || 'Premium fresh organic farm produce grown locally by our trusted seller. Hand-picked and packed with care for maximum freshness.' }}
          </p>

          <!-- Merchant badge — wireframe -->
          <div class="mt-10 pt-8 border-t border-farm-light">
            <p class="text-[10px] font-medium tracking-[0.18em] uppercase text-farm-dark/45 mb-4">
              Merchant
            </p>
            <div class="flex items-center justify-between gap-4 border border-farm-light p-4">
              <div class="flex items-center gap-4 min-w-0">
                <div class="w-11 h-11 border border-farm-light flex items-center justify-center text-sm font-medium text-farm-deep flex-shrink-0">
                  {{ sellerInitial }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-farm-dark truncate">{{ sellerName }}</p>
                  <p class="text-[11px] text-farm-dark/45 mt-0.5">Verified farm partner</p>
                </div>
              </div>
              <NuxtLink
                :to="`/buyer/shop/${sellerShopId}`"
                class="flex-shrink-0 px-4 py-2 border border-farm-deep text-farm-deep text-[10px] font-medium tracking-[0.14em] uppercase hover:bg-farm-deep hover:text-white transition-colors duration-300"
              >
                Visit shop
              </NuxtLink>
            </div>
          </div>

          <!-- Quantity — square minimal -->
          <div v-if="product.stock > 0" class="mt-10 hidden lg:block">
            <p class="text-[10px] font-medium tracking-[0.18em] uppercase text-farm-dark/45 mb-3">
              Quantity
            </p>
            <div class="inline-flex border border-farm-light">
              <button
                type="button"
                class="w-12 h-12 flex items-center justify-center text-farm-dark hover:bg-farm-light transition-colors border-r border-farm-light"
                aria-label="Decrease"
                @click="qty = Math.max(1, qty - 1)"
              >
                <Icon name="heroicons:minus" class="w-4 h-4 stroke-[1.5]" />
              </button>
              <span class="w-14 h-12 flex items-center justify-center text-sm font-medium text-farm-dark tabular-nums border-r border-farm-light">
                {{ qty }}
              </span>
              <button
                type="button"
                class="w-12 h-12 flex items-center justify-center text-farm-dark hover:bg-farm-light transition-colors"
                aria-label="Increase"
                @click="qty = Math.min(product.stock, qty + 1)"
              >
                <Icon name="heroicons:plus" class="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>
            <button
              type="button"
              class="mt-6 w-full max-w-sm py-3.5 bg-farm-deep text-white text-xs font-medium tracking-[0.14em] uppercase hover:bg-farm-dark transition-colors duration-300"
              @click="addToCart"
            >
              Add to cart — {{ qty }} {{ qty === 1 ? 'unit' : 'units' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Reviews -->
      <section class="border-t border-farm-light py-12 space-y-8">
        <div class="flex items-end justify-between">
          <h2 class="text-xl font-light text-farm-dark tracking-tight">
            Reviews
          </h2>
          <div v-if="reviews.length > 0" class="flex items-center gap-1.5 text-sm text-farm-dark">
            <Icon name="heroicons:star-solid" class="w-3.5 h-3.5 text-farm-yellow" />
            <span class="font-medium">{{ averageRating.toFixed(1) }}</span>
            <span class="text-farm-dark/40 text-xs">({{ reviews.length }})</span>
          </div>
        </div>

        <div v-if="loadingReviews" class="py-8 text-center text-xs text-farm-dark/45">
          Loading reviews…
        </div>
        <div v-else-if="reviews.length === 0" class="py-12 text-center border border-farm-light">
          <p class="text-sm text-farm-dark/50">No reviews yet.</p>
        </div>
        <div v-else class="space-y-0 divide-y divide-farm-light border-t border-farm-light">
          <article
            v-for="rev in reviews"
            :key="rev.id"
            class="py-8 first:pt-8"
          >
            <div class="flex items-start justify-between gap-4 mb-3">
              <p class="text-sm font-medium text-farm-dark">
                {{ rev.users?.full_name ?? 'Anonymous' }}
              </p>
              <div class="flex gap-0.5">
                <Icon
                  v-for="i in 5"
                  :key="i"
                  :name="i <= rev.rating ? 'heroicons:star-solid' : 'heroicons:star'"
                  class="w-3 h-3"
                  :class="i <= rev.rating ? 'text-farm-yellow' : 'text-farm-light'"
                />
              </div>
            </div>
            <p class="text-sm text-farm-dark/65 leading-relaxed">{{ rev.comment }}</p>
            <div v-if="rev.seller_reply" class="mt-4 pl-4 border-l border-farm-deep/30">
              <p class="text-[10px] font-medium tracking-[0.14em] uppercase text-farm-deep mb-1">Seller</p>
              <p class="text-xs text-farm-dark/60 leading-relaxed">{{ rev.seller_reply }}</p>
            </div>
          </article>
        </div>

        <!-- Write review -->
        <div class="border border-farm-light p-6 md:p-8 bg-farm-light/20">
          <h3 class="text-sm font-medium text-farm-dark mb-4">Write a review</h3>
          <div class="flex gap-1 mb-4">
            <button
              v-for="i in 5"
              :key="i"
              type="button"
              class="p-1"
              @click="newReview.rating = i"
            >
              <Icon
                :name="i <= newReview.rating ? 'heroicons:star-solid' : 'heroicons:star'"
                class="w-5 h-5"
                :class="i <= newReview.rating ? 'text-farm-yellow' : 'text-farm-light'"
              />
            </button>
          </div>
          <textarea
            v-model="newReview.comment"
            rows="3"
            placeholder="Share your experience…"
            class="w-full border border-farm-light bg-white p-4 text-sm text-farm-dark placeholder:text-farm-dark/30 outline-none focus:border-farm-leaf resize-none"
          />
          <button
            type="button"
            :disabled="submittingReview || !newReview.comment.trim()"
            class="mt-4 px-6 py-2.5 border border-farm-deep text-farm-deep text-xs font-medium tracking-[0.12em] uppercase hover:bg-farm-deep hover:text-white transition-colors disabled:opacity-40"
            @click="submitReview"
          >
            Post review
          </button>
        </div>
      </section>
    </template>

    <!-- Mobile sticky purchase bar -->
    <div
      v-if="product && product.stock > 0"
      class="fixed bottom-14 left-0 right-0 z-40 bg-white border-t border-farm-light lg:hidden"
    >
      <div class="max-w-page mx-auto w-full px-4 md:px-8 py-3 flex items-center gap-4">
        <div class="inline-flex border border-farm-light flex-shrink-0">
          <button
            type="button"
            class="w-10 h-10 flex items-center justify-center border-r border-farm-light"
            @click="qty = Math.max(1, qty - 1)"
          >
            <Icon name="heroicons:minus" class="w-3.5 h-3.5" />
          </button>
          <span class="w-10 h-10 flex items-center justify-center text-sm font-medium tabular-nums">{{ qty }}</span>
          <button
            type="button"
            class="w-10 h-10 flex items-center justify-center border-l border-farm-light"
            @click="qty = Math.min(product.stock, qty + 1)"
          >
            <Icon name="heroicons:plus" class="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          type="button"
          class="flex-1 py-3 bg-farm-deep text-white text-xs font-medium tracking-[0.12em] uppercase"
          @click="addToCart"
        >
          Add to cart
        </button>
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
definePageMeta({ layout: 'buyer' })

interface ProductDetail {
  id: string
  name: string
  description?: string
  price: string | number
  stock: number
  category: string
  image_url?: string | null
  seller_id?: string
  users?: { id: string; full_name?: string }
}

interface ReviewItem {
  id: string
  rating: number
  comment: string
  seller_reply?: string | null
  users?: { full_name?: string }
}

const route = useRoute()
const api = useApiFetch()

const refreshCartCount = inject<(() => void) | undefined>('refreshCartCount')
const setSubPageTitle = inject<((title: string) => void) | undefined>('setSubPageTitle')

const productId = computed(() => {
  const id = route.params.id
  return Array.isArray(id) ? id[0] : String(id ?? '')
})

const { data: productResponse, pending, refresh: refreshProduct } = await useAsyncData(
  () => `buyer:product-${productId.value}`,
  async () => {
    const id = productId.value
    if (!id) return null
    return api<{ product: ProductDetail }>(`/api/products/${id}`)
  },
  { watch: [productId], server: false },
)

const product = computed<ProductDetail | null>(() => productResponse.value?.product ?? null)

const sellerShopId = computed(() => product.value?.seller_id ?? product.value?.users?.id ?? '')
const sellerName = computed(() => product.value?.users?.full_name ?? 'Farm Market')
const sellerInitial = computed(() => sellerName.value.charAt(0).toUpperCase())

const categoryVisuals: Record<string, string> = {
  Vegetables: '🥬', Fruits: '🍎', Organic: '🌱', Herbs: '🌿', Dairy: '🥛', Grains: '🌾',
}
const visualEmoji = computed(() => categoryVisuals[product.value?.category ?? ''] ?? '🌱')

function formatPrice(price: string | number) {
  return parseFloat(String(price ?? 0)).toFixed(2)
}

watchEffect(() => {
  const name = product.value?.name
  if (name) setSubPageTitle?.(name)
})

const qty = ref(1)

const { data: reviewsResponse, pending: loadingReviews, refresh: refreshReviews } = await useAsyncData(
  () => `buyer:product-reviews-${productId.value}`,
  async () => {
    const id = product.value?.id
    if (!id) return { reviews: [] as ReviewItem[] }
    return api<{ reviews: ReviewItem[] }>('/api/products/reviews', { params: { product_id: id } })
  },
  { watch: [() => product.value?.id], server: false },
)

const reviews = computed(() => reviewsResponse.value?.reviews ?? [])

const averageRating = computed(() => {
  const list = reviews.value
  if (list.length === 0) return 0
  return list.reduce((acc, rev) => acc + rev.rating, 0) / list.length
})

const submittingReview = ref(false)
const newReview = ref({ rating: 5, comment: '' })

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 4000)
}

async function addToCart() {
  const p = product.value
  if (!p || p.stock === 0) return
  try {
    await api('/api/cart/add', {
      method: 'POST',
      body: { product_id: p.id, quantity: qty.value },
    })
    triggerToast(`Added ${qty.value} unit(s) to cart.`)
    refreshCartCount?.()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Failed to add to cart', 'error')
  }
}

async function submitReview() {
  const p = product.value
  if (!p || !newReview.value.comment.trim()) return
  submittingReview.value = true
  try {
    await api('/api/products/review', {
      method: 'POST',
      body: {
        product_id: p.id,
        rating: newReview.value.rating,
        comment: newReview.value.comment.trim(),
      },
    })
    triggerToast('Review submitted.')
    newReview.value = { rating: 5, comment: '' }
    await refreshReviews()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Could not submit review', 'error')
  }
  finally {
    submittingReview.value = false
  }
}

watch(productId, () => {
  qty.value = 1
  refreshProduct()
})

useHead({ title: 'Product — Senoro Green Farm' })
</script>
