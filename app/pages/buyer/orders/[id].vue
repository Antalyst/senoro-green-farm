<template>
  <div class="mx-auto max-w-3xl space-y-4 py-6 md:py-10">
    <!-- Loading -->
    <template v-if="pending && !order">
      <div class="h-28 animate-pulse rounded-2xl bg-gray-100" />
      <div class="h-64 animate-pulse rounded-2xl bg-gray-100" />
      <div class="h-40 animate-pulse rounded-2xl bg-gray-100" />
    </template>

    <!-- Error -->
    <div v-else-if="fetchError" class="card flex flex-col items-center py-14 text-center">
      <Icon name="heroicons:exclamation-circle" class="h-10 w-10 text-gray-300" />
      <p class="mt-3 font-medium text-shop-ink">{{ fetchError }}</p>
      <NuxtLink to="/buyer/orders" class="mt-4 text-sm font-semibold text-farm-leaf hover:underline">Back to my orders</NuxtLink>
    </div>

    <template v-else-if="order">
      <!-- Status header -->
      <section class="relative overflow-hidden rounded-2xl p-5 md:p-6" :class="statusTheme.bg">
        <div class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/30" aria-hidden="true" />
        <div class="relative flex items-start gap-4">
          <span class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-sm" :class="statusTheme.icon">
            <Icon :name="statusInfo.icon" class="h-6 w-6" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium uppercase tracking-wide" :class="statusTheme.icon">{{ statusLabel }}</p>
            <h1 class="mt-0.5 text-lg font-bold leading-snug text-shop-ink md:text-xl">{{ statusInfo.title }}</h1>
            <p class="mt-1 text-sm text-gray-600">{{ statusInfo.text }}</p>
          </div>
        </div>
        <div class="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-black/5 pt-3 text-xs text-gray-500">
          <span>Order <span class="font-semibold text-shop-ink">#{{ shortId }}</span></span>
          <span>Placed {{ formatDate(order.created_at) }}</span>
        </div>
      </section>

      <!-- Each shop: what to pay, payment status, and the shop chat -->
      <section v-if="order.status !== 'cancelled'" class="card">
        <h2 class="card-title">Pay &amp; chat with shops</h2>
        <ul class="mt-3 divide-y divide-gray-100">
          <li v-for="shop in shopRows" :key="shop.shopId" class="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-shop-ink">{{ shop.shopName }}</p>
              <p class="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span class="tabular-nums">{{ formatPeso(shop.amount) }}</span>
                <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="paymentBadgeClass(shop.payment)">
                  {{ paymentStatusLabel(shop.payment) }}
                </span>
              </p>
              <p v-if="shop.payment?.status === 'rejected'" class="mt-1 text-xs text-red-600">
                Not accepted: {{ shop.payment.rejection_reason }}
              </p>
            </div>
            <button
              v-if="shop.shopId"
              type="button"
              class="inline-flex min-h-[40px] flex-shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold"
              :class="buyerMustPay(shop.payment) ? 'bg-market-orange text-white' : 'border border-gray-200 text-shop-ink'"
              @click="openShopChat(shop.shopId, shop.shopName)"
            >
              <Icon :name="buyerMustPay(shop.payment) ? 'heroicons:qr-code' : 'heroicons:chat-bubble-left-right'" class="h-4 w-4" />
              {{ buyerMustPay(shop.payment) ? 'Pay now' : 'Chat' }}
            </button>
          </li>
        </ul>
      </section>

      <!-- Proof of delivery QR -->
      <section v-if="order.delivery_qr" class="rounded-2xl border-2 border-farm-leaf bg-white p-5 text-center md:p-6">
        <p class="text-base font-semibold text-shop-ink">Your delivery QR</p>
        <p class="mx-auto mt-1 max-w-sm text-sm text-gray-500">
          Show this to your rider when your order arrives. They scan it to complete the delivery.
        </p>
        <div class="mx-auto mt-4 w-52 max-w-full">
          <UiQrCode :value="order.delivery_qr.payload" label="Delivery QR code" />
        </div>
        <p class="mt-3 text-xs text-gray-400">Or tell the rider this code</p>
        <p class="font-mono text-2xl font-bold tracking-[0.2em] text-shop-ink">{{ order.delivery_qr.code }}</p>
        <p class="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-700">
          <Icon name="heroicons:exclamation-triangle" class="h-4 w-4" />
          Only show it after you receive your items.
        </p>
      </section>

      <!-- Rider -->
      <section v-if="showRiderCard" class="card flex items-center gap-4">
        <span class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-farm-leaf text-base font-semibold text-white">
          {{ (order.delivery_rider?.full_name || 'R').charAt(0).toUpperCase() }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-xs text-gray-400">Your rider</p>
          <p class="truncate font-semibold text-shop-ink">{{ order.delivery_rider?.full_name || 'Assigned rider' }}</p>
          <p class="text-xs text-gray-500">{{ riderStatusText }}</p>
        </div>
        <button
          v-if="showChatLink"
          type="button"
          class="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-farm-leaf px-4 py-2 text-sm font-semibold text-white transition hover:bg-farm-deep"
          @click="openRiderChat"
        >
          <Icon name="heroicons:chat-bubble-left-right" class="h-4 w-4" />
          Chat
        </button>
      </section>

      <!-- Progress -->
      <section v-if="order.status !== 'cancelled'" class="card">
        <h2 class="card-title">Order progress</h2>
        <ol class="mt-5">
          <li v-for="(step, i) in steps" :key="step.key" class="relative flex gap-4 pb-6 last:pb-0">
            <span
              v-if="i < steps.length - 1"
              class="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5"
              :class="steps[i + 1]!.done ? 'bg-farm-leaf' : 'bg-gray-200'"
              aria-hidden="true"
            />
            <span
              class="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
              :class="step.active
                ? 'bg-farm-leaf text-white ring-4 ring-farm-leaf/15'
                : step.done ? 'bg-farm-leaf text-white' : 'bg-gray-100 text-gray-400'"
            >
              <Icon :name="step.done && !step.active ? 'heroicons:check' : stepIcons[step.key] ?? 'heroicons:ellipsis-horizontal'" class="h-4 w-4" />
            </span>
            <div class="min-w-0 pt-1">
              <p class="text-sm font-semibold" :class="step.done ? 'text-shop-ink' : 'text-gray-400'">
                {{ step.label }}
                <span v-if="step.active" class="ml-1.5 rounded-full bg-shop-mint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-farm-leaf">Now</span>
              </p>
              <p class="mt-0.5 text-xs" :class="step.done ? 'text-gray-500' : 'text-gray-400'">{{ step.description }}</p>
            </div>
          </li>
        </ol>
      </section>

      <!-- Items, grouped by shop -->
      <section class="overflow-hidden rounded-2xl bg-white pb-1 ring-1 ring-gray-100">
        <h2 class="card-title px-5 pt-5 md:px-6">Items ({{ itemCount }})</h2>
        <div v-for="group in itemGroups" :key="group.shopId" class="mt-4 border-t border-gray-100 first-of-type:border-t-0">
          <NuxtLink
            :to="group.shopId ? `/buyer/shop/${group.shopId}` : '#'"
            class="flex items-center gap-2 px-5 pt-4 text-sm font-semibold text-shop-ink hover:text-farm-leaf md:px-6"
          >
            <Icon name="heroicons:building-storefront" class="h-4 w-4 text-farm-leaf" />
            {{ group.shopName }}
            <Icon name="heroicons:chevron-right" class="h-4 w-4 text-gray-300" />
          </NuxtLink>
          <ul class="divide-y divide-gray-50">
            <li v-for="item in group.items" :key="item.id">
              <NuxtLink
                :to="item.products?.id ? `/buyer/product/${item.products.id}` : '#'"
                class="flex items-center gap-4 px-5 py-4 transition hover:bg-gray-50/70 md:px-6"
              >
                <span class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-shop-cream ring-1 ring-black/5 md:h-20 md:w-20">
                  <img
                    :src="orderItemImage(item)"
                    :alt="orderItemName(item)"
                    loading="lazy"
                    class="h-full w-full object-cover"
                  >
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium text-shop-ink">{{ orderItemName(item) }}</span>
                  <span v-if="item.products?.category" class="block text-xs text-gray-400">{{ item.products.category }}</span>
                  <span class="mt-1 block text-xs text-gray-500 tabular-nums">{{ formatPeso(item.price) }} × {{ item.quantity }}</span>
                </span>
                <span class="flex-shrink-0 text-sm font-semibold text-shop-ink tabular-nums">
                  {{ formatPeso(Number(item.price) * Number(item.quantity)) }}
                </span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </section>

      <div class="grid gap-4 md:grid-cols-2">
        <!-- Delivery address -->
        <section class="card">
          <h2 class="card-title">Delivery address</h2>
          <div v-if="order.addresses" class="mt-4 flex items-start gap-3">
            <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-market-orange/10 text-market-orange">
              <Icon name="heroicons:map-pin-solid" class="h-5 w-5" />
            </span>
            <div class="min-w-0 text-sm">
              <p class="font-medium text-shop-ink">{{ order.addresses.full_name }}</p>
              <p class="text-gray-500">{{ order.addresses.phone_number }}</p>
              <p class="mt-1 text-gray-600">{{ order.addresses.detailed_address }}</p>
              <p class="text-gray-500">Brgy. {{ order.addresses.barangay }}, {{ order.addresses.city }}</p>
            </div>
          </div>
          <p v-else class="mt-3 text-sm text-gray-400">No address on file.</p>
        </section>

        <!-- Payment -->
        <section class="card">
          <div class="flex items-center justify-between">
            <h2 class="card-title">Payment</h2>
            <span class="inline-flex items-center gap-1 rounded-full bg-shop-mint px-2.5 py-1 text-xs font-medium text-farm-leaf">
              <Icon :name="paidOnline > 0 ? 'heroicons:qr-code' : 'heroicons:banknotes'" class="h-4 w-4" />
              {{ paidOnline > 0 ? (payAtDoor > 0 ? 'Online + cash' : 'Online') : 'Cash on delivery' }}
            </span>
          </div>
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between text-gray-600">
              <dt>Items subtotal</dt>
              <dd class="tabular-nums">{{ formatPeso(itemsSubtotal) }}</dd>
            </div>
            <div class="flex justify-between text-gray-600">
              <dt>Delivery fee</dt>
              <dd class="tabular-nums">{{ formatPeso(deliveryFee) }}</dd>
            </div>
            <div class="flex justify-between border-t border-gray-100 pt-3 text-base font-semibold text-shop-ink">
              <dt>{{ order.status === 'delivered' ? 'Total paid' : 'Total to pay' }}</dt>
              <dd class="text-farm-leaf tabular-nums">{{ formatPeso(order.total_amount) }}</dd>
            </div>
            <template v-if="paidOnline > 0">
              <div class="flex justify-between text-gray-600">
                <dt>Paid online to shops</dt>
                <dd class="tabular-nums">{{ formatPeso(paidOnline) }}</dd>
              </div>
              <div class="flex justify-between font-semibold text-shop-ink">
                <dt>Cash for the rider</dt>
                <dd class="tabular-nums">{{ formatPeso(payAtDoor) }}</dd>
              </div>
            </template>
          </dl>
        </section>
      </div>

      <!-- Cancel: allowed while no shop has been paid yet -->
      <section v-if="order.status === 'pending'" class="card">
        <template v-if="order.can_cancel">
          <div v-if="!confirmingCancel" class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-gray-600">Changed your mind? You can cancel until a shop is paid.</p>
            <button type="button" class="btn-cancel" @click="confirmingCancel = true">
              <Icon name="heroicons:x-circle" class="h-4 w-4" />
              Cancel order
            </button>
          </div>
          <form v-else class="space-y-3" @submit.prevent="cancelOrder">
            <p class="text-sm font-semibold text-shop-ink">Cancel this order?</p>
            <p class="text-xs text-gray-500">The shops and the rider will be told. This cannot be undone.</p>
            <input
              v-model="cancelReason"
              type="text"
              maxlength="200"
              placeholder="Reason (optional), e.g. ordered by mistake"
              class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-farm-leaf"
            >
            <p v-if="cancelError" class="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{{ cancelError }}</p>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="btn-outline" :disabled="cancelling" @click="confirmingCancel = false">Keep order</button>
              <button type="submit" class="btn-cancel-solid" :disabled="cancelling">
                {{ cancelling ? 'Cancelling…' : 'Yes, cancel order' }}
              </button>
            </div>
          </form>
        </template>
        <p v-else-if="order.cancel_block_reason" class="flex items-start gap-2 text-xs text-gray-500">
          <Icon name="heroicons:information-circle" class="h-4 w-4 flex-shrink-0" />
          {{ order.cancel_block_reason }}
        </p>
      </section>

      <!-- Next steps -->
      <div class="flex flex-col gap-3 sm:flex-row">
        <NuxtLink to="/buyer/orders" class="btn-outline">
          <Icon name="heroicons:clipboard-document-list" class="h-4 w-4" />
          All orders
        </NuxtLink>
        <NuxtLink v-if="order.status === 'delivered'" to="/buyer/orders?status=completed" class="btn-primary">
          <Icon name="heroicons:star" class="h-4 w-4" />
          Rate your items
        </NuxtLink>
        <NuxtLink v-else to="/" class="btn-primary">
          <Icon name="heroicons:shopping-bag" class="h-4 w-4" />
          Continue shopping
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { OrderPayment } from '~/composables/useOrderChat'

definePageMeta({ layout: 'buyer' })

interface OrderItem {
  id: string
  quantity: number
  price: number | string
  products?: { id?: string; name?: string; category?: string; image_url?: string | null } | null
  seller?: { id?: string; shop_name?: string | null; full_name?: string | null } | null
}

interface BuyerOrderDetail {
  id: string
  status: string
  total_amount: number | string
  created_at: string
  delivery_rider_id?: string | null
  delivery_rider?: { full_name?: string; email?: string } | null
  delivery_qr?: { payload: string; code: string } | null
  addresses?: {
    full_name: string
    phone_number: string
    city: string
    barangay: string
    detailed_address: string
  } | null
  order_items?: OrderItem[]
  delivery_fee?: number | string | null
  payments?: OrderPayment[]
  can_cancel?: boolean
  cancel_block_reason?: string | null
  cancel_reason?: string | null
}

const route = useRoute()
const api = useApiFetch()
const setSubPageTitle = inject<(t: string) => void>('setSubPageTitle', () => {})
const triggerChatModal = inject<(orderId: string, receiverId?: string | null, label?: string) => Promise<void>>('triggerChatModal')

const orderId = computed(() => {
  const param = route.params.id
  const raw = Array.isArray(param) ? param[0] : param
  return typeof raw === 'string' ? raw : ''
})

const order = ref<BuyerOrderDetail | null>(null)
const fetchError = ref<string | null>(null)
const pending = ref(true)

const { steps, statusLabel } = useOrderTimeline(computed(() => order.value?.status ?? 'pending'))

const shortId = computed(() => (order.value?.id ?? '').slice(0, 8).toUpperCase())

const stepIcons: Record<string, string> = {
  pending: 'heroicons:receipt-percent',
  processing: 'heroicons:archive-box',
  ready_for_pickup: 'heroicons:qr-code',
  out_for_delivery: 'heroicons:truck',
  delivered: 'heroicons:home',
}

// Plain-language summary for the header, based on the QR handoff flow.
const statusInfo = computed(() => {
  const o = order.value
  switch (o?.status) {
    case 'pending':
      return mustPayAny.value
        ? { icon: 'heroicons:qr-code', title: 'Pay the shop to continue', text: 'Pay online, then send your receipt in the shop chat. The shop accepts your order after checking it.' }
        : { icon: 'heroicons:clock', title: 'Waiting for the shop to accept', text: 'The shop will confirm your order soon.' }
    case 'processing':
      return { icon: 'heroicons:archive-box', title: 'The shop is preparing your order', text: 'Your items are being packed.' }
    case 'ready_for_pickup':
      return o.delivery_rider_id
        ? { icon: 'heroicons:truck', title: 'Your rider is heading to the shop', text: 'They will scan the shop receipt when they pick up your order.' }
        : { icon: 'heroicons:qr-code', title: 'Packed and ready for pickup', text: 'Waiting for a rider to accept your order.' }
    case 'out_for_delivery':
      return { icon: 'heroicons:truck', title: 'Your order is on the way', text: 'Have your delivery QR ready and the cash amount below.' }
    case 'delivered':
      return { icon: 'heroicons:check-badge', title: 'Delivered', text: 'Enjoy your fresh farm items! You can rate them now.' }
    case 'cancelled':
      return {
        icon: 'heroicons:x-circle',
        title: 'Order cancelled',
        text: o?.cancel_reason ? `Reason: ${o.cancel_reason}` :'This order was cancelled. Stock was returned to the shops.',
      }
    default:
      return { icon: 'heroicons:clock', title: statusLabel.value, text: '' }
  }
})

const statusTheme = computed(() => {
  const s = order.value?.status
  if (s === 'cancelled') return { bg: 'bg-red-50', icon: 'text-red-600' }
  if (s === 'delivered') return { bg: 'bg-shop-mint', icon: 'text-farm-leaf' }
  if (s === 'out_for_delivery') return { bg: 'bg-shop-mint', icon: 'text-farm-deep' }
  return { bg: 'bg-shop-cream', icon: 'text-market-orange' }
})

const items = computed(() => order.value?.order_items ?? [])
const itemCount = computed(() => items.value.reduce((sum, i) => sum + Number(i.quantity), 0))
const itemsSubtotal = computed(() => items.value.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0))
// Saved at checkout (migration 017); older orders: total = items + delivery fee, so the fee is the difference.
const deliveryFee = computed(() => order.value?.delivery_fee != null
  ? Number(order.value.delivery_fee)
  : Math.max(0, Number(order.value?.total_amount ?? 0) - itemsSubtotal.value))

