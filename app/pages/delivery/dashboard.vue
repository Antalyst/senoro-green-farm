<template>
  <PageContainer class="space-y-12 py-8 md:py-12">
    <header class="border-b-4 border-farm-dark pb-8">
      <p class="text-[10px] font-bold tracking-[0.2em] uppercase text-market-orange mb-2">
        Logistics Hub
      </p>
      <h1 class="text-3xl md:text-4xl font-black text-farm-dark tracking-tight">
        {{ user?.full_name ?? 'Delivery workspace' }}
      </h1>
      <p class="text-base font-bold text-farm-dark/50 mt-2">Pickup queue and active drop-offs</p>
    </header>

    <div class="flex border-2 border-farm-dark shadow-sm">
      <button
        type="button"
        class="flex-1 py-4 text-xs font-black tracking-[0.15em] uppercase transition-colors"
        :class="activeTab === 'pickup' ? 'bg-farm-dark text-white' : 'bg-white text-farm-dark/60 hover:bg-farm-light/30 hover:text-farm-dark'"
        @click="activeTab = 'pickup'"
      >
        Pickup queue ({{ pickupQueue.length }})
      </button>
      <button
        type="button"
        class="flex-1 py-4 text-xs font-black tracking-[0.15em] uppercase transition-colors border-l-2 border-farm-dark"
        :class="activeTab === 'active' ? 'bg-farm-dark text-white' : 'bg-white text-farm-dark/60 hover:bg-farm-light/30 hover:text-farm-dark'"
        @click="activeTab = 'active'"
      >
        Active deliveries ({{ activeDeliveries.length }})
      </button>
    </div>

    <section v-show="activeTab === 'pickup'" class="border-2 border-farm-dark bg-white shadow-sm">
      <div v-if="pending" class="p-12 text-center text-xs font-bold text-farm-dark/40 uppercase tracking-widest">Loading pickup queue…</div>
      <div v-else-if="!pickupQueue.length" class="p-12 text-center">
        <Icon name="heroicons:truck" class="w-12 h-12 text-farm-dark/20 mx-auto mb-4" />
        <p class="text-lg font-bold text-farm-dark">No orders ready for pickup</p>
        <p class="text-sm font-medium text-farm-dark/60 mt-1">Sellers mark orders ready before they appear here.</p>
      </div>
      <div v-else class="divide-y-2 divide-farm-dark">
        <article v-for="order in pickupQueue" :key="order.id" class="p-5 md:p-8 space-y-6">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-black text-farm-dark tracking-widest uppercase">#{{ shortId(order.id) }}</span>
            <span class="text-[10px] font-bold uppercase tracking-[0.15em] border-2 border-farm-deep text-farm-deep px-3 py-1 bg-farm-light">
              Ready for pickup
            </span>
          </div>
          <DeliveryOrderMeta :order="order" />
          <button
            type="button"
            class="w-full py-4 bg-market-orange text-white text-xs font-black tracking-[0.15em] uppercase hover:bg-[#D35400] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-market-orange/20"
            :disabled="updatingId === order.id"
            @click="updateStatus(order.id, 'out_for_delivery')"
          >
            {{ updatingId === order.id ? 'Assigning…' : 'Pick up order' }}
          </button>
        </article>
      </div>
    </section>

    <section v-show="activeTab === 'active'" class="border-2 border-farm-dark bg-white shadow-sm">
      <div v-if="pending" class="p-12 text-center text-xs font-bold text-farm-dark/40 uppercase tracking-widest">Loading active deliveries…</div>
      <div v-else-if="!activeDeliveries.length" class="p-12 text-center">
        <p class="text-lg font-bold text-farm-dark">No active deliveries</p>
        <p class="text-sm font-medium text-farm-dark/60 mt-1">Pick up orders from the queue to start a route.</p>
      </div>
      <div v-else class="divide-y-2 divide-farm-dark">
        <article v-for="order in activeDeliveries" :key="order.id" class="p-5 md:p-8 space-y-6">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-black text-farm-dark tracking-widest uppercase">#{{ shortId(order.id) }}</span>
            <span class="text-[10px] font-bold uppercase tracking-[0.15em] border-2 border-market-orange text-market-orange px-3 py-1 bg-market-orange/5">
              Out for delivery
            </span>
          </div>
          <DeliveryOrderMeta :order="order" />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              class="w-full py-4 border-2 border-farm-dark text-farm-dark text-xs font-black tracking-[0.15em] uppercase hover:bg-farm-light/40 transition-all duration-300 text-center flex items-center justify-center gap-2"
              @click="openOrderChat(order)"
            >
              <Icon name="heroicons:chat-bubble-left-right" class="w-4 h-4" />
              Message buyer
            </button>
            <button
              type="button"
              class="w-full py-4 bg-farm-leaf text-white text-xs font-black tracking-[0.15em] uppercase hover:bg-farm-deep transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-farm-leaf/20"
              :disabled="updatingId === order.id"
              @click="updateStatus(order.id, 'delivered')"
            >
              {{ updatingId === order.id ? 'Confirming…' : 'Confirm delivery drop-off' }}
            </button>
          </div>
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
  buyer_id?: string | null
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
  shops?: { id: string; shop_name: string; shop_avatar_url: string | null }[]
}

const { user } = useAuth()
const api = useApiFetch()
const triggerChatModal = inject<(orderId: string, receiverId?: string | null, label?: string) => Promise<void>>('triggerChatModal')

function openOrderChat(order: DeliveryOrderRow) {
  const label = order.users?.full_name ? `Chat with ${order.users.full_name}` : 'Chat with buyer'
  triggerChatModal?.(order.id, order.buyer_id ?? null, label)
}

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
