<template>
  <PageContainer class="space-y-12 py-8 md:py-12">
    <header class="border-b border-farm-light pb-8">
      <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-2">
        Fulfillment
      </p>
      <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight">
        Incoming orders
      </h1>
      <p class="text-sm text-farm-dark/50 mt-2">
        Accept and prepare orders before courier pickup
      </p>
    </header>

    <section v-if="pending" class="p-12 text-center text-xs text-farm-dark/40">
      Loading order ledger…
    </section>

    <section v-else-if="!orders.length" class="border border-farm-light p-12 text-center">
      <p class="text-sm font-medium text-farm-dark">No active orders</p>
      <p class="text-xs text-farm-dark/45 mt-1">New buyer orders appear here until marked ready for pickup.</p>
    </section>

    <section v-else class="space-y-px border border-farm-light">
      <article
        v-for="order in orders"
        :key="order.id"
        class="bg-white p-5 md:p-6 space-y-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-3 border-b border-farm-light pb-4">
          <div>
            <p class="text-[10px] uppercase tracking-wider text-farm-dark/40">Order</p>
            <p class="text-sm font-medium text-farm-dark">#{{ shortId(order.id) }}</p>
            <p class="text-xs text-farm-dark/50 mt-1">{{ formatDate(order.created_at) }}</p>
          </div>
          <span
            class="text-[10px] font-medium tracking-wider uppercase px-2 py-1 border"
            :class="statusChip(order.status)"
          >
            {{ statusLabel(order.status) }}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div class="border border-farm-light p-4 bg-farm-light/20">
            <p class="text-[10px] uppercase tracking-wider text-farm-dark/40 mb-1">Buyer</p>
            <p class="font-medium text-farm-dark">{{ order.buyer?.full_name ?? 'Buyer' }}</p>
            <p class="text-xs text-farm-dark/50">{{ order.buyer?.email }}</p>
          </div>
          <div class="border border-farm-light p-4">
            <p class="text-[10px] uppercase tracking-wider text-farm-dark/40 mb-1">Ship to</p>
            <template v-if="order.address">
              <p class="text-farm-dark">{{ order.address.full_name }}</p>
              <p class="text-xs text-farm-dark/60 mt-1">{{ order.address.phone_number }}</p>
              <p class="text-xs text-farm-dark/50 mt-2 leading-relaxed">
                {{ order.address.detailed_address }}, Brgy. {{ order.address.barangay }}, {{ order.address.city }}
              </p>
            </template>
            <p v-else class="text-xs text-farm-dark/45">No address attached</p>
          </div>
        </div>

        <div class="divide-y divide-farm-light border border-farm-light">
          <div
            v-for="item in order.seller_items"
            :key="item.id"
            class="flex items-center justify-between px-4 py-3 text-sm"
          >
            <div>
              <p class="font-medium text-farm-dark">{{ item.products?.name }}</p>
              <p class="text-xs text-farm-dark/45">{{ item.quantity }} × ₱{{ parseFloat(String(item.price)).toFixed(2) }}</p>
            </div>
            <p class="text-farm-leaf font-medium tabular-nums">
              ₱{{ (Number(item.price) * item.quantity).toFixed(2) }}
            </p>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <span class="text-xs text-farm-dark/45 uppercase tracking-wider">Your subtotal</span>
          <span class="text-lg font-medium text-farm-leaf tabular-nums">₱{{ order.seller_subtotal.toFixed(2) }}</span>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            v-if="order.status === 'pending'"
            type="button"
            class="flex-1 min-w-[200px] py-3 bg-farm-deep text-white text-xs font-medium tracking-[0.12em] uppercase hover:bg-farm-dark disabled:opacity-50"
            :disabled="updatingId === order.id"
            @click="updateStatus(order.id, 'processing')"
          >
            Accept order
          </button>
          <template v-else-if="order.status === 'processing'">
            <button
              v-if="!order.seller_confirmed"
              type="button"
              class="flex-1 min-w-[200px] py-3 bg-farm-leaf text-white text-xs font-medium tracking-[0.12em] uppercase hover:bg-farm-deep disabled:opacity-50"
              :disabled="updatingId === order.id"
              @click="updateStatus(order.id, 'ready_for_pickup')"
            >
              Mark as ready for pickup
            </button>
            <div
              v-else
              class="flex-1 min-w-[200px] py-3 bg-farm-light/35 border border-farm-leaf/40 text-farm-deep text-center text-xs font-medium tracking-[0.12em] uppercase cursor-not-allowed select-none"
            >
              Confirmed (Waiting for other shops)
            </div>
          </template>
        </div>
      </article>
    </section>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '~/components/ui/PageContainer.vue'

definePageMeta({ layout: 'seller' })

interface SellerOrder {
  id: string
  status: string
  total_amount: number
  created_at: string
  seller_subtotal: number
  seller_confirmed?: boolean
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
    pending: 'Pending',
    processing: 'Processing',
    ready_for_pickup: 'Ready for pickup',
  }
  return map[status] ?? status
}

function statusChip(status: string) {
  if (status === 'pending') return 'border-farm-yellow/60 text-farm-dark bg-farm-yellow/10'
  if (status === 'processing') return 'border-farm-leaf/50 text-farm-deep bg-farm-light/50'
  return 'border-farm-light text-farm-dark/60'
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

useHead({ title: 'Seller Orders — Senoro Green Farm' })
</script>
