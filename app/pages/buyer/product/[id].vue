<template>
  <div class="pb-40 lg:pb-12">
    <p v-if="pending && !product" class="py-32 text-center text-sm text-gray-400">Loading…</p>

    <div v-else-if="!product" class="mx-auto max-w-sm py-24 text-center">
      <Icon name="heroicons:shopping-bag" class="mx-auto h-10 w-10 text-gray-300" />
      <p class="mt-3 text-base font-semibold text-shop-ink">Product not found</p>
      <p class="mt-1 text-sm text-gray-500">It may have been removed by the seller.</p>
      <NuxtLink to="/" class="mt-5 inline-flex min-h-[40px] items-center rounded bg-farm-leaf px-5 text-sm font-semibold text-white hover:bg-farm-deep">
        Back to shop
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Product -->
      <section class="grid grid-cols-1 gap-6 pt-4 md:pt-8 lg:grid-cols-2 lg:gap-12">
        <!-- Photo -->
        <div class="relative -mx-4 overflow-hidden bg-shop-cream md:mx-0 md:rounded-lg">
          <img
            :src="product.image_url || fallbackProductImage(product.category)"
            :alt="product.name"
            class="aspect-square w-full object-cover"
          >
          <span
            v-if="soldOut"
            class="absolute inset-0 flex items-center justify-center bg-white/60 text-sm font-semibold uppercase tracking-[0.2em] text-gray-600"
          >
            Sold out
          </span>
          <span
            v-else-if="lowStock"
            class="absolute left-3 top-3 rounded bg-market-orange px-2 py-1 text-xs font-semibold text-white"
          >
            Only {{ product.stock }} left
          </span>
        </div>

        <!-- Details -->
        <div class="flex flex-col">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-shop-mint px-2.5 py-0.5 text-xs font-medium text-farm-deep">{{ product.category || 'Farm produce' }}</span>
            <NuxtLink v-if="sellerShopId" :to="`/buyer/shop/${sellerShopId}`" class="truncate text-xs text-gray-500 hover:text-farm-leaf">
              by {{ shopName }}
            </NuxtLink>
          </div>

          <h1 class="mt-2 text-2xl font-bold leading-tight text-shop-ink md:text-3xl">{{ product.name }}</h1>

          <a v-if="reviews.length" href="#reviews" class="mt-2 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-farm-leaf">
            <UiStarRating :value="averageRating" size="md" />
            <span class="font-medium text-shop-ink">{{ averageRating.toFixed(1) }}</span>
            <span>· {{ reviews.length }} {{ reviews.length === 1 ? 'review' : 'reviews' }}</span>
          </a>
          <p v-else-if="!loadingReviews" class="mt-2 text-sm text-gray-400">No reviews yet</p>

          <div class="mt-5 flex flex-wrap items-end justify-between gap-3 border-y border-gray-100 py-4">
            <p class="tabular-nums">
              <span class="text-3xl font-bold text-farm-leaf">{{ formatPeso(product.price) }}</span>
              <span class="ml-1 text-sm text-gray-400">/ {{ unit }}</span>
            </p>
            <span
              class="rounded-full px-2.5 py-1 text-xs font-medium"
              :class="soldOut ? 'bg-red-50 text-red-600' : lowStock ? 'bg-market-orange/10 text-market-orange' : 'bg-shop-mint text-farm-deep'"
            >
              {{ soldOut ? 'Sold out' : `${product.stock} ${unit} available` }}
            </span>
          </div>

          <!-- Desktop: quantity + buttons (phones use the bar at the bottom) -->
          <div v-if="!soldOut" class="mt-6 hidden space-y-4 lg:block">
            <div class="flex items-center gap-4">
              <span class="text-sm font-medium text-shop-ink">Quantity</span>
              <div class="qty">
                <button type="button" class="qty-btn" aria-label="Decrease quantity" :disabled="qty <= 1" @click="qty = Math.max(1, qty - 1)">
                  <Icon name="heroicons:minus" class="h-4 w-4" />
                </button>
                <span class="qty-value">{{ qty }}</span>
                <button type="button" class="qty-btn" aria-label="Increase quantity" :disabled="qty >= product.stock" @click="qty = Math.min(product.stock, qty + 1)">
                  <Icon name="heroicons:plus" class="h-4 w-4" />
                </button>
              </div>
              <span class="text-sm tabular-nums text-gray-500">Total {{ formatPeso(Number(product.price) * qty) }}</span>
            </div>
            <div class="grid max-w-md grid-cols-2 gap-3">
              <button type="button" class="btn-cart" :disabled="busy" @click="addToCart">
                <Icon name="heroicons:shopping-cart" class="h-5 w-5" />
                Add to cart
              </button>
              <button type="button" class="btn-buy" :disabled="busy" @click="buyNowCheckout">Buy now</button>
            </div>
          </div>

          <!-- Real promises only (see docs/design-storefront-redesign.md §4.4) -->
          <ul class="mt-6 grid grid-cols-1 gap-3 rounded-lg bg-shop-mint p-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <li v-for="item in promises" :key="item.label" class="flex items-center gap-3">
              <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-farm-leaf">
                <Icon :name="item.icon" class="h-5 w-5" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-shop-ink">{{ item.label }}</span>
                <span class="block text-xs text-gray-500">{{ item.caption }}</span>
              </span>
            </li>
          </ul>

          <div v-if="product.description" class="mt-6">
            <h2 class="text-base font-semibold text-shop-ink">About this product</h2>
            <p class="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">{{ product.description }}</p>
          </div>

          <!-- Seller -->
          <div v-if="sellerShopId" class="mt-6 flex items-center gap-3 rounded-lg border border-gray-100 p-4">
            <AccountAvatar
              :name="shopName"
              :url="product.users?.shop_avatar_url"
              class="h-12 w-12 rounded-full bg-farm-leaf text-base text-white"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-shop-ink">{{ shopName }}</p>
              <p class="flex items-center gap-1 text-xs text-gray-500">
                <Icon name="heroicons:check-badge" class="h-4 w-4 text-farm-leaf" />
                Approved seller
              </p>
            </div>
            <NuxtLink
              :to="`/buyer/shop/${sellerShopId}`"
              class="inline-flex min-h-[40px] flex-shrink-0 items-center rounded border border-farm-leaf px-4 text-sm font-semibold text-farm-leaf transition-colors hover:bg-farm-leaf hover:text-white"
            >
              Visit shop
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Reviews -->
      <section id="reviews" class="mt-12 scroll-mt-20 md:mt-16">
        <StorefrontSectionHeading label="What buyers say" title="Reviews" align="left" />

        <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:gap-10">
          <!-- Summary -->
          <div class="rounded-lg bg-shop-cream p-5">
            <div class="flex items-center gap-3">
              <p class="text-4xl font-bold tabular-nums text-shop-ink">{{ reviews.length ? averageRating.toFixed(1) : '—' }}</p>
              <div>
                <UiStarRating :value="averageRating" size="md" />
                <p class="mt-0.5 text-xs text-gray-500">{{ reviews.length }} {{ reviews.length === 1 ? 'review' : 'reviews' }}</p>
              </div>
            </div>
            <ul v-if="reviews.length" class="mt-4 space-y-1.5">
              <li v-for="row in ratingBars" :key="row.star" class="flex items-center gap-2 text-xs text-gray-500">
                <span class="w-3 tabular-nums">{{ row.star }}</span>
                <Icon name="heroicons:star-solid" class="h-3 w-3 text-amber-400" />
                <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                  <span class="block h-full rounded-full bg-amber-400" :style="{ width: `${row.share}%` }" />
                </span>
                <span class="w-5 text-right tabular-nums">{{ row.count }}</span>
              </li>
            </ul>
          </div>

          <div class="space-y-6">
            <p v-if="loadingReviews" class="py-8 text-center text-sm text-gray-400">Loading reviews…</p>
            <p v-else-if="!reviews.length" class="rounded-lg border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
              No reviews yet. Be the first to share how it was.
            </p>
            <ul v-else class="divide-y divide-gray-100">
              <li v-for="rev in visibleReviews" :key="rev.id" class="py-4 first:pt-0">
                <div class="flex items-start gap-3">
                  <AccountAvatar :name="rev.users?.full_name" fallback="B" class="h-9 w-9 rounded-full bg-shop-mint text-sm text-farm-deep" />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-baseline justify-between gap-3">
                      <p class="truncate text-sm font-medium text-shop-ink">{{ rev.users?.full_name ?? 'Buyer' }}</p>
                      <span v-if="rev.created_at" class="flex-shrink-0 text-xs text-gray-400">{{ formatDate(rev.created_at) }}</span>
                    </div>
                    <UiStarRating :value="rev.rating" />
                    <p v-if="rev.comment" class="mt-2 text-sm leading-relaxed text-gray-600">{{ rev.comment }}</p>
                    <div v-if="rev.seller_reply" class="mt-3 rounded bg-shop-mint px-3 py-2.5">
                      <p class="text-xs font-semibold text-farm-deep">Reply from {{ shopName }}</p>
                      <p class="mt-0.5 text-sm text-gray-600">{{ rev.seller_reply }}</p>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
            <button
              v-if="reviews.length > visibleReviews.length"
              type="button"
              class="text-sm font-semibold text-farm-leaf hover:text-farm-deep"
              @click="showAllReviews = true"
            >
              Show all {{ reviews.length }} reviews
            </button>

            <!-- Write a review -->
            <div v-if="isBuyer" class="rounded-lg border border-gray-100 p-4 md:p-5">
              <h3 class="text-base font-semibold text-shop-ink">Write a review</h3>
              <div class="mt-2 flex gap-1" role="radiogroup" aria-label="Your rating">
                <button
                  v-for="i in 5"
                  :key="i"
                  type="button"
                  class="flex h-10 w-10 items-center justify-center"
                  role="radio"
                  :aria-checked="newReview.rating === i"
                  :aria-label="`${i} ${i === 1 ? 'star' : 'stars'}`"
                  @click="newReview.rating = i"
                >
                  <Icon name="heroicons:star-solid" class="h-7 w-7" :class="i <= newReview.rating ? 'text-amber-400' : 'text-gray-200'" />
                </button>
              </div>
              <textarea
                v-model="newReview.comment"
                rows="3"
                placeholder="How was the quality and freshness?"
                aria-label="Your review"
                class="mt-2 w-full resize-none rounded border border-gray-200 px-3 py-2.5 text-sm text-shop-ink outline-none placeholder:text-gray-400 focus:border-farm-leaf"
              />
              <button
                type="button"
                class="mt-3 inline-flex min-h-[40px] w-full items-center justify-center rounded bg-farm-leaf px-5 text-sm font-semibold text-white hover:bg-farm-deep disabled:opacity-50 sm:w-auto"
                :disabled="submittingReview || !newReview.comment.trim()"
                @click="submitReview"
              >
                {{ submittingReview ? 'Posting…' : 'Post review' }}
              </button>
            </div>
            <p v-else-if="!user" class="text-sm text-gray-500">
              <NuxtLink to="/auth/login" class="font-semibold text-farm-leaf hover:text-farm-deep">Sign in</NuxtLink>
              to write a review.
            </p>
          </div>
        </div>
      </section>

      <!-- More from this shop -->
      <section v-if="moreFromShop.length" class="mt-12 md:mt-16">
        <StorefrontSectionHeading label="Same seller" :title="`More from ${shopName}`" align="left">
          <NuxtLink :to="`/buyer/shop/${sellerShopId}`" class="text-sm font-semibold text-farm-leaf hover:text-farm-deep">View shop</NuxtLink>
        </StorefrontSectionHeading>
        <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <BuyerProductCard
            v-for="item in moreFromShop"
            :key="item.id"
            :product="item"
            @add-to-cart="addOtherToCart"
            @buy-now="buyOther"
          />
        </div>
      </section>
    </template>

    <!-- Phones: quantity + buttons, above the tab bar -->
    <div v-if="product && !soldOut" class="buy-bar lg:hidden">
      <div class="mx-auto flex max-w-page items-center gap-2 px-4 py-2.5">
        <div class="qty">
          <button type="button" class="qty-btn" aria-label="Decrease quantity" :disabled="qty <= 1" @click="qty = Math.max(1, qty - 1)">
            <Icon name="heroicons:minus" class="h-4 w-4" />
          </button>
          <span class="qty-value">{{ qty }}</span>
          <button type="button" class="qty-btn" aria-label="Increase quantity" :disabled="qty >= product.stock" @click="qty = Math.min(product.stock, qty + 1)">
            <Icon name="heroicons:plus" class="h-4 w-4" />
          </button>
        </div>
        <button type="button" class="btn-cart w-12 flex-shrink-0 px-0 sm:w-auto sm:flex-1 sm:px-4" :disabled="busy" aria-label="Add to cart" @click="addToCart">
          <Icon name="heroicons:shopping-cart" class="h-5 w-5" />
          <span class="hidden sm:inline">Add to cart</span>
        </button>
        <button type="button" class="btn-buy flex-1" :disabled="busy" @click="buyNowCheckout">
          Buy now · {{ formatPeso(Number(product.price) * qty) }}
        </button>
      </div>
    </div>

    <BuyerToast :show="toast.show" :message="toast.message" :type="toast.type" @close="toast.show = false" />
  </div>
