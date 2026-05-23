<template>
  <PageContainer class="space-y-12 py-8 md:py-12">
    <header class="border-b border-farm-light pb-8">
      <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-2">
        Logistics
      </p>
      <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight">
        {{ user?.full_name ?? 'Delivery workspace' }}
      </h1>
      <p class="text-sm text-farm-dark/50 mt-2">Pickup queue and active drop-offs</p>
    </header>

    <div class="flex border border-farm-light">
      <button
        type="button"
        class="flex-1 py-3 text-[11px] font-medium tracking-[0.12em] uppercase transition-colors"
        :class="activeTab === 'pickup' ? 'bg-farm-deep text-white' : 'bg-white text-farm-dark/50 hover:text-farm-deep'"
        @click="activeTab = 'pickup'"
      >
        Pickup queue ({{ pickupQueue.length }})
      </button>
      <button
        type="button"
        class="flex-1 py-3 text-[11px] font-medium tracking-[0.12em] uppercase transition-colors border-l border-farm-light"
        :class="activeTab === 'active' ? 'bg-farm-deep text-white' : 'bg-white text-farm-dark/50 hover:text-farm-deep'"
        @click="activeTab = 'active'"
      >
        Active deliveries ({{ activeDeliveries.length }})
      </button>
    </div>

    <section v-show="activeTab === 'pickup'" class="border border-farm-light">
      <div v-if="pending" class="p-12 text-center text-xs text-farm-dark/40">Loading pickup queue…</div>
      <div v-else-if="!pickupQueue.length" class="p-12 text-center">
        <Icon name="heroicons:truck" class="w-8 h-8 text-farm-dark/20 mx-auto mb-3 stroke-[1.5]" />
        <p class="text-sm font-medium text-farm-dark">No orders ready for pickup</p>
        <p class="text-xs text-farm-dark/45 mt-1">Sellers mark orders ready before they appear here.</p>
      </div>
      <div v-else class="divide-y divide-farm-light">
        <article v-for="order in pickupQueue" :key="order.id" class="p-5 md:p-6 space-y-4 bg-white">
          <div class="flex items-center justify-between gap-3">
            <span class="text-xs font-medium text-farm-dark">#{{ shortId(order.id) }}</span>
            <span class="text-[10px] uppercase tracking-wider border border-farm-yellow/60 text-farm-dark px-2 py-1 bg-farm-yellow/10">
              Ready for pickup
            </span>
          </div>
          <DeliveryOrderMeta :order="order" />
          <button
            type="button"
            class="w-full py-3 bg-farm-deep text-white text-xs font-medium tracking-[0.12em] uppercase hover:bg-farm-dark disabled:opacity-50"
            :disabled="updatingId === order.id"
            @click="updateStatus(order.id, 'out_for_delivery')"
          >
            {{ updatingId === order.id ? 'Assigning…' : 'Pick up order' }}
          </button>
        </article>
      </div>
    </section>

    <section v-show="activeTab === 'active'" class="border border-farm-light">
      <div v-if="pending" class="p-12 text-center text-xs text-farm-dark/40">Loading active deliveries…</div>
      <div v-else-if="!activeDeliveries.length" class="p-12 text-center">
        <p class="text-sm font-medium text-farm-dark">No active deliveries</p>
        <p class="text-xs text-farm-dark/45 mt-1">Pick up orders from the queue to start a route.</p>
      </div>
      <div v-else class="divide-y divide-farm-light">
        <article v-for="order in activeDeliveries" :key="order.id" class="p-5 md:p-6 space-y-4 bg-white">
          <div class="flex items-center justify-between gap-3">
            <span class="text-xs font-medium text-farm-dark">#{{ shortId(order.id) }}</span>
            <span class="text-[10px] uppercase tracking-wider border border-farm-leaf/50 text-farm-deep px-2 py-1 bg-farm-light/40">
              Out for delivery
            </span>
          </div>
          <DeliveryOrderMeta :order="order" />
          <button
            type="button"
            class="w-full py-3 bg-farm-leaf text-white text-xs font-medium tracking-[0.12em] uppercase hover:bg-farm-deep disabled:opacity-50"
            :disabled="updatingId === order.id"
            @click="updateStatus(order.id, 'delivered')"
          >
            {{ updatingId === order.id ? 'Confirming…' : 'Confirm delivery drop-off' }}
          </button>
        </article>
      </div>
    </section>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '~/components/ui/PageContainer.vue'
import DeliveryOrderMeta from '~/components/delivery/DeliveryOrderMeta.vue'

definePageMeta({ layout: 'delivery' })

interface DeliveryOrderRow {
  id: string
  total_amount: number | string
  status: string
  created_at: string
  addresses?: {
    full_name: string
    phone_number: string
    city: string
    barangay: string
    detailed_address: string
  } | null
  users?: { full_name?: string } | null
  order_items?: { quantity: number; products?: { name?: string } | null }[]
}

const { user } = useAuth()
const api = useApiFetch()

const activeTab = ref<'pickup' | 'active'>('pickup')
const updatingId = ref<string | null>(null)

const { data, pending, refresh } = await useAsyncData(
  'delivery:orders',
  () => api<{ pickup_queue: DeliveryOrderRow[]; active_deliveries: DeliveryOrderRow[] }>('/api/delivery/orders'),
  { server: false },
)

const pickupQueue = computed(() => data.value?.pickup_queue ?? [])
const activeDeliveries = computed(() => data.value?.active_deliveries ?? [])

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

async function updateStatus(orderId: string, status: string) {
  updatingId.value = orderId
  try {
    await api(`/api/orders/${orderId}/status`, { method: 'PATCH', body: { status } })
    await refresh()
    if (status === 'out_for_delivery') activeTab.value = 'active'
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    alert(e.data?.statusMessage || 'Failed to update order')
  }
  finally {
    updatingId.value = null
  }
}

useHead({ title: 'Delivery Dashboard — Senoro Green Farm' })
</script>
