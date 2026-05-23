<template>
  <PageContainer class="space-y-8 py-8 md:py-12">
    <header class="border-b border-farm-light pb-6">
      <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-1">
        Purchases
      </p>
      <h1 class="text-2xl font-light text-farm-dark tracking-tight">My orders</h1>
      <p class="text-sm text-farm-dark/50 mt-1">Track parcels and review your harvest</p>
    </header>

    <div v-if="pending" class="p-12 text-center text-xs text-farm-dark/40">
      Loading orders…
    </div>

    <div
      v-else-if="!orders.length"
      class="border border-farm-light p-12 text-center bg-white"
    >
      <p class="text-sm font-medium text-farm-dark">No orders yet</p>
      <p class="text-xs text-farm-dark/45 mt-1">Start shopping from local farmers.</p>
      <NuxtLink
        to="/buyer/dashboard"
        class="inline-block mt-4 px-5 py-2.5 bg-farm-deep text-white text-xs font-medium tracking-wide uppercase"
      >
        Shop now
      </NuxtLink>
    </div>

    <section v-else class="space-y-px border border-farm-light">
      <article
        v-for="order in orders"
        :key="order.id"
        class="bg-white p-5 space-y-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-[10px] uppercase tracking-wider text-farm-dark/40">Order</p>
            <p class="text-sm font-medium text-farm-dark">#{{ shortId(order.id) }}</p>
            <p class="text-xs text-farm-dark/50 mt-0.5">{{ formatDate(order.created_at) }}</p>
          </div>
          <span
            class="text-[10px] font-medium tracking-wider uppercase px-2 py-1 border"
            :class="statusChipClass(order.status)"
          >
            {{ labelFor(order.status) }}
          </span>
        </div>

        <div class="space-y-2 border-t border-farm-light pt-3">
          <div
            v-for="item in (order.order_items ?? []).slice(0, 3)"
            :key="item.id"
            class="flex items-center justify-between text-sm gap-3"
          >
            <p class="text-farm-dark truncate flex-1">{{ item.products?.name ?? 'Item' }}</p>
            <p class="text-xs text-farm-dark/45 tabular-nums flex-shrink-0">
              ×{{ item.quantity }}
            </p>
          </div>
          <p v-if="(order.order_items?.length ?? 0) > 3" class="text-xs text-farm-dark/40">
            +{{ (order.order_items?.length ?? 0) - 3 }} more item(s)
          </p>
        </div>

        <div class="flex items-center justify-between pt-1">
          <span class="text-xs text-farm-dark/45 uppercase tracking-wider">Total</span>
          <span class="text-base font-medium text-farm-leaf tabular-nums">
            ₱{{ parseFloat(String(order.total_amount)).toFixed(2) }}
          </span>
        </div>

        <div class="flex flex-wrap gap-2 pt-1">
          <NuxtLink
            :to="trackOrderPath(order.id)"
            class="flex-1 min-w-[140px] py-2.5 text-center bg-farm-deep text-white text-xs font-medium tracking-[0.1em] uppercase hover:bg-farm-dark"
          >
            Track order
          </NuxtLink>
          <button
            v-if="order.status === 'delivered' && firstProduct(order)"
            type="button"
            class="py-2.5 px-4 border border-farm-light text-farm-deep text-xs font-medium tracking-wide uppercase hover:bg-farm-light/50"
            @click="openReviewModal(firstProduct(order)!)"
          >
            Review
          </button>
        </div>
      </article>
    </section>

    <Transition name="modal-fade">
      <div v-if="showReviewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40" @click="showReviewModal = false" />
        <div class="bg-white w-full max-w-sm relative z-10 border border-farm-light overflow-hidden">
          <div class="bg-farm-deep p-5 text-white flex justify-between items-center">
            <div>
              <h3 class="font-medium text-sm">Submit review</h3>
              <p class="text-white/70 text-xs mt-0.5">{{ selectedProduct?.name }}</p>
            </div>
            <button type="button" class="text-white/80" @click="showReviewModal = false">
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-5 space-y-4">
            <div class="flex items-center justify-center gap-2 py-2">
              <button
                v-for="i in 5"
                :key="i"
                type="button"
                @click="rating = i"
              >
                <Icon
                  :name="i <= rating ? 'heroicons:star-solid' : 'heroicons:star'"
                  :class="`w-7 h-7 ${i <= rating ? 'text-farm-yellow' : 'text-gray-200'}`"
                />
              </button>
            </div>
            <textarea
              v-model="comment"
              rows="3"
              placeholder="Share your thoughts on quality and freshness…"
              class="w-full border border-farm-light px-3 py-2 text-xs outline-none focus:border-farm-leaf resize-none bg-farm-light/30"
            />
            <button
              type="button"
              class="w-full py-3 bg-farm-deep text-white text-xs font-medium tracking-wide uppercase disabled:opacity-50"
              :disabled="submitting || !comment.trim()"
              @click="submitReview"
            >
              {{ submitting ? 'Posting…' : 'Post review' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="slide-up">
      <div
        v-if="toast.show"
        class="fixed bottom-24 left-4 right-4 z-50 p-4 text-white text-sm font-medium flex items-center gap-3"
        :class="toast.type === 'success' ? 'bg-farm-deep' : 'bg-red-600'"
      >
        <span class="flex-1">{{ toast.message }}</span>
        <button type="button" @click="toast.show = false">
          <Icon name="heroicons:x-mark" class="w-4 h-4" />
        </button>
      </div>
    </Transition>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '~/components/ui/PageContainer.vue'

definePageMeta({ layout: 'buyer' })

interface OrderRow {
  id: string
  status: string
  total_amount: number | string
  created_at: string
  order_items?: {
    id: string
    quantity: number
    price: number | string
    products?: { id?: string; name?: string; category?: string }
  }[]
}

const api = useApiFetch()

const { data: ordersData, pending, refresh } = await useAsyncData(
  'buyer:orders-list',
  () => api<{ orders: OrderRow[] }>('/api/buyer/orders'),
  { server: false },
)

const orders = computed(() => ordersData.value?.orders ?? [])

onMounted(() => refresh())

function trackOrderPath(id: string) {
  return `/buyer/orders/${id}`
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function labelFor(status: string) {
  const map: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    ready_for_pickup: 'Ready for pickup',
    out_for_delivery: 'Out for delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return map[status] ?? status
}

function statusChipClass(status: string) {
  if (status === 'delivered') return 'border-farm-leaf/50 text-farm-leaf bg-farm-light/40'
  if (status === 'out_for_delivery') return 'border-farm-deep/40 text-farm-deep bg-farm-light/30'
  if (status === 'cancelled') return 'border-red-200 text-red-600 bg-red-50'
  if (status === 'processing') return 'border-farm-leaf/40 text-farm-deep'
  return 'border-farm-light text-farm-dark/55'
}

function firstProduct(order: OrderRow) {
  return order.order_items?.find(i => i.products)?.products
}

const showReviewModal = ref(false)
const selectedProduct = ref<{ id: string; name?: string } | null>(null)
const rating = ref(5)
const comment = ref('')
const submitting = ref(false)
const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

function openReviewModal(product: { id?: string; name?: string }) {
  if (!product.id) return
  selectedProduct.value = { id: product.id, name: product.name }
  rating.value = 5
  comment.value = ''
  showReviewModal.value = true
}

async function submitReview() {
  if (!selectedProduct.value?.id || !comment.value.trim()) return
  submitting.value = true
  try {
    await api('/api/products/review', {
      method: 'POST',
      body: {
        product_id: selectedProduct.value.id,
        rating: rating.value,
        comment: comment.value.trim(),
      },
    })
    toast.value = { show: true, message: 'Review submitted', type: 'success' }
    showReviewModal.value = false
    setTimeout(() => { toast.value.show = false }, 4000)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    toast.value = { show: true, message: e.data?.statusMessage || 'Failed to submit review', type: 'error' }
  }
  finally {
    submitting.value = false
  }
}

useHead({ title: 'My Orders — Senoro Green Farm' })
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }
.slide-up-enter-active,
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.slide-up-enter-from,
.slide-up-leave-to { transform: translateY(100%); opacity: 0; }
</style>
