<template>
  <!-- ============================================
       REFACTOR 1: ANIMATED "6.6 HARVEST" PRELOADER
       ============================================ -->
  <Transition name="preloader">
    <div
      v-if="showPreloader"
      class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-campaign-matte"
    >
      <!-- Spinning border ring -->
      <div class="relative flex items-center justify-center">
        <div
          class="absolute w-56 h-56 md:w-64 md:h-64 rounded-full campaign-spin-border"
          style="
            border: 3px solid transparent;
            border-top-color: #f2994a;
            border-right-color: #f5a623;
          "
        />
        <!-- Pulsing golden badge -->
        <div
          class="relative w-44 h-44 md:w-52 md:h-52 rounded-full bg-gradient-to-br from-campaign-gold via-campaign-amber to-campaign-gold flex flex-col items-center justify-center shadow-campaign-glow animate-pulse-gold"
        >
          <span class="text-6xl md:text-7xl font-black tracking-tighter text-campaign-matte leading-none">{{ campaignLabel }}</span>
          <div class="w-16 h-0.5 bg-campaign-matte/30 my-1.5 rounded-full" />
          <span class="text-[10px] md:text-xs font-extrabold tracking-[0.2em] uppercase text-campaign-matte/80">{{ campaignSubLabel1 }}</span>
          <span class="text-[10px] md:text-xs font-extrabold tracking-[0.2em] uppercase text-campaign-matte/80">{{ campaignSubLabel2 }}</span>
        </div>
      </div>

      <!-- Loading text -->
      <div class="mt-10 flex flex-col items-center gap-3">
        <p class="text-campaign-gold/80 text-sm font-semibold tracking-wide loading-dots">
          Gathering fresh local drops
        </p>
        <div class="w-48 h-1 bg-campaign-matte rounded-full overflow-hidden border border-campaign-gold/20">
          <div class="h-full bg-gradient-to-r from-campaign-gold to-campaign-amber rounded-full transition-all duration-300 ease-out" :style="{ width: preloaderProgress + '%' }" />
        </div>
      </div>
    </div>
  </Transition>

  <!-- ============================================
       REFACTOR 2: BENEFITS & VOUCHER POP-UP MODAL
       ============================================ -->
  <Transition name="modal-overlay">
    <div
      v-if="showModal"
      class="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      @click.self="dismissModal"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <!-- Modal Card -->
      <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-bounce-in">
        <!-- Header -->
        <div class="bg-campaign-gradient px-6 py-5 text-center relative overflow-hidden">
          <div class="absolute inset-0 opacity-10" style="background-image: url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23f2994a\' fill-opacity=\'0.3\'%3E%3Cpath d=\'M20 20l-5-8h10z\'/%3E%3C/g%3E%3C/svg%3E');"></div>
          <h2 class="relative text-xl md:text-2xl font-black tracking-tight text-white uppercase">
            Welcome to the Weekend Market! 🌾
          </h2>
          <p class="relative mt-1 text-campaign-gold text-xs font-bold tracking-wider uppercase">
            Exclusive {{ campaignLabel }} Launch Rewards Inside
          </p>
        </div>

        <!-- Benefits -->
        <div class="px-6 py-5 space-y-4">
          <div class="flex items-start gap-3 group">
            <span class="text-2xl flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200">🚜</span>
            <div>
              <h3 class="text-sm font-black text-farm-dark uppercase tracking-wide">100% Direct from Source</h3>
              <p class="text-xs text-farm-dark/60 mt-0.5 leading-relaxed">Zero middleman fees, directly supporting Bago City farmers.</p>
            </div>
          </div>
          <div class="flex items-start gap-3 group">
            <span class="text-2xl flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200">⚡</span>
            <div>
              <h3 class="text-sm font-black text-farm-dark uppercase tracking-wide">Fresh & Fast Delivery</h3>
              <p class="text-xs text-farm-dark/60 mt-0.5 leading-relaxed">Sizzling street food and crisp organic greens brought right to your door.</p>
            </div>
          </div>
        </div>

        <!-- Voucher Coupon Card -->
        <div class="px-6 pb-5">
          <div
            class="relative border-2 border-dashed rounded-xl p-5 text-center transition-all duration-500 coupon-border-pulse"
            :class="voucherClaimed ? 'bg-green-50 border-green-400' : 'bg-campaign-gold/5 border-campaign-gold'"
          >
            <!-- Scissor cut effect -->
            <div class="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-dashed"
              :class="voucherClaimed ? 'border-green-400' : 'border-campaign-gold'"
            />
            <div class="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-dashed"
              :class="voucherClaimed ? 'border-green-400' : 'border-campaign-gold'"
            />

            <template v-if="!voucherClaimed">
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-campaign-gold">{{ campaignLabel }} Global Voucher</p>
              <p class="text-3xl md:text-4xl font-black text-campaign-matte mt-2 tracking-tighter">₱{{ voucherAmount }} OFF</p>
              <p class="text-xs font-bold text-farm-dark/60 mt-1 uppercase tracking-wider">Your First Order</p>
              <button
                type="button"
                class="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-campaign-gold to-campaign-amber text-white font-black text-sm uppercase tracking-[0.1em] cta-pulse hover:brightness-110 transition-all duration-300 active:scale-95"
                @click="handleClaimVoucher"
              >
                🎁 Claim Voucher Now
              </button>
            </template>
            <template v-else>
              <div class="py-3 animate-bounce-in">
                <span class="text-4xl">🎉</span>
                <p class="text-xl font-black text-green-700 mt-2 uppercase tracking-tight">Voucher Claimed!</p>
                <p class="text-xs text-green-600/70 mt-1 font-semibold">₱{{ voucherAmount }} off has been applied to your account</p>
              </div>
            </template>
          </div>
        </div>

        <!-- Dismiss -->
        <div class="px-6 pb-5">
          <button
            type="button"
            class="w-full py-2.5 text-xs font-bold text-farm-dark/40 uppercase tracking-[0.15em] hover:text-farm-dark/70 transition-colors duration-300"
            @click="dismissModal"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- ============================================
       MAIN PAGE CONTENT
       ============================================ -->
  <div class="space-y-8 py-5 md:py-8">

    <!-- ============================================
         REFACTOR 3: SHOPEE-STYLE HERO SECTION
         ============================================ -->
    <header class="relative overflow-hidden rounded-2xl bg-campaign-matte">
      <!-- Background pattern overlay -->
      <div class="absolute inset-0 opacity-5">
        <div class="absolute inset-0" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(242,153,74,0.1) 20px, rgba(242,153,74,0.1) 22px);" />
      </div>

      <!-- Hero Split Grid -->
      <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-0">

        <!-- LEFT: Text & Urgency -->
        <div class="p-6 md:p-10 lg:p-12 flex flex-col justify-center relative z-10">
          <!-- Urgency tag -->
          <div class="inline-flex items-center gap-2 bg-campaign-flame/20 border border-campaign-flame/40 rounded-full px-4 py-1.5 mb-5 self-start">
            <span class="w-2 h-2 rounded-full bg-campaign-flame animate-pulse" />
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-campaign-flame">Live Now</span>
          </div>

          <!-- Main headline -->
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white leading-[0.9]">
            {{ campaignLabel }} Flash
            <span class="block shimmer-text">Harvest</span>
            <span class="block text-white">is Live!</span>
          </h1>

          <p class="mt-4 text-sm md:text-base text-white/60 font-medium max-w-md leading-relaxed">
            Massive deals on farm-fresh produce & street food — direct from Negros farmers to your doorstep.
          </p>

          <!-- Countdown Timer -->
          <div class="mt-6 md:mt-8">
            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-campaign-gold/70 mb-3">Flash Sale Ends In</p>
            <div class="flex items-center gap-2 md:gap-3">
              <div class="bg-black/80 rounded-lg px-3 py-2.5 md:px-4 md:py-3 text-center min-w-[52px] md:min-w-[64px] border border-white/10">
                <span class="text-xl md:text-3xl font-black text-white tabular-nums block leading-none">{{ countdown.hours }}</span>
                <span class="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mt-1 block">Hours</span>
              </div>
              <span class="text-xl md:text-2xl font-black text-campaign-gold/60">:</span>
              <div class="bg-black/80 rounded-lg px-3 py-2.5 md:px-4 md:py-3 text-center min-w-[52px] md:min-w-[64px] border border-white/10">
                <span class="text-xl md:text-3xl font-black text-white tabular-nums block leading-none">{{ countdown.minutes }}</span>
                <span class="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mt-1 block">Mins</span>
              </div>
              <span class="text-xl md:text-2xl font-black text-campaign-gold/60">:</span>
              <div class="bg-black/80 rounded-lg px-3 py-2.5 md:px-4 md:py-3 text-center min-w-[52px] md:min-w-[64px] border border-white/10 relative overflow-hidden">
                <span class="text-xl md:text-3xl font-black text-campaign-gold tabular-nums block leading-none animate-countdown-tick">{{ countdown.seconds }}</span>
                <span class="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mt-1 block">Secs</span>
              </div>
            </div>
          </div>

          <!-- Search form within hero -->
         
        </div>

        <!-- RIGHT: Rich Media Collage -->
        <div class="relative min-h-[300px] md:min-h-[420px] lg:min-h-0 overflow-hidden">
          <!-- Street food image (front, overlapping) -->
          <div class="absolute top-4 left-4 md:top-8 md:left-8 w-[55%] md:w-[60%] aspect-[4/3] rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-20 transition-transform duration-500 hover:scale-105 hover:rotate-1">
            <img
              src="/images/campaign/street-food-hero.png"
              alt="Sizzling local street food"
              class="w-full h-full object-cover"
            >
            <!-- Discount badge -->
            <div class="absolute -top-1 -right-1 bg-campaign-flame text-white text-[10px] font-black px-3 py-1.5 badge-tilt shadow-lg rounded-bl-lg uppercase tracking-wider z-30">
              50% OFF
            </div>
          </div>

          <!-- Fresh produce basket (behind, offset) -->
          <div class="absolute bottom-4 right-4 md:bottom-8 md:right-8 w-[55%] md:w-[60%] aspect-[4/3] rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-10 transition-transform duration-500 hover:scale-105 hover:-rotate-1">
            <img
              src="/images/campaign/fresh-produce-basket.png"
              alt="Fresh pumpkins and leafy greens"
              class="w-full h-full object-cover"
            >
            <!-- UP TO badge flag -->
            <div class="absolute top-3 left-0 bg-campaign-gold text-campaign-matte text-[10px] font-black px-3 py-1.5 shadow-lg uppercase tracking-wider rounded-r-md">
              Up to 50% Off
            </div>
          </div>

          <!-- Decorative floating elements -->
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-24 md:h-24 rounded-full bg-campaign-gold/10 border border-campaign-gold/20 flex items-center justify-center z-5">
            <span class="text-3xl md:text-4xl">🌾</span>
          </div>
        </div>
      </div>

      <!-- FLASH SALE STRIP — beneath hero content -->
      <div class="relative bg-black/40 border-t border-white/10">
        <div class="flex items-center gap-2 px-4 py-2">
          <span class="flex-shrink-0 bg-campaign-flame text-white text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-wider animate-pulse">
            🔥 Flash Sale
          </span>
          <div class="flex-1 overflow-hidden">
            <div class="flex gap-4 overflow-x-auto scrollbar-none py-2 snap-x snap-mandatory">
              <div
                v-for="(deal, idx) in flashDeals"
                :key="idx"
                class="flex-shrink-0 snap-start flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-white/10 hover:bg-white/20 transition-all duration-300 cursor-pointer min-w-[220px] md:min-w-[260px] group"
              >
                <div class="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-white/10 flex items-center justify-center text-xl md:text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  {{ deal.emoji }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[11px] font-bold text-white truncate">{{ deal.name }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-black text-campaign-gold">₱{{ deal.salePrice }}</span>
                    <span class="text-[10px] text-white/30 line-through">₱{{ deal.originalPrice }}</span>
                  </div>
                  <!-- Progress bar -->
                  <div class="mt-1.5 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full progress-animate transition-all"
                      :class="deal.soldPercent > 80 ? 'bg-campaign-flame' : 'bg-campaign-gold'"
                      :style="{ width: deal.soldPercent + '%' }"
                    />
                  </div>
                  <p class="text-[9px] font-bold mt-0.5" :class="deal.soldPercent > 80 ? 'text-campaign-flame/80' : 'text-white/40'">
                    {{ deal.soldPercent > 80 ? '🔥' : '' }} {{ deal.soldPercent }}% Sold · {{ deal.stockLeft }} left
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Market Stats -->
    <section class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div
        v-for="stat in marketStats"
        :key="stat.label"
        class="border border-farm-light bg-white p-4 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg rounded-xl"
      >
        <p class="text-2xl font-extrabold text-farm-dark">{{ stat.value }}</p>
        <p class="mt-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-farm-dark/45">{{ stat.label }}</p>
      </div>
    </section>

    <!-- Explore Local Shops -->
    <section id="stores" class="border-t border-farm-light pt-8">
      <div class="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight text-farm-dark">Explore Local Shops</h2>
        </div>
        <span v-if="!dataLoading" class="text-sm font-semibold text-farm-dark/50">{{ filteredStores.length }} sellers</span>
      </div>

      <div v-if="dataLoading" class="flex justify-center py-10">
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

      <div v-else class="text-center py-16 bg-white rounded-xl border border-farm-light shadow-sm">
        <p class="text-farm-dark/50 text-lg font-semibold">No shops available at the moment.</p>
      </div>
    </section>

    <!-- Fresh Products -->
    <section class="border-t border-farm-light pt-8">
      <div class="mb-5 flex items-end justify-between gap-4">
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-farm-dark/45">Marketplace picks</p>
          <h2 class="mt-1 text-2xl font-extrabold tracking-tight text-farm-dark">Fresh Products</h2>
        </div>
        <span v-if="!dataLoading" class="text-xs font-extrabold text-farm-dark/45">{{ filteredProducts.length }} items</span>
      </div>

      <div v-if="dataLoading" class="py-20 text-center">
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
const { isLoggedIn } = useAuth()

const searchInput = ref((route.query?.search as string) || '')
const products = ref<BuyerProduct[]>([])
const dataLoading = ref(true)
const loadError = ref('')

// ==========================================
// DYNAMIC MONTH-BASED CAMPAIGN CONFIG
// ==========================================
const currentMonth = ref(new Date().getMonth() + 1)
const campaignLabel = computed(() => `${currentMonth.value}.${currentMonth.value}`)

const campaignSubLabel1 = computed(() => {
  if (currentMonth.value === 6) return 'Mid-Year'
  if (currentMonth.value === 12) return 'Year-End'
  return getMonthName(currentMonth.value)
})
const campaignSubLabel2 = computed(() => 'Harvest Sale')

function getMonthName(monthNum: number) {
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return names[monthNum - 1] || 'Monthly'
}

const voucherAmount = computed(() => {
  const m = currentMonth.value
  if (m === 10) return 100
  if (m === 11) return 111
  if (m === 12) return 120
  return m * 11
})

// ==========================================
// PRELOADER STATE
// ==========================================
const showPreloader = ref(true)
const preloaderProgress = ref(0)

// ==========================================
// MODAL STATE
// ==========================================
const showModal = ref(false)
const voucherClaimed = ref(false)

// ==========================================
// COUNTDOWN STATE
// ==========================================
const countdown = reactive({ hours: '00', minutes: '00', seconds: '00' })
let countdownInterval: ReturnType<typeof setInterval> | null = null

// ==========================================
// FLASH DEALS DATA
// ==========================================
const flashDeals = ref([
  { emoji: '🥬', name: 'Organic Kangkong Bundle', salePrice: '35', originalPrice: '65', soldPercent: 84, stockLeft: 12 },
  { emoji: '🍗', name: 'Grilled Chicken Inasal (4pc)', salePrice: '149', originalPrice: '280', soldPercent: 92, stockLeft: 5 },
  { emoji: '🎃', name: 'Farm-Fresh Kalabasa (2kg)', salePrice: '45', originalPrice: '85', soldPercent: 67, stockLeft: 28 },
  { emoji: '🌽', name: 'Sweet Corn on the Cob (6pc)', salePrice: '55', originalPrice: '100', soldPercent: 78, stockLeft: 18 },
  { emoji: '🍌', name: 'Banana Cue Street Pack', salePrice: '25', originalPrice: '50', soldPercent: 95, stockLeft: 3 },
  { emoji: '🥚', name: 'Free-Range Eggs (Dozen)', salePrice: '89', originalPrice: '150', soldPercent: 71, stockLeft: 22 },
  { emoji: '🌶️', name: 'Hot Siling Labuyo Pack', salePrice: '30', originalPrice: '55', soldPercent: 58, stockLeft: 35 },
  { emoji: '🥭', name: 'Guimaras Mangoes (1kg)', salePrice: '120', originalPrice: '220', soldPercent: 88, stockLeft: 8 },
])

const heroImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80'

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

function formatPrice(price: string | number) {
  return parseFloat(String(price ?? 0)).toFixed(2)
}

// ==========================================
// COUNTDOWN LOGIC
// ==========================================
function startCountdown() {
  function updateCountdown() {
    const now = new Date()
    // Sale ends at midnight tonight (or tomorrow if past midnight)
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const diff = endOfDay.getTime() - now.getTime()
    if (diff <= 0) {
      countdown.hours = '00'
      countdown.minutes = '00'
      countdown.seconds = '00'
      return
    }

    const h = Math.floor(diff / (1000 * 60 * 60))
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const s = Math.floor((diff % (1000 * 60)) / 1000)

    countdown.hours = String(h).padStart(2, '0')
    countdown.minutes = String(m).padStart(2, '0')
    countdown.seconds = String(s).padStart(2, '0')
  }

  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 1000)
}