</template>

<script setup lang="ts">
import type { BuyerProduct } from '~/components/buyer/ProductCard.vue'

definePageMeta({ layout: 'buyer' })

interface ProductDetail {
  id: string
  name: string
  description?: string | null
  price: string | number
  stock: number
  category: string
  image_url?: string | null
  unit_type?: string | null
  seller_id?: string
  users?: { id: string; full_name?: string; shop_name?: string | null; shop_avatar_url?: string | null }
}

interface ReviewItem {
  id: string
  rating: number
  comment: string | null
  seller_reply?: string | null
  created_at?: string
  users?: { full_name?: string }
}

const route = useRoute()
const api = useApiFetch()
const { user } = useAuth()
const { buyNow } = useProductActions()

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
const shopName = computed(() => product.value?.users?.shop_name || product.value?.users?.full_name || 'Local seller')
const unit = computed(() => product.value?.unit_type || 'pc')
const soldOut = computed(() => Number(product.value?.stock ?? 0) <= 0)
const lowStock = computed(() => !soldOut.value && Number(product.value?.stock ?? 0) <= 5)
const isBuyer = computed(() => user.value?.role === 'buyer')

const promises = [
  { icon: 'heroicons:truck', label: 'Local delivery', caption: 'Fee based on distance' },
  { icon: 'heroicons:banknotes', label: 'Cash on delivery', caption: 'Pay when it arrives' },
  { icon: 'heroicons:chat-bubble-left-right', label: 'Chat with rider', caption: 'Message your rider live' },
]

