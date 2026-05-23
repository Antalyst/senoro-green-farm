<template>
  <div v-if="order" class="max-w-page mx-auto w-full px-4 md:px-8 py-8 md:py-12 space-y-8">
    <header class="border-b border-farm-light pb-6">
      <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-1">Order</p>
      <h1 class="text-xl font-light text-farm-dark tracking-tight">#{{ shortId(order.id) }}</h1>
      <p class="text-xs text-farm-dark/50 mt-2">{{ formatDate(order.created_at) }}</p>
      <p class="mt-3 text-sm font-medium" :class="statusColor(order.status)">
        {{ statusLabel }}
      </p>
    </header>

    <section class="border border-farm-light bg-white p-5 md:p-6">
      <p class="text-[10px] uppercase tracking-wider text-farm-dark/40 mb-5">Tracking</p>
      <ol class="relative border-l border-farm-light ml-2 space-y-8">
        <li
          v-for="step in steps"
          :key="step.key"
          class="ml-6 relative"
        >
          <span
            class="absolute -left-[1.65rem] top-0.5 w-3 h-3 rounded-full border-2"
            :class="step.done ? 'bg-farm-leaf border-farm-leaf' : 'bg-white border-gray-300'"
          />
          <p
            class="text-sm font-medium"
            :class="step.done ? 'text-farm-leaf' : 'text-gray-400'"
          >
            {{ step.label }}
          </p>
          <p class="text-xs mt-0.5" :class="step.done ? 'text-farm-dark/60' : 'text-gray-400'">
            {{ step.description }}
          </p>
        </li>
      </ol>
    </section>

    <div
      v-if="showRiderCard"
      class="border border-gray-100 p-4 bg-white flex items-center justify-between"
    >
      <div>
        <p class="text-xs text-gray-400 uppercase tracking-wider">Your courier rider</p>
        <h4 class="font-bold text-farm-dark">{{ order.delivery_rider?.full_name || 'Assigned courier' }}</h4>
        <p class="text-sm text-gray-500">Status: {{ riderStatusText }}</p>
      </div>
      <a
        v-if="riderContactHref"
        :href="riderContactHref"
        class="text-farm-deep font-semibold text-sm border-b border-farm-deep"
      >
        {{ riderContactLabel }}
      </a>
    </div>

    <section class="border border-farm-light divide-y divide-farm-light bg-white">
      <div
        v-for="item in order.order_items ?? []"
        :key="item.id"
        class="flex items-center gap-4 p-4"
      >
        <div class="w-12 h-12 bg-farm-light/50 flex items-center justify-center text-lg flex-shrink-0">
          {{ categoryEmoji(item.products?.category) }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-farm-dark truncate">{{ item.products?.name ?? 'Item' }}</p>
          <p class="text-xs text-farm-dark/45">
            ₱{{ parseFloat(String(item.price)).toFixed(2) }} × {{ item.quantity }}
          </p>
        </div>
      </div>
    </section>

    <div class="flex items-center justify-between border border-farm-light bg-white p-4">
      <span class="text-xs uppercase tracking-wider text-farm-dark/45">Total paid</span>
      <span class="text-lg font-medium text-farm-leaf tabular-nums">
        ₱{{ parseFloat(String(order.total_amount)).toFixed(2) }}
      </span>
    </div>

    <div v-if="order.addresses" class="border border-farm-light p-4 bg-farm-light/20 text-sm">
      <p class="text-[10px] uppercase tracking-wider text-farm-dark/40 mb-2">Delivery address</p>
      <p class="font-medium text-farm-dark">{{ order.addresses.full_name }}</p>
      <p class="text-xs text-farm-dark/55 mt-1">{{ order.addresses.phone_number }}</p>
      <p class="text-xs text-farm-dark/50 mt-2 leading-relaxed">
        {{ order.addresses.detailed_address }}, Brgy. {{ order.addresses.barangay }}, {{ order.addresses.city }}
      </p>
    </div>
  </div>

  <div v-else-if="fetchError" class="max-w-page mx-auto w-full px-4 md:px-8 p-8 text-center text-red-500 text-sm">
    {{ fetchError }}
  </div>

  <div v-else class="max-w-page mx-auto w-full px-4 md:px-8 p-8 text-center text-gray-400 text-sm">
    Loading minimalist tracking timeline…
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'buyer' })

interface BuyerOrderDetail {
  id: string
  status: string
  total_amount: number | string
  created_at: string
  delivery_rider?: { full_name?: string; email?: string } | null
  addresses?: {
    full_name: string
    phone_number: string
    city: string
    barangay: string
    detailed_address: string
  } | null
  order_items?: {
    id: string
    quantity: number
    price: number | string
    products?: { name?: string; category?: string }
  }[]
}

const route = useRoute()
const api = useApiFetch()
const setSubPageTitle = inject<(t: string) => void>('setSubPageTitle', () => {})

const orderId = computed(() => {
  const param = route.params.id
  const raw = Array.isArray(param) ? param[0] : param
  return typeof raw === 'string' ? raw : ''
})

const order = ref<BuyerOrderDetail | null>(null)
const fetchError = ref<string | null>(null)
const pending = ref(true)

const { steps, statusLabel } = useOrderTimeline(computed(() => order.value?.status ?? 'pending'))

const showRiderCard = computed(() =>
  ['out_for_delivery', 'delivered'].includes(order.value?.status ?? ''),
)

const riderStatusText = computed(() =>
  order.value?.status === 'delivered' ? 'Delivered' : 'Out for delivery',
)

const riderContactHref = computed(() => {
  const phone = order.value?.addresses?.phone_number
  if (phone) return `tel:${phone.replace(/\s/g, '')}`
  const email = order.value?.delivery_rider?.email
  if (email) return `mailto:${email}`
  return ''
})

const riderContactLabel = computed(() =>
  order.value?.addresses?.phone_number ? 'Contact rider' : 'Email courier',
)

async function loadOrder() {
  if (!orderId.value) {
    fetchError.value = 'Invalid order reference.'
    pending.value = false
    order.value = null
    return
  }

  pending.value = true
  fetchError.value = null

  try {
    const response = await api<{ order: BuyerOrderDetail }>(`/api/orders/${orderId.value}`)
    order.value = response?.order ?? null
    if (!order.value) {
      fetchError.value = 'Order not found.'
    }
    else {
      setSubPageTitle(`Order #${order.value.id.slice(0, 8).toUpperCase()}`)
    }
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    fetchError.value = e.data?.statusMessage ?? e.statusMessage ?? 'Failed to load tracking ledger details.'
    order.value = null
  }
  finally {
    pending.value = false
  }
}

onMounted(loadOrder)
watch(orderId, loadOrder)

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function statusColor(status: string) {
  if (status === 'delivered') return 'text-farm-leaf'
  if (status === 'out_for_delivery') return 'text-farm-deep'
  if (status === 'cancelled') return 'text-red-600'
  return 'text-farm-dark/70'
}

function categoryEmoji(category?: string) {
  const map: Record<string, string> = {
    Vegetables: '🥬', Fruits: '🍎', Organic: '🌱', Herbs: '🌿', Dairy: '🥛', Grains: '🌾',
  }
  return map[category ?? ''] ?? '🌱'
}

useHead({ title: 'Order tracking — Senoro Green Farm' })
</script>