// ==========================================
// PRELOADER LOGIC
// ==========================================
function runPreloader() {
  const duration = 1800 // 1.8 seconds
  const steps = 30
  const stepDuration = duration / steps
  let step = 0

  const interval = setInterval(() => {
    step++
    // Ease-out progress curve
    preloaderProgress.value = Math.round(100 * (1 - Math.pow(1 - step / steps, 3)))
    if (step >= steps) {
      clearInterval(interval)
      preloaderProgress.value = 100
      setTimeout(() => {
        showPreloader.value = false
        // Trigger modal 1 second after preloader finishes
        setTimeout(() => {
          showModal.value = true
        }, 1000)
      }, 200)
    }
  }, stepDuration)
}

// ==========================================
// MODAL LOGIC
// ==========================================
function handleClaimVoucher() {
  if (!isLoggedIn.value) {
    // Save intent and redirect to login
    if (import.meta.client) {
      localStorage.setItem('sgf_voucher_intent', `${campaignLabel.value}_off_first_order`)
    }
    router.push({ path: '/auth/login', query: { redirect: '/', voucher: String(voucherAmount.value) } })
    return
  }

  // User is logged in — claim the voucher
  voucherClaimed.value = true
  if (import.meta.client) {
    localStorage.setItem(`sgf_${campaignLabel.value}_voucher_claimed`, 'true')
  }
}