const payments = computed(() => order.value?.payments ?? [])
const paidOnline = computed(() => payments.value.filter(p => p.method === 'online').reduce((sum, p) => sum + Number(p.amount), 0))
const payAtDoor = computed(() => Math.max(0, Number(order.value?.total_amount ?? 0) - paidOnline.value))
const mustPayAny = computed(() => payments.value.some(p => buyerMustPay(p)))

const itemGroups = computed(() => {
  const groups = new Map<string, { shopId: string; shopName: string; items: OrderItem[] }>()
  for (const item of items.value) {
    const shopId = item.seller?.id ?? 'unknown'
    const group = groups.get(shopId) ?? {
      shopId: item.seller?.id ?? '',
      shopName: item.seller?.shop_name || item.seller?.full_name || 'Local shop',
      items: [],
    }
    group.items.push(item)
    groups.set(shopId, group)
  }
  return [...groups.values()]
})

// One row per shop: amount, payment status and a chat button.
const shopRows = computed(() => itemGroups.value.map(group => ({
  shopId: group.shopId,
  shopName: group.shopName,
  amount: group.items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0),
  payment: payments.value.find(p => p.seller_id === group.shopId) ?? null,
})))

function openShopChat(shopId: string, shopName: string) {
  if (!order.value) return
  triggerChatModal?.(order.value.id, shopId, `Chat with ${shopName}`)
}