watchEffect(() => {
  const name = product.value?.name
  if (name) setSubPageTitle?.(name)
})

const qty = ref(1)
const busy = ref(false)

// Reviews
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
const showAllReviews = ref(false)
const visibleReviews = computed(() => (showAllReviews.value ? reviews.value : reviews.value.slice(0, 4)))

const averageRating = computed(() => {
  const list = reviews.value
  if (list.length === 0) return 0
  return list.reduce((acc, rev) => acc + rev.rating, 0) / list.length
})

const ratingBars = computed(() => {
  const total = reviews.value.length || 1
  return [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.value.filter(r => r.rating === star).length
    return { star, count, share: Math.round((count / total) * 100) }
  })
})

// More from the same shop (the product list has no seller filter, so filter here)
const { data: shopProducts } = await useAsyncData(
  () => `buyer:product-more-${productId.value}`,
  async () => {
    if (!sellerShopId.value) return { products: [] as BuyerProduct[] }
    return api<{ products: BuyerProduct[] }>('/api/products')
  },
  { watch: [sellerShopId], server: false },
)

const moreFromShop = computed(() =>
  (shopProducts.value?.products ?? [])
    .filter(p => p.users?.id === sellerShopId.value && p.id !== product.value?.id)
    .slice(0, 4),
)

