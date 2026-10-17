<template>
  <div class="mx-auto w-full max-w-page space-y-5 py-6 md:space-y-6 md:py-8">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-gray-500">Accept and pack orders before a rider picks them up.</p>
      <button type="button" class="ui-link flex-shrink-0" :disabled="pending" @click="refresh()">
        {{ pending ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="pending && !orders.length" class="ui-card py-16 text-center text-sm text-gray-400">Loading…</p>

    <div v-else-if="!orders.length" class="ui-card py-16 text-center">
      <p class="text-sm font-medium text-shop-ink">No active orders</p>
      <p class="mt-1 text-xs text-gray-400">New orders appear here until a rider picks them up.</p>
    </div>

    <ul v-else class="space-y-4">
      <li v-for="order in orders" :key="order.id" class="ui-card overflow-hidden">
        <!-- Top row -->
        <div class="ui-card-head items-start">
          <div>
            <p class="text-sm font-semibold text-farm-deep">Order #{{ shortId(order.id) }}</p>
            <p class="text-xs text-gray-400">{{ formatDate(order.created_at) }}</p>
          </div>
          <span class="flex-shrink-0" :class="statusClass(order.status)">
            {{ statusLabel(order.status) }}
          </span>
        </div>

        <div class="space-y-4 px-4 py-4 md:px-5">
          <!-- Buyer + address -->
          <div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <p class="text-xs text-gray-400">Buyer</p>
              <p class="mt-0.5 text-shop-ink">{{ order.buyer?.full_name ?? 'Buyer' }}</p>
              <p v-if="order.buyer?.email" class="truncate text-xs text-gray-500">{{ order.buyer.email }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Deliver to</p>
              <template v-if="order.address">
                <p class="mt-0.5 text-shop-ink">
                  {{ order.address.full_name }}
                  <a :href="`tel:${order.address.phone_number}`" class="text-farm-leaf">{{ order.address.phone_number }}</a>
                </p>
                <p class="text-xs leading-relaxed text-gray-500">
                  {{ order.address.detailed_address }}, Brgy. {{ order.address.barangay }}, {{ order.address.city }}
                </p>
              </template>
              <p v-else class="mt-0.5 text-xs text-gray-400">No address attached</p>
            </div>
          </div>

          <!-- Items -->
          <ul class="divide-y divide-farm-leaf/10 rounded border border-farm-leaf/15">
            <li v-for="item in order.seller_items" :key="item.id" class="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <div class="min-w-0">
                <p class="truncate text-shop-ink">{{ orderItemName(item) }}</p>
                <p class="text-xs text-gray-400">{{ item.quantity }} × ₱{{ Number(item.price).toFixed(2) }}</p>
              </div>
              <p class="flex-shrink-0 tabular-nums text-shop-ink">₱{{ (Number(item.price) * item.quantity).toFixed(2) }}</p>
            </li>
          </ul>

          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">Your subtotal</span>
            <span class="text-base font-semibold tabular-nums text-farm-leaf">₱{{ order.seller_subtotal.toFixed(2) }}</span>
          </div>

          <!-- Packed: where the pickup stands -->
          <template v-if="order.seller_confirmed">
            <p class="flex items-center gap-2 rounded bg-farm-light px-3 py-2.5 text-sm text-farm-deep">
              <Icon :name="pickupState(order).icon" class="h-4 w-4 flex-shrink-0 text-farm-leaf" />
              {{ pickupState(order).label }}
            </p>
            <div
              v-if="order.pickup_code && !order.seller_picked_up"
              class="flex items-center justify-between gap-3 rounded border border-farm-leaf/15 px-3 py-2.5"
              title="Give this code to the rider if the receipt QR cannot be scanned"
            >
              <span class="text-sm text-gray-500">Pickup code</span>
              <span class="font-mono text-lg font-semibold tracking-[0.15em] text-market-orange">{{ order.pickup_code }}</span>
            </div>
          </template>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-2 border-t border-farm-leaf/15 px-4 py-3 sm:flex-row sm:justify-end md:px-5">
          <button
            v-if="order.status === 'pending'"
            type="button"
            class="ui-btn-accent w-full sm:w-auto"
            :disabled="updatingId === order.id"
            @click="updateStatus(order.id, 'processing')"
          >
            {{ updatingId === order.id ? 'Saving…' : 'Accept order' }}
          </button>
          <button
            v-else-if="order.status === 'processing' && !order.seller_confirmed"
            type="button"
            class="ui-btn w-full sm:w-auto"
            :disabled="updatingId === order.id"
            @click="markReady(order.id)"
          >
            <Icon name="heroicons:printer" class="h-4 w-4" />
            {{ updatingId === order.id ? 'Saving…' : 'Mark ready & print receipt' }}
          </button>
          <NuxtLink
            v-else-if="order.seller_confirmed"
            :to="`/seller/receipt/${order.id}`"
            class="ui-btn-outline w-full sm:w-auto"
          >
            <Icon name="heroicons:qr-code" class="h-4 w-4" />
            Receipt
          </NuxtLink>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'seller' })

interface SellerOrder {
  id: string
  status: string
  total_amount: number
  created_at: string
  seller_subtotal: number
  seller_confirmed?: boolean
  seller_picked_up?: boolean
  pickup_code?: string | null
  delivery_rider?: { full_name?: string } | null
  buyer?: { full_name?: string; email?: string }
  address?: {
    full_name: string
    phone_number: string
    city: string
    barangay: string
    detailed_address: string
  } | null
  seller_items: {
    id: string
    quantity: number
    price: number
    products?: { name?: string }
  }[]
}

const api = useApiFetch()
const router = useRouter()
const updatingId = ref<string | null>(null)

const { data, pending, refresh } = await useAsyncData(
  'seller:fulfillment-orders',
  () => api<{ orders: SellerOrder[] }>('/api/seller/orders'),
  { server: false },
)

const orders = computed(() => data.value?.orders ?? [])

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'New',
    processing: 'Preparing',
    ready_for_pickup: 'Ready for pickup',
  }
  return map[status] ?? status
}