function dismissModal() {
  showModal.value = false
}

// ==========================================
// PRODUCT FETCH
// ==========================================
async function fetchProducts() {
  dataLoading.value = true
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
    dataLoading.value = false
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

// ==========================================
// LIFECYCLE
// ==========================================
onMounted(() => {
  fetchProducts()
  runPreloader()
  startCountdown()

  // Check if returning from login with voucher intent
  if (import.meta.client) {
    const voucherIntent = localStorage.getItem('sgf_voucher_intent')
    const alreadyClaimed = localStorage.getItem(`sgf_${campaignLabel.value}_voucher_claimed`)
    if (voucherIntent && isLoggedIn.value && !alreadyClaimed) {
      localStorage.removeItem('sgf_voucher_intent')
      voucherClaimed.value = true
      localStorage.setItem(`sgf_${campaignLabel.value}_voucher_claimed`, 'true')
    }
    if (alreadyClaimed) {
      voucherClaimed.value = true
    }
  }
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})

watch(searchParam, value => {
  searchInput.value = value
})

useHead({ title: `${campaignLabel.value} ${campaignSubLabel1.value} Harvest Sale — Senoro Green Farm` })
</script>

<style scoped>
/* Preloader transition */
.preloader-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.preloader-leave-to {
  opacity: 0;
  transform: scale(1.1);
}

/* Modal overlay transition */
.modal-overlay-enter-active {
  transition: opacity 0.4s ease;
}
.modal-overlay-enter-active .relative {
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;
}
.modal-overlay-enter-from {
  opacity: 0;
}
.modal-overlay-enter-from .relative {
  transform: scale(0.8) translateY(20px);
  opacity: 0;
}
.modal-overlay-leave-active {
  transition: opacity 0.3s ease;
}
.modal-overlay-leave-to {
  opacity: 0;
}
</style>