const submittingReview = ref(false)
const newReview = ref({ rating: 5, comment: '' })

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 4000)
}

function errorMessage(err: unknown, fallback: string) {
  return (err as { data?: { statusMessage?: string } }).data?.statusMessage || fallback
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function addToCart() {
  const p = product.value
  if (!p || soldOut.value) return
  busy.value = true
  try {
    await api('/api/cart/add', {
      method: 'POST',
      body: { product_id: p.id, quantity: qty.value },
    })
    triggerToast(`Added ${qty.value} ${unit.value} to your cart.`)
    refreshCartCount?.()
  }
  catch (err: unknown) {
    triggerToast(errorMessage(err, 'Failed to add to cart'), 'error')
  }
  finally {
    busy.value = false
  }
}

async function buyNowCheckout() {
  const p = product.value
  if (!p || soldOut.value) return
  busy.value = true
  try {
    await buyNow(p.id, qty.value)
  }
  catch (err: unknown) {
    triggerToast(errorMessage(err, 'Failed to start checkout'), 'error')
  }
  finally {
    busy.value = false
  }
}

async function addOtherToCart(item: BuyerProduct) {
  try {
    await api('/api/cart/add', { method: 'POST', body: { product_id: item.id, quantity: 1 } })
    triggerToast(`${item.name} added to your cart.`)
    refreshCartCount?.()
  }
  catch (err: unknown) {
    triggerToast(errorMessage(err, 'Failed to add to cart'), 'error')
  }
}

async function buyOther(item: BuyerProduct) {
  try {
    await buyNow(item.id, 1)
  }
  catch (err: unknown) {
    triggerToast(errorMessage(err, 'Failed to start checkout'), 'error')
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
    triggerToast('Thanks! Your review is posted.')
    newReview.value = { rating: 5, comment: '' }
    await refreshReviews()
  }
  catch (err: unknown) {
    triggerToast(errorMessage(err, 'Could not submit review'), 'error')
  }
  finally {
    submittingReview.value = false
  }
}

watch(productId, () => {
  qty.value = 1
  showAllReviews.value = false
  refreshProduct()
})

useHead({ title: computed(() => (product.value ? `${product.value.name} — NFWM` : 'Product — NFWM')) })
</script>

<style scoped>
.qty {
  @apply inline-flex flex-shrink-0 items-center rounded border border-gray-200;
}
.qty-btn {
  @apply flex h-11 w-10 items-center justify-center text-gray-600 transition-colors hover:text-farm-leaf disabled:text-gray-300;
}
.qty-value {
  @apply w-8 text-center text-sm font-semibold tabular-nums text-shop-ink;
}
.btn-cart {
  @apply inline-flex min-h-[44px] items-center justify-center gap-2 rounded border border-farm-leaf bg-white px-4 text-sm font-semibold text-farm-leaf transition-colors hover:bg-farm-leaf hover:text-white disabled:opacity-50;
}
.btn-buy {
  @apply inline-flex min-h-[44px] items-center justify-center gap-2 rounded bg-market-orange px-4 text-sm font-semibold text-white transition-colors hover:bg-[#cf6d17] disabled:opacity-50;
}

/* Sits right above the buyer tab bar on phones */
.buy-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(60px + env(safe-area-inset-bottom, 0px));
  z-index: 40;
  background: #ffffff;
  border-top: 1px solid #f3f4f6;
}
@media (min-width: 768px) {
  /* The tab bar is hidden from md up */
  .buy-bar {
    bottom: 0;
  }
}
</style>
