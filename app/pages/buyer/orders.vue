<template>
  <div class="py-8 md:py-12 space-y-6">
    <!-- Header Card -->
    <div class="bg-farm-gradient rounded-3xl p-5 shadow-farm-glow relative overflow-hidden text-white">
      <div class="relative z-10">
        <h2 class="text-xl font-black">My Purchase Orders</h2>
        <p class="text-white/70 text-xs mt-1">Track and review your orders</p>
      </div>
      <div class="absolute right-0 bottom-0 translate-y-6 translate-x-6 text-white/5 text-9xl font-extrabold select-none pointer-events-none">
        📦
      </div>
    </div>

    <!-- Orders list -->
    <div v-if="pending" class="text-center py-12 text-gray-400 text-sm">
      <div class="animate-pulse flex flex-col items-center gap-2">
        <Icon name="heroicons:arrow-path" class="w-8 h-8 text-farm-leaf animate-spin" />
        <span>Loading orders...</span>
      </div>
    </div>

    <div v-else-if="!ordersData?.orders || ordersData.orders.length === 0" class="farm-card p-12 text-center text-gray-400 text-sm bg-white flex flex-col items-center justify-center gap-3">
      <div class="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-3xl">
        🌾
      </div>
      <div>
        <p class="font-bold text-gray-700">No Orders Found</p>
        <p class="text-xs text-gray-400 mt-0.5">Start buying fresh items from our local farmers.</p>
      </div>
      <NuxtLink
        to="/buyer/dashboard"
        class="bg-farm-deep text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md active:scale-95 transition-all mt-1 inline-block text-center"
      >
        Shop Now
      </NuxtLink>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="order in ordersData.orders"
        :key="order.id"
        class="farm-card p-4 bg-white space-y-3 relative hover:shadow-md transition-shadow duration-300"
      >
        <!-- Order Header info -->
        <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div>
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Order Reference</span>
            <p class="text-xs font-black text-gray-900 leading-tight">#{{ order.id.slice(0, 8).toUpperCase() }}</p>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Date Placed</span>
            <p class="text-xs font-semibold text-gray-500 leading-tight">{{ formatDate(order.created_at) }}</p>
          </div>
        </div>

        <!-- Order Items -->
        <div class="space-y-3 pt-1">
          <div
            v-for="item in order.order_items"
            :key="item.id"
            class="flex items-center gap-3"
          >
            <!-- Product visual -->
            <div
              :class="`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xl ${
                getCategoryInfo(item.products?.category).bg
              }`"
            >
              {{ getCategoryInfo(item.products?.category).emoji }}
            </div>

            <!-- Details -->
            <div class="flex-1 min-w-0">
              <h4 class="text-xs font-bold text-gray-950 truncate leading-snug">
                {{ item.products?.name ?? 'Harvest Item' }}
              </h4>
              <p class="text-[10px] text-gray-400 mt-0.5">
                ₱{{ parseFloat(item.price).toFixed(2) }} × {{ item.quantity }}
              </p>
            </div>

            <!-- Review button -->
            <button
              v-if="item.products"
              @click="openReviewModal(item.products)"
              class="flex items-center gap-1 bg-farm-light hover:bg-farm-deep hover:text-white text-farm-deep font-bold px-3 py-1.5 rounded-xl transition-all text-[10px] shadow-xs active:scale-95"
            >
              <Icon name="heroicons:star" class="w-3 h-3" />
              <span>Review</span>
            </button>
          </div>
        </div>

        <!-- Total row -->
        <div class="flex items-center justify-between pt-2 border-t border-gray-50">
          <span class="text-xs text-gray-500 font-bold">Total Paid</span>
          <span class="text-farm-deep font-black text-base">₱{{ parseFloat(order.total_amount).toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- Review Submission Modal -->
    <Transition name="modal-fade">
      <div v-if="showReviewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/40 backdrop-blur-xs" @click="showReviewModal = false" />
        
        <!-- Modal body -->
        <div class="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative z-10 overflow-hidden flex flex-col">
          <div class="bg-farm-gradient p-5 text-white flex justify-between items-center">
            <div>
              <h3 class="font-extrabold text-base">Submit Review</h3>
              <p class="text-white/70 text-xs mt-0.5">Rate "{{ selectedProduct?.name }}"</p>
            </div>
            <button @click="showReviewModal = false" class="p-1 rounded-full hover:bg-white/10 text-white transition-colors">
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>

          <div class="p-5 space-y-4">
            <!-- Stars Selection -->
            <div class="flex items-center justify-center gap-2 py-2">
              <button
                v-for="i in 5"
                :key="i"
                type="button"
                @click="rating = i"
                class="focus:outline-none transition-transform hover:scale-110"
              >
                <Icon
                  :name="i <= rating ? 'heroicons:star-solid' : 'heroicons:star'"
                  :class="`w-8 h-8 ${i <= rating ? 'text-farm-yellow' : 'text-gray-200'}`"
                />
              </button>
            </div>

            <!-- Comment input -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-gray-600 uppercase tracking-wider">Your Feedback</label>
              <textarea
                v-model="comment"
                rows="3"
                placeholder="Share your thoughts on the quality, freshness, and delivery..."
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-farm-leaf focus:ring-1 focus:ring-farm-leaf resize-none bg-gray-50"
              />
            </div>

            <!-- Submit button -->
            <button
              @click="submitReview"
              :disabled="submitting || !comment.trim()"
              class="w-full bg-farm-deep text-white font-extrabold py-3 rounded-2xl shadow-farm-glow hover:bg-farm-leaf transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Icon v-if="submitting" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
              <span>Post Review</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Custom Toast -->
    <Transition name="slide-up">
      <div
        v-if="toast.show"
        :class="`fixed bottom-24 left-4 right-4 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white font-semibold text-sm ${
          toast.type === 'success' ? 'bg-farm-deep' : 'bg-red-600'
        }`"
      >
        <Icon :name="toast.type === 'success' ? 'heroicons:check-circle' : 'heroicons:exclamation-circle'" class="w-5 h-5 flex-shrink-0" />
        <span class="flex-1">{{ toast.message }}</span>
        <button @click="toast.show = false" class="p-1 hover:bg-white/10 rounded-full">
          <Icon name="heroicons:x-mark" class="w-4 h-4" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'buyer' })

const router = useRouter()
const api = useApiFetch()

const { data: ordersData, pending, refresh } = await useAsyncData('buyer:orders-list', () => api('/api/buyer/orders'), { server: false })

const getCategoryInfo = (category: string) => {
  const map: Record<string, { emoji: string; bg: string }> = {
    Vegetables: { emoji: '🥬', bg: 'bg-green-50' },
    Fruits: { emoji: '🍎', bg: 'bg-red-50' },
    Organic: { emoji: '🌱', bg: 'bg-emerald-50' },
    Herbs: { emoji: '🌿', bg: 'bg-teal-50' },
    Dairy: { emoji: '🥛', bg: 'bg-blue-50' },
    Grains: { emoji: '🌾', bg: 'bg-yellow-50' },
  }
  return map[category] ?? { emoji: '🌱', bg: 'bg-green-50' }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Review modal states
const showReviewModal = ref(false)
const selectedProduct = ref<any>(null)
const rating = ref(5)
const comment = ref('')
const submitting = ref(false)

function openReviewModal(product: any) {
  selectedProduct.value = product
  rating.value = 5
  comment.value = ''
  showReviewModal.value = true
}

async function submitReview() {
  if (!selectedProduct.value || !comment.value.trim()) return
  submitting.value = true
  try {
    await api('/api/products/review', {
      method: 'POST',
      body: {
        product_id: selectedProduct.value.id,
        rating: rating.value,
        comment: comment.value.trim()
      }
    })
    triggerToast('Review submitted successfully!')
    showReviewModal.value = false
  } catch (err: any) {
    triggerToast(err.data?.statusMessage || 'Failed to submit review', 'error')
  } finally {
    submitting.value = false
  }
}

// Toast notification state
const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value.message = message
  toast.value.type = type
  toast.value.show = true
  setTimeout(() => {
    toast.value.show = false
  }, 4000)
}

useHead({ title: 'My Purchase Orders — Senoro Green Farm' })
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .bg-white,
.modal-fade-leave-active .bg-white {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-fade-enter-from .bg-white,
.modal-fade-leave-to .bg-white {
  transform: scale(0.95) translateY(10px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
