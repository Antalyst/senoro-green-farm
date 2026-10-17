<template>
  <div class="pb-8">
    <!-- ============ SEARCH RESULTS (header search) ============ -->
    <section v-if="isSearching" class="py-8 md:py-10">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs text-gray-400">Search results</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight text-shop-ink">
            “{{ searchParam }}”
            <span class="text-base font-normal text-gray-400">· {{ searchResults.length }} {{ searchResults.length === 1 ? 'item' : 'items' }}</span>
          </h1>
        </div>
        <button type="button" class="btn-outline" @click="clearSearch">
          <Icon name="heroicons:x-mark" class="h-4 w-4" />
          Clear search
        </button>
      </div>

      <div v-if="matchingShops.length" class="mt-6 flex flex-wrap gap-2">
        <NuxtLink
          v-for="shop in matchingShops"
          :key="shop.id"
          :to="`/buyer/shop/${shop.id}`"
          class="inline-flex items-center gap-2 rounded-full bg-shop-mint px-3 py-1.5 text-sm text-shop-ink hover:bg-farm-light"
        >
          <Icon name="heroicons:building-storefront" class="h-4 w-4 text-farm-leaf" />
          {{ shop.shop_name }}
        </NuxtLink>
      </div>

      <div v-if="dataLoading" class="product-grid mt-8">
        <div v-for="n in 8" :key="n" class="skeleton-card" />
      </div>
      <div v-else-if="searchResults.length" class="product-grid mt-8 lg:grid-cols-4">
        <BuyerProductCard
          v-for="product in searchResults"
          :key="product.id"
          :product="product"
          @add-to-cart="handleAddToCart"
          @buy-now="handleBuyNow"
        />
      </div>
      <div v-else class="empty-box mt-8">
        <Icon name="heroicons:magnifying-glass" class="h-8 w-8 text-gray-300" />
        <p class="mt-3 text-sm font-medium text-shop-ink">No products match “{{ searchParam }}”</p>
        <p class="mt-1 text-xs text-gray-500">Try another word, like “vegetables” or a shop name.</p>
      </div>
    </section>

    <template v-else>
      <!-- ============ HERO ============ -->
      <StorefrontHeroSlider :slides="heroSlides" @cta="scrollToSection" />

      <!-- ============ CATEGORIES ============ -->
      <section v-if="categoryTiles.length" id="categories" class="section">
        <StorefrontSectionHeading label="01. Find your favourite" title="Shop By Categories" />
        <StorefrontCategoryCarousel
          class="mt-8"
          :categories="categoryTiles"
          :active="activeCategory"
          @select="selectCategory"
        />
      </section>

      <!-- ============ SERVICE STRIP ============ -->
      <section class="border-y border-gray-100 py-10">
        <StorefrontServiceStrip />
      </section>

      <!-- ============ LOCAL SHOPS ============ -->
      <section v-if="promoTiles.length" id="shops" class="section">
        <StorefrontSectionHeading label="02. Meet the farmers" title="From Our Local Shops" />
        <StorefrontPromoGrid class="mt-8" :tiles="promoTiles" />

        <div v-if="moreShops.length" class="mt-10">
          <p class="text-sm font-semibold text-shop-ink">More local shops</p>
          <div class="no-scrollbar mt-4 flex snap-x gap-4 overflow-x-auto pb-2">
            <StorefrontShopCard
              v-for="shop in moreShops"
              :key="shop.id"
              :shop="shop"
              class="w-60 flex-shrink-0 snap-start"
            />
          </div>
        </div>
      </section>

      <!-- ============ BEST SELLERS + PRODUCTS ============ -->
      <section id="products" class="section">
        <div class="grid gap-8" :class="bestSellers.length ? 'lg:grid-cols-[280px_1fr]' : ''">
          <StorefrontBestSellerList
            v-if="bestSellers.length"
            :products="bestSellers"
            :caption="hasSales ? 'Most ordered by buyers' : 'New arrivals this week'"
            class="order-2 self-start lg:order-1"
            @add-to-cart="handleAddToCart"
          />

          <div class="order-1 min-w-0 lg:order-2">
            <StorefrontSectionHeading
              align="left"
              label="03. Fresh picks"
              :title="activeCategory ? activeCategory : 'Fresh Products'"
              :caption="activeCategory ? `${visibleProducts.length} products in this category` : 'Newest from local farms and stalls'"
            >
              <button
                v-if="!showAll && categoryFiltered.length > PAGE_SIZE"
                type="button"
                class="btn-primary self-start sm:self-auto"
                @click="showAll = true"
              >
                View all
              </button>
            </StorefrontSectionHeading>

            <!-- Category filter chips -->
            <div v-if="categoryTiles.length > 1" class="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                class="chip"
                :class="!activeCategory ? 'chip--active' : ''"
                @click="activeCategory = null"
              >
                All
              </button>
              <button
                v-for="cat in categoryTiles"
                :key="cat.name"
                type="button"
                class="chip"
                :class="activeCategory === cat.name ? 'chip--active' : ''"
                @click="activeCategory = cat.name"
              >
                {{ cat.name }}
              </button>
            </div>

            <div v-if="dataLoading" class="product-grid mt-6">
              <div v-for="n in 6" :key="n" class="skeleton-card" />
            </div>

            <div v-else-if="loadError" class="empty-box mt-6">
              <p class="text-sm font-medium text-shop-ink">{{ loadError }}</p>
              <button type="button" class="btn-outline mt-4" @click="loadAll">Try again</button>
            </div>

            <div v-else-if="!visibleProducts.length" class="empty-box mt-6">
              <Icon name="heroicons:shopping-bag" class="h-8 w-8 text-gray-300" />
              <p class="mt-3 text-sm font-medium text-shop-ink">No products yet</p>
              <p class="mt-1 text-xs text-gray-500">Local shops are getting ready. Check back soon.</p>
            </div>

            <template v-else>
              <div class="product-grid mt-6" :class="bestSellers.length ? '' : 'lg:grid-cols-4'">
                <BuyerProductCard
                  v-for="product in visibleProducts"
                  :key="product.id"
                  :product="product"
                  @add-to-cart="handleAddToCart"
                  @buy-now="handleBuyNow"
                />
              </div>
              <div v-if="!showAll && categoryFiltered.length > PAGE_SIZE" class="mt-8 text-center">
                <button type="button" class="btn-outline" @click="showAll = true">
                  Show all {{ categoryFiltered.length }} products
                </button>
              </div>
            </template>
          </div>
        </div>
      </section>

      <!-- ============ TESTIMONIAL (real review only) ============ -->
      <section v-if="featuredReview" class="section">
        <StorefrontSectionHeading label="04. Reviews" title="Loved By Buyers" />
        <StorefrontReviewSpotlight class="mt-8" :review="featuredReview" />
      </section>
    </template>
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
import type { HeroSlide } from '~/components/storefront/HeroSlider.vue'
import type { CategoryTile } from '~/components/storefront/CategoryCarousel.vue'
import type { PromoTileData } from '~/components/storefront/PromoTile.vue'
import type { ShopSummary } from '~/components/storefront/ShopCard.vue'
import type { FeaturedReview } from '~/components/storefront/ReviewSpotlight.vue'

