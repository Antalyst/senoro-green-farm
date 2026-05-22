<template>
  <div class="pb-6">
    <!-- Hero Banner / Promo Carousel -->
    <div class="relative bg-farm-gradient overflow-hidden">
      <div class="px-4 pt-4 pb-6">
        <div class="bg-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p class="text-white/70 text-xs font-medium">Welcome back!</p>
            <p class="text-white font-extrabold text-base">{{ user?.full_name?.split(' ')[0] }} 👋</p>
            <p class="text-farm-yellow text-xs font-semibold mt-1">FREE delivery on orders ₱300+</p>
          </div>
          <div class="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20">
            <img src="/logo.png" alt="Senoro" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <!-- Wave divider -->
      <svg class="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 375 20" preserveAspectRatio="none" fill="#f9fafb">
        <path d="M0,20 C100,0 275,0 375,20 L375,20 L0,20 Z" />
      </svg>
    </div>

    <div class="px-4 space-y-5 mt-2">
      <!-- Category Scroll -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-gray-900 text-sm">Categories</h3>
          <button class="text-xs text-farm-leaf font-semibold">See all</button>
        </div>
        <div class="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          <button
            v-for="cat in categories"
            :key="cat.label"
            :class="[
              'flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl transition-all',
              activeCategory === cat.label
                ? 'bg-farm-deep text-white shadow-farm-glow'
                : 'bg-white text-gray-600 shadow-farm-card',
            ]"
            @click="activeCategory = cat.label"
          >
            <span class="text-xl">{{ cat.emoji }}</span>
            <span class="text-[10px] font-semibold whitespace-nowrap">{{ cat.label }}</span>
          </button>
        </div>
      </div>

      <!-- Flash Sale Banner -->
      <div class="bg-farm-yellow/20 border border-farm-yellow/40 rounded-2xl px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xl">⚡</span>
          <div>
            <p class="text-farm-dark font-extrabold text-sm">Flash Sale</p>
            <p class="text-farm-deep text-xs font-medium">Up to 30% off today</p>
          </div>
        </div>
        <div class="bg-farm-deep rounded-xl px-3 py-1">
          <p class="text-white text-xs font-bold">{{ countdown }}</p>
        </div>
      </div>

      <!-- Product Grid -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-gray-900 text-sm">Fresh Produce</h3>
          <span class="text-xs text-gray-400">{{ filteredProducts.length }} items</span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="farm-card overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
          >
            <!-- Product image area -->
            <div :class="`h-32 flex items-center justify-center text-5xl ${product.bg} relative`">
              <span>{{ product.emoji }}</span>
              <div v-if="product.discount" class="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                -{{ product.discount }}%
              </div>
              <button
                class="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center"
                @click.stop
              >
                <Icon name="heroicons:heart" class="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            <!-- Product info -->
            <div class="p-3">
              <p class="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{{ product.name }}</p>
              <p class="text-[10px] text-gray-400 mt-0.5">{{ product.seller }}</p>
              <div class="flex items-center justify-between mt-2">
                <div>
                  <p class="text-farm-deep font-extrabold text-sm">₱{{ product.price }}</p>
                  <p v-if="product.originalPrice" class="text-gray-400 text-[10px] line-through">₱{{ product.originalPrice }}</p>
                </div>
                <div class="text-right">
                  <p class="text-[10px] text-gray-400">{{ product.sold }} sold</p>
                  <div class="flex items-center gap-0.5 mt-0.5">
                    <Icon name="heroicons:star-solid" class="w-3 h-3 text-farm-yellow" />
                    <span class="text-[10px] text-gray-500 font-medium">{{ product.rating }}</span>
                  </div>
                </div>
              </div>
              <button class="w-full mt-2 py-1.5 bg-farm-leaf text-white text-xs font-bold rounded-lg hover:bg-farm-deep transition-colors">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'buyer' })

const { user } = useAuth()

const activeCategory = ref('All')
const countdown = ref('02:45:30')

const categories = [
  { label: 'All',       emoji: '🛒' },
  { label: 'Leafy',    emoji: '🥬' },
  { label: 'Fruits',   emoji: '🍅' },
  { label: 'Herbs',    emoji: '🌿' },
  { label: 'Root',     emoji: '🥕' },
  { label: 'Legumes',  emoji: '🫛' },
]

const allProducts = ref([
  { id: 1, name: 'Fresh Pechay Bundle',      emoji: '🥬', bg: 'bg-green-50',   price: 25,  originalPrice: null, seller: 'Senoro Farm', sold: 142, rating: 4.9, discount: null,   category: 'Leafy' },
  { id: 2, name: 'Ripe Tomatoes (1 kg)',     emoji: '🍅', bg: 'bg-red-50',     price: 45,  originalPrice: 60,  seller: 'Senoro Farm', sold: 89,  rating: 4.7, discount: 25,    category: 'Fruits' },
  { id: 3, name: 'Kangkong Bunch',           emoji: '🌿', bg: 'bg-emerald-50', price: 15,  originalPrice: null, seller: 'Senoro Farm', sold: 201, rating: 4.8, discount: null,   category: 'Leafy' },
  { id: 4, name: 'Ampalaya (Bitter Gourd)',  emoji: '🥒', bg: 'bg-lime-50',    price: 60,  originalPrice: 80,  seller: 'Senoro Farm', sold: 56,  rating: 4.6, discount: 25,    category: 'Fruits' },
  { id: 5, name: 'Sigarilyas (Wing Beans)',  emoji: '🫛', bg: 'bg-yellow-50',  price: 35,  originalPrice: null, seller: 'Senoro Farm', sold: 78,  rating: 4.5, discount: null,   category: 'Legumes' },
  { id: 6, name: 'Malunggay Leaves',         emoji: '🌱', bg: 'bg-teal-50',    price: 20,  originalPrice: null, seller: 'Senoro Farm', sold: 315, rating: 5.0, discount: null,   category: 'Herbs' },
  { id: 7, name: 'Carrots (½ kg)',           emoji: '🥕', bg: 'bg-orange-50',  price: 40,  originalPrice: 50,  seller: 'Senoro Farm', sold: 93,  rating: 4.7, discount: 20,    category: 'Root' },
  { id: 8, name: 'Camote Tops Bundle',       emoji: '🍃', bg: 'bg-green-50',   price: 20,  originalPrice: null, seller: 'Senoro Farm', sold: 167, rating: 4.8, discount: null,   category: 'Leafy' },
])

const filteredProducts = computed(() => {
  if (activeCategory.value === 'All') return allProducts.value
  return allProducts.value.filter(p => p.category === activeCategory.value)
})

// Countdown timer (visual only)
onMounted(() => {
  let secs = 9930
  const timer = setInterval(() => {
    secs--
    if (secs <= 0) { clearInterval(timer); return }
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    countdown.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, 1000)
  onUnmounted(() => clearInterval(timer))
})

useHead({ title: 'Shop — Senoro Green Farm' })
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
