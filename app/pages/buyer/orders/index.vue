<template>
  <div class="pb-28 pt-4 md:pb-12 md:pt-8">
    <div class="flex items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-shop-ink md:text-3xl">My orders</h1>
        <p class="mt-1 text-sm text-gray-500">Track your orders and review what you bought.</p>
      </div>
      <button type="button" class="flex-shrink-0 text-sm font-semibold text-farm-leaf hover:text-farm-deep" :disabled="pending" @click="refresh()">
        {{ pending ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <!-- Status tabs (?status=to_receive etc., linked from the profile page) -->
    <nav v-if="orders.length" class="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" aria-label="Filter orders">
      <NuxtLink
        :to="{ query: { ...route.query, status: undefined } }"
        replace
        class="status-tab"
        :class="!activeGroup ? 'status-tab--active' : ''"
      >
        All
        <span class="tab-count">{{ orders.length }}</span>
      </NuxtLink>
      <NuxtLink
        v-for="group in ORDER_GROUPS"
        :key="group.key"
        :to="{ query: { ...route.query, status: group.key } }"
        replace
        class="status-tab"
        :class="activeGroup?.key === group.key ? 'status-tab--active' : ''"
      >
        {{ group.label }}
        <span v-if="groupCounts[group.key]" class="tab-count" :class="group.key === 'to_receive' && activeGroup?.key !== group.key ? 'tab-count--orange' : ''">
          {{ groupCounts[group.key] }}
        </span>
      </NuxtLink>
    </nav>

    <p v-if="pending && !ordersData" class="py-24 text-center text-sm text-gray-400">Loading…</p>

    <!-- No orders at all -->
    <div v-else-if="!orders.length" class="mt-6 rounded-lg bg-shop-mint px-6 py-14 text-center">
      <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-farm-leaf">
        <Icon name="heroicons:clipboard-document-list" class="h-7 w-7" />
      </span>
      <p class="mt-4 text-base font-semibold text-shop-ink">No orders yet</p>
      <p class="mt-1 text-sm text-gray-500">Your orders from local farmers will show here.</p>
      <NuxtLink to="/" class="mt-5 inline-flex min-h-[44px] items-center rounded bg-farm-leaf px-6 text-sm font-semibold text-white hover:bg-farm-deep">
        Start shopping
      </NuxtLink>
    </div>

    <!-- Nothing in this tab -->
    <div v-else-if="!filteredOrders.length" class="mt-5 rounded-lg border border-dashed border-gray-200 px-6 py-12 text-center">
      <p class="text-sm font-medium text-shop-ink">No orders in “{{ activeGroup?.label }}”</p>
      <NuxtLink :to="{ query: { ...route.query, status: undefined } }" replace class="mt-2 inline-flex min-h-[40px] items-center text-sm font-semibold text-farm-leaf">
        Show all orders
      </NuxtLink>
    </div>

    <ul v-else class="mt-5 space-y-4">
      <li v-for="order in filteredOrders" :key="order.id" class="overflow-hidden rounded-lg border border-gray-100">
        <!-- Header -->
        <div class="flex items-center justify-between gap-3 bg-shop-mint px-4 py-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-shop-ink">Order #{{ shortId(order.id) }}</p>
            <p class="text-xs text-gray-500">{{ formatDate(order.created_at) }}</p>
          </div>
          <span class="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusPillClass(order.status)">
            {{ labelFor(order.status) }}
          </span>
        </div>

        <NuxtLink :to="`/buyer/orders/${order.id}`" class="block px-4 py-4">
          <!-- Progress (active orders only) -->
          <div v-if="stepIndex(order.status) >= 0 && order.status !== 'delivered'" class="mb-4">
            <div class="flex gap-1" aria-hidden="true">
              <span
                v-for="(step, i) in STEPS"
                :key="step"
                class="h-1.5 flex-1 rounded-full"
                :class="i <= stepIndex(order.status) ? 'bg-farm-leaf' : 'bg-gray-100'"
              />
            </div>
            <p class="mt-2 text-sm text-farm-deep">{{ statusHint(order) }}</p>
          </div>

          <!-- Items -->
          <div class="flex items-center gap-3">
            <div class="flex flex-shrink-0 -space-x-3">
              <img
                v-for="item in (order.order_items ?? []).slice(0, 3)"
                :key="item.id"
                :src="orderItemImage(item)"
                :alt="orderItemName(item)"
                loading="lazy"
                class="h-12 w-12 rounded border-2 border-white bg-shop-cream object-cover"
              >
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm text-shop-ink">{{ itemSummary(order) }}</p>
              <p class="text-xs text-gray-500">
                {{ unitCount(order) }} {{ unitCount(order) === 1 ? 'item' : 'items' }} · Cash on delivery
              </p>
            </div>
            <Icon name="heroicons:chevron-right" class="h-5 w-5 flex-shrink-0 text-gray-300" />
          </div>
        </NuxtLink>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <p class="text-sm">
            <span class="text-gray-500">Total </span>
            <span class="font-bold tabular-nums text-farm-leaf">{{ formatPeso(order.total_amount) }}</span>
          </p>
          <div class="flex flex-shrink-0 gap-2">
            <button
              v-if="order.status === 'delivered' && reviewableItems(order).length"
              type="button"
              class="btn-outline"
              @click="openReview(order)"
            >
              Review
            </button>
            <NuxtLink :to="`/buyer/orders/${order.id}`" :class="isActiveDelivery(order.status) ? 'btn-accent' : 'btn-outline'">
              {{ isActiveDelivery(order.status) ? 'Track order' : 'Details' }}
            </NuxtLink>
          </div>
        </div>
      </li>
    </ul>

    <!-- Review: bottom sheet on phones, dialog on desktop -->
    <UiSheet :open="showReview" title="Write a review" :caption="`Order #${reviewOrder ? shortId(reviewOrder.id) : ''}`" @close="showReview = false">
      <div class="space-y-4">
        <div v-if="reviewItems.length > 1">
          <p class="mb-1.5 text-sm font-medium text-shop-ink">Which item?</p>
          <ul class="space-y-2">
            <li v-for="item in reviewItems" :key="item.id">
              <label
                class="flex cursor-pointer items-center gap-3 rounded-md border p-2.5"
                :class="selectedProductId === item.products!.id ? 'border-farm-leaf bg-shop-mint' : 'border-gray-200'"
              >
                <input v-model="selectedProductId" type="radio" name="review-item" :value="item.products!.id" class="h-5 w-5 flex-shrink-0 accent-farm-leaf">
                <img :src="orderItemImage(item)" alt="" class="h-10 w-10 flex-shrink-0 rounded bg-shop-cream object-cover">
                <span class="min-w-0 truncate text-sm text-shop-ink">{{ orderItemName(item) }}</span>
              </label>
            </li>
          </ul>
        </div>
        <div v-else-if="reviewItems[0]" class="flex items-center gap-3">
          <img :src="orderItemImage(reviewItems[0])" alt="" class="h-12 w-12 flex-shrink-0 rounded bg-shop-cream object-cover">
          <p class="min-w-0 truncate text-sm font-medium text-shop-ink">{{ orderItemName(reviewItems[0]) }}</p>
        </div>

        <div>
          <p class="text-sm font-medium text-shop-ink">Your rating</p>
          <div class="mt-1 flex gap-1" role="radiogroup" aria-label="Your rating">
            <button
              v-for="i in 5"
              :key="i"
              type="button"
              class="flex h-11 w-11 items-center justify-center"
              role="radio"
              :aria-checked="rating === i"
              :aria-label="`${i} ${i === 1 ? 'star' : 'stars'}`"
              @click="rating = i"
            >
              <Icon name="heroicons:star-solid" class="h-8 w-8" :class="i <= rating ? 'text-amber-400' : 'text-gray-200'" />
            </button>
          </div>
        </div>

        <div>
          <label for="review-comment" class="text-sm font-medium text-shop-ink">Comment</label>
          <textarea
            id="review-comment"
            v-model="comment"
            rows="3"
            placeholder="How was the quality and freshness?"
            class="mt-1 w-full resize-none rounded border border-gray-200 px-3 py-2.5 text-sm text-shop-ink outline-none placeholder:text-gray-400 focus:border-farm-leaf"
          />
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="inline-flex min-h-[48px] w-full items-center justify-center rounded bg-farm-leaf text-sm font-semibold text-white hover:bg-farm-deep disabled:opacity-50"
          :disabled="submitting || !comment.trim() || !selectedProductId"
          @click="submitReview"
        >
          {{ submitting ? 'Posting…' : 'Post review' }}
        </button>
      </template>
    </UiSheet>

    <BuyerToast :show="toast.show" :message="toast.message" :type="toast.type" @close="toast.show = false" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'buyer' })