// Refresh when a payment changes inside the chat (receipt sent, shop confirmed or rejected).
const chatPaymentVersion = inject<Ref<number> | null>('chatPaymentVersion', null)
if (chatPaymentVersion) watch(chatPaymentVersion, () => loadOrder(true))

// Shown as soon as a rider accepts the job (QR flow: accepted → picked up → delivered).
const showRiderCard = computed(() =>
  !!order.value?.delivery_rider_id
  && ['pending', 'processing', 'ready_for_pickup', 'out_for_delivery', 'delivered'].includes(order.value?.status ?? ''),
)

const showChatLink = computed(() =>
  ['pending', 'processing', 'ready_for_pickup', 'out_for_delivery'].includes(order.value?.status ?? '')
  && !!order.value?.delivery_rider_id,
)

const riderStatusText = computed(() => {
  const status = order.value?.status
  if (status === 'delivered') return 'Delivered your order'
  if (status === 'out_for_delivery') return 'On the way to you'
  if (status === 'pending' || status === 'processing') return 'Will deliver your order once the shops have packed it'
  return 'Going to the shop to pick up your order'
})

function openRiderChat() {
  if (!order.value) return
  const label = order.value.delivery_rider?.full_name
    ? `Chat with ${order.value.delivery_rider.full_name}`
    : 'Chat with your rider'
  triggerChatModal?.(order.value.id, order.value.delivery_rider_id ?? null, label)
}