definePageMeta({ layout: 'buyer' })

const PAGE_SIZE = 9

const router = useRouter()
const route = useRoute()
const api = useApiFetch()

const products = ref<BuyerProduct[]>([])
const bestSellers = ref<(BuyerProduct & { units_sold?: number })[]>([])
const featuredReview = ref<FeaturedReview | null>(null)
const dataLoading = ref(true)
const loadError = ref('')
const activeCategory = ref<string | null>(null)
const showAll = ref(false)

const heroSlides: HeroSlide[] = [
  {
    kicker: 'Negros Farmers Weekend Market',
    title: 'Fresh from the farm, straight to your table',
    text: 'Buy vegetables, fruits and local food from Negros farmers. Delivered in Bacolod City and nearby.',
    image: '/images/campaign/fresh-produce-basket.png',
    imageAlt: 'Basket of fresh vegetables',
    ctaLabel: 'Go To Shop',
    ctaTarget: 'products',
  },
  {
    kicker: 'Local favourites',
    title: 'Street food from your favourite market stalls',
    text: 'Order inasal, kakanin and other local food from vendors in Bacolod City.',
    image: '/images/campaign/street-food-hero.png',
    imageAlt: 'Grilled local street food',
    ctaLabel: 'Browse categories',
    ctaTarget: 'categories',
  },
  {
    kicker: 'Support local',
    title: 'Every order helps a Negros farmer',
    text: 'Our shops are run by local farmers and vendors. Meet them and see what they grow.',
    image: MARKET_IMAGE,
    imageAlt: 'Fresh produce at a local market',
    ctaLabel: 'Meet the farmers',
    ctaTarget: 'shops',
  },
]