interface OrderItem {
  id: string
  quantity: number
  price: number | string
  product_name?: string | null
  product_image_url?: string | null
  products?: { id?: string; name?: string; category?: string; image_url?: string | null } | null
}

interface OrderRow {
  id: string
  status: string
  total_amount: number | string
  created_at: string
  delivery_rider?: { full_name?: string | null } | null
  order_items?: OrderItem[]
}

const api = useApiFetch()
const route = useRoute()

const { data: ordersData, pending, refresh } = await useAsyncData(
  'buyer:orders-list',
  () => api<{ orders: OrderRow[] }>('/api/buyer/orders'),
  { server: false },
)

const orders = computed(() => ordersData.value?.orders ?? [])
const activeGroup = computed(() => orderGroupFor(route.query.status))
const groupCounts = computed(() => countOrdersByGroup(orders.value))
const filteredOrders = computed(() => {
  const group = activeGroup.value
  if (!group) return orders.value
  return orders.value.filter(o => (group.statuses as readonly string[]).includes(o.status))
})

onMounted(() => refresh())

// Progress bar steps, in order.
const STEPS = ['pending', 'processing', 'ready_for_pickup', 'out_for_delivery', 'delivered'] as const
const stepIndex = (status: string) => STEPS.indexOf(status as typeof STEPS[number])

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function labelFor(status: string) {
  const map: Record<string, string> = {
    pending: 'To confirm',
    processing: 'Preparing',
    ready_for_pickup: 'Ready for pickup',
    out_for_delivery: 'On the way',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return map[status] ?? status
}

function statusPillClass(status: string) {
  if (status === 'delivered') return 'bg-farm-leaf text-white'
  if (status === 'out_for_delivery' || status === 'ready_for_pickup') return 'bg-market-orange text-white'
  if (status === 'cancelled') return 'bg-red-50 text-red-600'
  return 'bg-white text-farm-deep'
}

function statusHint(order: OrderRow) {
  const rider = order.delivery_rider?.full_name
  switch (order.status) {
    case 'pending': return 'Waiting for the shop to accept your order.'
    case 'processing': return 'The shop is preparing your items.'
    case 'ready_for_pickup': return rider ? `${rider} is picking up your order.` : 'Packed. Waiting for a rider.'
    case 'out_for_delivery': return rider ? `${rider} is on the way. Have cash ready.` : 'Your order is on the way.'
    default: return ''
  }
}

const isActiveDelivery = (status: string) => status === 'ready_for_pickup' || status === 'out_for_delivery'

function itemSummary(order: OrderRow) {
  const names = (order.order_items ?? []).map(orderItemName)
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`
}

function unitCount(order: OrderRow) {
  return (order.order_items ?? []).reduce((sum, i) => sum + (i.quantity ?? 1), 0)
}

// Items that still exist as products (deleted products can't be reviewed).
function reviewableItems(order: OrderRow) {
  return (order.order_items ?? []).filter(i => i.products?.id)
}

// Review sheet
const showReview = ref(false)
const reviewOrder = ref<OrderRow | null>(null)
const selectedProductId = ref<string | null>(null)
const rating = ref(5)
const comment = ref('')
const submitting = ref(false)
const reviewItems = computed(() => (reviewOrder.value ? reviewableItems(reviewOrder.value) : []))

function openReview(order: OrderRow) {
  reviewOrder.value = order
  selectedProductId.value = reviewableItems(order)[0]?.products?.id ?? null
  rating.value = 5
  comment.value = ''
  showReview.value = true
}

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 4000)
}

async function submitReview() {
  if (!selectedProductId.value || !comment.value.trim()) return
  submitting.value = true
  try {
    await api('/api/products/review', {
      method: 'POST',
      body: {
        product_id: selectedProductId.value,
        rating: rating.value,
        comment: comment.value.trim(),
      },
    })
    showReview.value = false
    triggerToast('Thanks! Your review is posted.')
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Failed to submit review', 'error')
  }
  finally {
    submitting.value = false
  }
}

useHead({ title: 'My Orders — NFWM' })
</script>

<style scoped>
.status-tab {
  @apply inline-flex min-h-[40px] flex-shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-4 text-sm text-gray-600 transition-colors hover:border-farm-leaf hover:text-farm-leaf;
}
.status-tab--active {
  @apply border-farm-leaf bg-farm-leaf text-white hover:text-white;
}
.tab-count {
  @apply rounded-full bg-black/5 px-1.5 text-xs tabular-nums;
}
.status-tab--active .tab-count {
  @apply bg-white/20;
}
.tab-count--orange {
  @apply bg-market-orange text-white;
}
.btn-outline {
  @apply inline-flex min-h-[40px] items-center justify-center rounded border border-farm-leaf px-4 text-sm font-semibold text-farm-leaf transition-colors hover:bg-farm-leaf hover:text-white;
}
.btn-accent {
  @apply inline-flex min-h-[40px] items-center justify-center rounded bg-market-orange px-4 text-sm font-semibold text-white transition-colors hover:bg-[#cf6d17];
}
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }
</style>