// Buyer cancels while no shop has been paid yet (the server checks the same rule).
const confirmingCancel = ref(false)
const cancelReason = ref('')
const cancelling = ref(false)
const cancelError = ref<string | null>(null)

async function cancelOrder() {
  if (!order.value || cancelling.value) return
  cancelling.value = true
  cancelError.value = null
  try {
    await api(`/api/buyer/orders/${order.value.id}/cancel`, { method: 'POST', body: { reason: cancelReason.value } })
    confirmingCancel.value = false
    cancelReason.value = ''
    await loadOrder(true)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    cancelError.value = e.data?.statusMessage || 'Could not cancel the order. Try again.'
    await loadOrder(true)
  }
  finally {
    cancelling.value = false
  }
}

async function loadOrder(silent = false) {
  if (!orderId.value) {
    fetchError.value = 'Invalid order reference.'
    pending.value = false
    order.value = null
    return
  }

  if (!silent) {
    pending.value = true
    fetchError.value = null
  }

  try {
    const response = await api<{ order: BuyerOrderDetail }>(`/api/orders/${orderId.value}`)
    order.value = response?.order ?? null
    if (!order.value) fetchError.value = 'Order not found.'
    else setSubPageTitle(`Order #${order.value.id.slice(0, 8).toUpperCase()}`)
  }
  catch (err: unknown) {
    if (silent) return
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    fetchError.value = e.data?.statusMessage ?? e.statusMessage ?? 'Failed to load this order.'
    order.value = null
  }
  finally {
    pending.value = false
  }
}

onMounted(() => loadOrder())
watch(orderId, () => loadOrder())

// While the order is moving, check every 30 s so status and the delivery QR update on their own.
let pollTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  pollTimer = setInterval(() => {
    const status = order.value?.status
    if (!document.hidden && ['pending', 'processing', 'ready_for_pickup', 'out_for_delivery'].includes(status ?? '')) {
      loadOrder(true)
    }
  }, 30000)
})
onBeforeUnmount(() => clearInterval(pollTimer))

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

useHead({ title: computed(() => (order.value ? `Order #${shortId.value} — NFWM Farmers to Market` : 'Order — NFWM Farmers to Market')) })
</script>

<style scoped>
.card {
  @apply rounded-2xl bg-white p-5 ring-1 ring-gray-100 md:p-6;
}
.card-title {
  @apply text-base font-semibold text-shop-ink;
}
.btn-primary {
  @apply inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-farm-leaf px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-farm-deep;
}
.btn-cancel {
  @apply inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50;
}
.btn-cancel-solid {
  @apply inline-flex flex-1 items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60;
}
.btn-outline {
  @apply inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-shop-ink transition hover:border-farm-leaf hover:text-farm-leaf;
}
</style>
