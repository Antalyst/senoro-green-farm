<template>
  <div class="mx-auto max-w-3xl px-4 pb-12 pt-4">
    <!-- Summary -->
    <section class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-farm-leaf to-farm-deep p-5 text-white">
      <div class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" aria-hidden="true" />
      <div class="relative flex items-start justify-between gap-3">
        <div>
          <p class="text-sm text-white/75">{{ greeting }},</p>
          <h1 class="text-xl font-bold tracking-tight">{{ firstName }}</h1>
        </div>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium ring-1 ring-white/20 transition hover:bg-white/25 disabled:opacity-60"
          :disabled="pending"
          @click="reload"
        >
          <Icon name="heroicons:arrow-path" class="h-4 w-4" :class="pending ? 'animate-spin' : ''" />
          {{ pending ? 'Updating' : updatedLabel }}
        </button>
      </div>

      <div class="relative mt-5 grid grid-cols-2 gap-3">
        <button type="button" class="stat" @click="activeTab = 'pickup'">
          <span class="text-2xl font-bold tabular-nums">{{ pickupQueue.length }}</span>
          <span class="text-xs text-white/75">Ready for pickup</span>
        </button>
        <button type="button" class="stat" @click="activeTab = 'active'">
          <span class="text-2xl font-bold tabular-nums">{{ activeDeliveries.length }}</span>
          <span class="text-xs text-white/75">My jobs</span>
        </button>
      </div>
    </section>

    <!-- Tabs (stick to the top while scrolling) -->
    <div class="sticky top-0 z-10 -mx-4 bg-[#f6f7f6] px-4 py-3">
      <div class="grid grid-cols-2 gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-black/5" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.key"
          class="flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition"
          :class="activeTab === tab.key ? 'bg-farm-leaf text-white shadow-sm' : 'text-gray-500'"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span
            class="min-w-[22px] rounded-full px-1.5 text-xs tabular-nums"
            :class="activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100'"
          >
            {{ tab.key === 'pickup' ? pickupQueue.length : activeDeliveries.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending && !data" class="space-y-4">
      <div v-for="n in 2" :key="n" class="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-black/5" />
    </div>

    <!-- Load error -->
    <div v-else-if="error && !data" class="empty">
      <Icon name="heroicons:wifi" class="h-10 w-10 text-gray-300" />
      <p class="mt-3 font-medium text-shop-ink">Could not load jobs</p>
      <p class="mt-1 text-sm text-gray-500">Check your connection and try again.</p>
      <button type="button" class="mt-4 rounded-full bg-farm-leaf px-5 py-2.5 text-sm font-semibold text-white" @click="reload">Try again</button>
    </div>

    <!-- Pickup queue -->
    <template v-else-if="activeTab === 'pickup'">
      <div v-if="!pickupQueue.length" class="empty">
        <span class="flex h-16 w-16 items-center justify-center rounded-full bg-shop-mint text-farm-leaf">
          <Icon name="heroicons:inbox" class="h-8 w-8" />
        </span>
        <p class="mt-4 font-medium text-shop-ink">No jobs right now</p>
        <p class="mt-1 max-w-xs text-sm text-gray-500">Orders show up here when all their shops have packed them. This list updates by itself.</p>
      </div>
      <div v-else class="space-y-4">
        <DeliveryJobCard v-for="order in pickupQueue" :key="order.id" :order="order">
          <template #actions>
            <button
              type="button"
              class="btn-main bg-farm-leaf hover:bg-farm-deep"
              :disabled="updatingId === order.id"
              @click="acceptJob(order.id)"
            >
              <Icon :name="updatingId === order.id ? 'heroicons:arrow-path' : 'heroicons:hand-raised'" class="h-5 w-5" :class="updatingId === order.id ? 'animate-spin' : ''" />
              {{ updatingId === order.id ? 'Accepting…' : 'Accept job' }}
            </button>
          </template>
        </DeliveryJobCard>
      </div>
    </template>

    <!-- Active deliveries -->
    <template v-else>
      <div v-if="!activeDeliveries.length" class="empty">
        <span class="flex h-16 w-16 items-center justify-center rounded-full bg-shop-mint text-farm-leaf">
          <Icon name="heroicons:truck" class="h-8 w-8" />
        </span>
        <p class="mt-4 font-medium text-shop-ink">No active deliveries</p>
        <p class="mt-1 max-w-xs text-sm text-gray-500">Accept a job from the pickup queue, then scan the shop receipt QR.</p>
        <button type="button" class="mt-4 text-sm font-semibold text-farm-leaf" @click="activeTab = 'pickup'">See pickup queue</button>
      </div>
      <div v-else class="space-y-4">
        <DeliveryJobCard v-for="order in activeDeliveries" :key="order.id" :order="order">
          <template #actions>
            <!-- Where this job stands -->
            <p class="mb-2.5 flex items-center gap-2 px-1 text-xs font-medium" :class="stage(order).tone">
              <Icon :name="stage(order).icon" class="h-4 w-4 flex-shrink-0" />
              {{ stage(order).label }}
            </p>
            <div class="flex gap-2">
              <button
                type="button"
                class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:border-farm-leaf hover:text-farm-leaf"
                aria-label="Message buyer"
                @click="openOrderChat(order)"
              >
                <Icon name="heroicons:chat-bubble-left-right" class="h-5 w-5" />
              </button>
              <button
                type="button"
                class="btn-main"
                :class="order.status === 'out_for_delivery' ? 'bg-farm-deep hover:bg-farm-dark' : 'bg-market-orange hover:brightness-95'"
                @click="openScanner(order, false)"
              >
                <Icon name="heroicons:qr-code" class="h-5 w-5" />
                Scan QR
              </button>
              <button
                type="button"
                class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold ring-2 ring-inset transition active:scale-[0.99]"
                :class="order.status === 'out_for_delivery' ? 'text-farm-deep ring-farm-deep' : 'text-market-orange ring-market-orange'"
                @click="openScanner(order, true)"
              >
                <Icon name="heroicons:key" class="h-5 w-5" />
                Enter code
              </button>
            </div>
          </template>
        </DeliveryJobCard>
      </div>
    </template>

    <DeliveryQrScannerModal
      :open="scanner.open"
      :manual-only="scanner.manual"
      :title="scannerTitle"
      :subtitle="scanner.order ? `Order #${scanner.order.id.slice(0, 8).toUpperCase()}` : ''"
      :hint="scannerHint"
      :busy="scanner.busy"
      :error="scanner.error"
      @close="scanner.open = false"
      @detected="text => submitScan({ payload: text })"
      @manual="code => submitScan({ code })"
    />

    <BuyerToast :show="toast.show" :message="toast.message" :type="toast.type" @close="toast.show = false" />
  </div>
</template>

<script setup lang="ts">
import type { DeliveryOrder } from '~/components/delivery/DeliveryJobCard.vue'

definePageMeta({ layout: 'delivery' })

type TabKey = 'pickup' | 'active'

const { user } = useAuth()
const api = useApiFetch()
const route = useRoute()
const triggerChatModal = inject<(orderId: string, receiverId?: string | null, label?: string) => Promise<void>>('triggerChatModal')

const tabs: { key: TabKey; label: string }[] = [
  { key: 'pickup', label: 'Pickup queue' },
  { key: 'active', label: 'My deliveries' },
]

const activeTab = ref<TabKey>(route.query.tab === 'active' ? 'active' : 'pickup')
const updatingId = ref<string | null>(null)
const lastUpdated = ref<number | null>(null)
const now = ref(Date.now())

const { data, pending, error, refresh } = await useAsyncData(
  'delivery:orders',
  async () => {
    const res = await api<{ pickup_queue: DeliveryOrder[]; active_deliveries: DeliveryOrder[] }>('/api/delivery/orders')
    lastUpdated.value = Date.now()
    return res
  },
  { server: false },
)

const pickupQueue = computed(() => data.value?.pickup_queue ?? [])
const activeDeliveries = computed(() => data.value?.active_deliveries ?? [])

const firstName = computed(() => user.value?.full_name?.split(' ')[0] || 'Rider')
const greeting = computed(() => {
  const h = new Date(now.value).getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})
const updatedLabel = computed(() => {
  if (!lastUpdated.value) return 'Refresh'
  const s = Math.round((now.value - lastUpdated.value) / 1000)
  return s < 60 ? 'Updated just now' : `Updated ${Math.round(s / 60)} min ago`
})

function reload() {
  return refresh()
}

function openOrderChat(order: DeliveryOrder) {
  const label = order.addresses?.full_name || order.users?.full_name
  triggerChatModal?.(order.id, order.buyer_id ?? null, label ? `Chat with ${label}` : 'Chat with buyer')
}

// Step 1: claim the job. The order stays "ready for pickup" until the shop QR is scanned.
async function acceptJob(orderId: string) {
  updatingId.value = orderId
  try {
    await api(`/api/delivery/orders/${orderId}/accept`, { method: 'POST' })
    await refresh()
    activeTab.value = 'active'
    showToast('Job accepted. Go to the shop and scan the receipt QR.')
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    showToast(e.data?.statusMessage || 'Could not accept the job. Try again.', 'error')
    await refresh()
  }
  finally {
    updatingId.value = null
  }
}

function stage(order: DeliveryOrder) {
  if (order.status === 'out_for_delivery') {
    return { icon: 'heroicons:truck', label: 'All packages picked up — at the buyer, scan their QR or enter their code', tone: 'text-farm-deep' }
  }
  const shops = order.shops ?? []
  const done = shops.filter(s => s.picked_up).length
  return {
    icon: 'heroicons:building-storefront',
    label: shops.length > 1 ? `Pick up at the shops — ${done} of ${shops.length} scanned` : 'Go to the shop — scan the receipt QR or enter its code',
    tone: 'text-market-orange',
  }
}

// Steps 2 and 3: scan the shop receipt QR (pickup) and the buyer's QR (delivery).
// Riders can scan the QR or type its 8-character code (receipts can get torn or wet on the road).
const scanner = reactive({ open: false, manual: false, busy: false, error: null as string | null, order: null as DeliveryOrder | null })
const scanMode = computed(() => (scanner.order?.status === 'out_for_delivery' ? 'delivery' : 'pickup'))

const scannerTitle = computed(() => {
  if (scanMode.value === 'delivery') return scanner.manual ? 'Enter buyer\'s code' : 'Scan buyer\'s QR'
  return scanner.manual ? 'Enter pickup code' : 'Scan pickup QR'
})

const scannerHint = computed(() => {
  if (scanMode.value === 'delivery') {
    return scanner.manual
      ? 'Ask the buyer for the 8-character code under the delivery QR on their order page.'
      : 'Ask the buyer to open the order on their phone and show the delivery QR.'
  }
  return scanner.manual
    ? 'Type the code printed under the QR on the shop receipt. If the receipt is damaged, ask the shop: it is also on their Orders page.'
    : 'Point the camera at the QR on the shop\'s receipt.'
})

function openScanner(order: DeliveryOrder, manual: boolean) {
  scanner.order = order
  scanner.manual = manual
  scanner.error = null
  scanner.open = true
}

async function submitScan(input: { payload?: string; code?: string }) {
  if (!scanner.order || scanner.busy) return
  scanner.busy = true
  scanner.error = null
  try {
    const res = await api<{ stage: 'pickup' | 'delivery'; shop_name?: string; already_scanned?: boolean; remaining_shops?: number }>(
      '/api/delivery/scan',
      { method: 'POST', body: { order_id: scanner.order.id, ...input } },
    )
    scanner.open = false
    if (res.stage === 'delivery') showToast('Delivered! Order complete. 🎉')
    else if (res.already_scanned) showToast(`${res.shop_name} was already scanned.`)
    else if (res.remaining_shops) showToast(`Picked up from ${res.shop_name}. ${res.remaining_shops} more shop${res.remaining_shops > 1 ? 's' : ''} to go.`)
    else showToast('All packages picked up. Deliver to the buyer!')
    await refresh()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    scanner.error = e.data?.statusMessage || 'Could not check this code. Try again.'
  }
  finally {
    scanner.busy = false
  }
}

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })
let toastTimer: ReturnType<typeof setTimeout> | undefined
function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value.show = false }, 3500)
}

// Keep the list fresh: every 30 s while the app is open, and when the rider comes back to it.
let pollTimer: ReturnType<typeof setInterval> | undefined
function onVisible() {
  if (!document.hidden) refresh()
}

// Notification taps link here with ?tab=pickup&at=<time>.
watch(() => route.query.at, () => {
  if (route.query.tab === 'pickup' || route.query.tab === 'active') activeTab.value = route.query.tab
  refresh()
})

onMounted(() => {
  refresh()
  pollTimer = setInterval(() => {
    now.value = Date.now()
    if (!document.hidden && !updatingId.value) refresh()
  }, 30000)
  document.addEventListener('visibilitychange', onVisible)
})

onBeforeUnmount(() => {
  clearInterval(pollTimer)
  clearTimeout(toastTimer)
  document.removeEventListener('visibilitychange', onVisible)
})

useHead({ title: 'Rider — NFWM' })
</script>

<style scoped>
.stat {
  @apply flex flex-col items-start rounded-xl bg-white/10 px-4 py-3 text-left ring-1 ring-white/15 transition hover:bg-white/15;
}
.btn-main {
  @apply flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60;
}
.empty {
  @apply flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-black/5;
}
</style>