function statusClass(status: string) {
  if (status === 'pending') return 'ui-pill ui-pill-orange'
  if (status === 'processing') return 'ui-pill ui-pill-green'
  return 'ui-pill ui-pill-gray'
}

function pickupState(order: SellerOrder) {
  if (order.seller_picked_up) return { icon: 'heroicons:check-circle', label: 'Picked up by rider' }
  if (order.status === 'processing') return { icon: 'heroicons:clock', label: 'Packed. Waiting for the other shops in this order.' }
  if (order.delivery_rider?.full_name) return { icon: 'heroicons:truck', label: `${order.delivery_rider.full_name} is coming to pick up` }
  return { icon: 'heroicons:clock', label: 'Packed. Waiting for a rider to accept.' }
}

// Marks this shop's items ready, then opens the receipt with its pickup QR for printing.
async function markReady(orderId: string) {
  updatingId.value = orderId
  try {
    await api(`/api/orders/${orderId}/status`, { method: 'PATCH', body: { status: 'ready_for_pickup' } })
    await router.push({ path: `/seller/receipt/${orderId}`, query: { print: '1' } })
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    alert(e.data?.statusMessage || 'Failed to update order')
  }
  finally {
    updatingId.value = null
  }
}

async function updateStatus(orderId: string, status: string) {
  updatingId.value = orderId
  try {
    await api(`/api/orders/${orderId}/status`, { method: 'PATCH', body: { status } })
    await refresh()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    alert(e.data?.statusMessage || 'Failed to update order')
  }
  finally {
    updatingId.value = null
  }
}

useHead({ title: 'Orders — NFWM Seller' })
</script>