// ---------- Derived data (all from /api/products) ----------

const hasSales = computed(() => bestSellers.value.some(p => (p.units_sold ?? 0) > 0))

// Categories are per seller, so merge by name (case-insensitive) across shops.
const categoryTiles = computed<CategoryTile[]>(() => {
  const map = new Map<string, CategoryTile>()
  for (const p of products.value) {
    const name = (p.category || 'Uncategorized').trim()
    const key = name.toLowerCase()
    const tile = map.get(key)
    if (tile) {
      tile.count += 1
      if (tile.image === fallbackProductImage(name) && p.image_url) tile.image = p.image_url
    }
    else {
      map.set(key, { name, count: 1, image: p.image_url || fallbackProductImage(name) })
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
})

const shops = computed<ShopSummary[]>(() => {
  const map = new Map<string, ShopSummary & { _cats: Set<string> }>()
  for (const p of products.value) {
    const seller = p.users
    if (!seller?.id) continue
    const shop = map.get(seller.id)
    if (shop) {
      shop.product_count += 1
      shop._cats.add(p.category)
      if (!seller.shop_banner_url && p.image_url && shop.banner === fallbackProductImage(p.category)) shop.banner = p.image_url
      continue
    }
    map.set(seller.id, {
      id: seller.id,
      shop_name: seller.shop_name || seller.full_name || 'Local shop',
      banner: seller.shop_banner_url || p.image_url || fallbackProductImage(p.category),
      avatar: seller.shop_avatar_url,
      product_count: 1,
      categories: [],
      _cats: new Set([p.category]),
    })
  }
  return [...map.values()]
    .map(({ _cats, ...shop }) => ({ ...shop, categories: [..._cats].filter(Boolean) }))
    .sort((a, b) => b.product_count - a.product_count)
})

const promoTiles = computed<PromoTileData[]>(() =>
  shops.value.slice(0, 3).map(shop => ({
    label: 'Featured shop',
    title: shop.shop_name,
    caption: `${shop.product_count} ${shop.product_count === 1 ? 'product' : 'products'}${shop.categories.length ? ` · ${shop.categories.slice(0, 2).join(', ')}` : ''}`,
    image: shop.banner,
    to: `/buyer/shop/${shop.id}`,
  })),
)

const moreShops = computed(() => shops.value.slice(3))

const categoryFiltered = computed(() => {
  if (!activeCategory.value) return products.value
  const key = activeCategory.value.toLowerCase()
  return products.value.filter(p => (p.category || '').trim().toLowerCase() === key)
})

const visibleProducts = computed(() =>
  showAll.value ? categoryFiltered.value : categoryFiltered.value.slice(0, PAGE_SIZE),
)

// ---------- Search (from the header) ----------

const searchParam = computed(() => ((route.query?.search as string) || '').trim())
const isSearching = computed(() => !!searchParam.value)

const searchResults = computed(() => {
  const q = searchParam.value.toLowerCase()
  return products.value.filter(p =>
    [p.name, p.category, p.users?.shop_name, p.users?.full_name]
      .some(v => String(v ?? '').toLowerCase().includes(q)),
  )
})

const matchingShops = computed(() => {
  const q = searchParam.value.toLowerCase()
  return shops.value.filter(s => s.shop_name.toLowerCase().includes(q))
})

function clearSearch() {
  router.replace({ query: { ...route.query, search: undefined } })
}

// ---------- Navigation helpers ----------

// ion-content scrolls (not the window), so scroll the element itself.
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function selectCategory(name: string) {
  activeCategory.value = activeCategory.value === name ? null : name
  showAll.value = false
  nextTick(() => scrollToSection('products'))
}

// Links like /#shops from other pages: scroll once data is on screen, then drop the hash
// so the same link works again next time.
async function scrollToHash() {
  const id = route.hash?.slice(1)
  if (!id || dataLoading.value) return
  await nextTick()
  scrollToSection(id)
  router.replace({ query: route.query, hash: '' })
}

watch(() => route.hash, scrollToHash)
watch(dataLoading, scrollToHash)
watch(activeCategory, () => { showAll.value = false })

// ---------- Data ----------

async function loadAll() {
  dataLoading.value = true
  loadError.value = ''
  const [productsRes, bestRes, reviewRes] = await Promise.allSettled([
    api<{ products?: BuyerProduct[] }>('/api/products'),
    api<{ products?: BuyerProduct[] }>('/api/products/best-sellers', { query: { limit: 4 } }),
    api<{ review: FeaturedReview | null }>('/api/reviews/featured'),
  ])

  if (productsRes.status === 'fulfilled') {
    products.value = productsRes.value?.products ?? []
  }
  else {
    const e = productsRes.reason as { data?: { statusMessage?: string } }
    loadError.value = e?.data?.statusMessage || 'Failed to load products'
    products.value = []
  }
  // Optional sections: hide quietly when they fail.
  bestSellers.value = bestRes.status === 'fulfilled' ? (bestRes.value?.products ?? []) : []
  featuredReview.value = reviewRes.status === 'fulfilled' ? (reviewRes.value?.review ?? null) : null

  dataLoading.value = false
}

// ---------- Cart actions ----------

const { addToCart, buyNow } = useProductActions()

async function handleAddToCart(product: BuyerProduct) {
  if (!product || Number(product.stock) <= 0) return
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
  if (!product || Number(product.stock) <= 0) return
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

onMounted(loadAll)

useHead({ title: 'NFWM — Fresh from Negros farms' })
</script>

<style scoped>
.section {
  @apply scroll-mt-4 py-12 md:py-16;
}

.product-grid {
  @apply grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3;
}

.skeleton-card {
  @apply aspect-[3/4] animate-pulse rounded-md bg-gray-100;
}

.empty-box {
  @apply flex flex-col items-center rounded-lg border border-dashed border-gray-200 px-6 py-14 text-center;
}

.chip {
  @apply flex-shrink-0 rounded-full border border-gray-200 px-4 py-1.5 text-sm text-gray-600 transition hover:border-farm-leaf hover:text-farm-leaf;
}
.chip--active {
  @apply border-farm-leaf bg-farm-leaf text-white hover:text-white;
}

.btn-primary {
  @apply inline-flex items-center gap-2 rounded bg-farm-leaf px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-farm-deep;
}

.btn-outline {
  @apply inline-flex items-center gap-2 rounded border border-gray-300 px-5 py-2.5 text-sm font-medium text-shop-ink transition hover:border-farm-leaf hover:text-farm-leaf;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  scrollbar-width: none;
}
</style>
