<template>
  <PageContainer class="space-y-12 py-8 md:py-12">
    <header class="border-b border-farm-light pb-8">
      <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-2">
        Today's run
      </p>
      <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight">
        {{ user?.full_name ?? 'Delivery workspace' }}
      </h1>
      <p class="text-sm text-farm-dark/50 mt-2">Active deliveries and route status</p>
    </header>

    <section class="grid grid-cols-1 sm:grid-cols-3 gap-px bg-farm-light border border-farm-light">
      <div
        v-for="s in summaryStats"
        :key="s.label"
        class="bg-white p-6 md:p-8"
      >
        <p class="text-[10px] font-medium tracking-[0.18em] uppercase text-farm-dark/45 mb-2">
          {{ s.label }}
        </p>
        <p class="text-3xl font-light text-farm-dark tabular-nums">
          {{ s.value }}
        </p>
      </div>
    </section>

    <section class="flex gap-2 overflow-x-auto scrollbar-hide border-b border-farm-light pb-4">
      <button
        v-for="f in statusFilters"
        :key="f.value"
        type="button"
        class="px-4 py-2 text-[10px] font-medium tracking-[0.14em] uppercase whitespace-nowrap border transition-colors flex items-center gap-2"
        :class="activeFilter === f.value
          ? 'border-farm-deep text-farm-deep bg-farm-light/50'
          : 'border-farm-light text-farm-dark/45 hover:border-farm-deep/40'"
        @click="setFilter(f.value)"
      >
        <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="f.dotColor" />
        {{ f.label }}
        <span class="opacity-60">({{ countByStatus(f.value) }})</span>
      </button>
    </section>

    <section class="border border-farm-light">
      <TransitionGroup name="list" tag="div" class="divide-y divide-farm-light">
        <article
          v-for="order in filteredOrders"
          :key="order.id"
          class="bg-white"
        >
          <div class="flex items-center justify-between px-5 py-4 border-b border-farm-light">
            <div class="flex items-center gap-2 min-w-0">
              <Icon name="heroicons:document-text" class="w-4 h-4 text-farm-dark/35 flex-shrink-0 stroke-[1.5]" />
              <span class="text-xs font-medium text-farm-dark truncate">{{ order.id }}</span>
            </div>
            <span
              class="text-[10px] font-medium tracking-wider uppercase px-2 py-1 border flex-shrink-0"
              :class="statusBadge(order.status)"
            >
              {{ order.status }}
            </span>
          </div>

          <div class="px-5 py-4 flex items-start gap-4">
            <div class="w-10 h-10 border border-farm-light flex items-center justify-center flex-shrink-0 text-sm font-medium text-farm-deep">
              {{ order.buyerName.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-farm-dark">{{ order.buyerName }}</p>
              <div class="flex items-center gap-1.5 mt-1">
                <Icon name="heroicons:phone" class="w-3.5 h-3.5 text-farm-dark/35 stroke-[1.5]" />
                <p class="text-xs text-farm-dark/50">{{ order.phone }}</p>
              </div>
            </div>
            <a
              :href="`tel:${order.phone}`"
              class="p-2 border border-farm-light text-farm-deep hover:border-farm-deep transition-colors flex-shrink-0"
              aria-label="Call buyer"
            >
              <Icon name="heroicons:phone" class="w-4 h-4 stroke-[1.5]" />
            </a>
          </div>

          <div class="mx-5 mb-4 border border-farm-light bg-farm-light/30 px-4 py-3 flex items-start gap-2">
            <Icon name="heroicons:map-pin" class="w-4 h-4 text-farm-deep flex-shrink-0 mt-0.5 stroke-[1.5]" />
            <p class="text-xs text-farm-dark/70 leading-relaxed">{{ order.address }}</p>
          </div>

          <div class="flex items-center justify-between px-5 pb-4">
            <div>
              <p class="text-[10px] uppercase tracking-wider text-farm-dark/40">{{ order.items }}</p>
              <p class="text-sm font-medium text-farm-deep tabular-nums mt-1">₱{{ order.total.toFixed(2) }}</p>
            </div>
            <p class="text-xs text-farm-dark/40 tabular-nums">{{ order.time }}</p>
          </div>

          <div class="grid grid-cols-2 border-t border-farm-light divide-x divide-farm-light">
            <button
              type="button"
              class="flex items-center justify-center gap-2 py-3.5 text-xs font-medium tracking-wide uppercase text-farm-dark/60 hover:bg-farm-light/40 transition-colors"
            >
              <Icon name="heroicons:map" class="w-4 h-4 stroke-[1.5]" />
              Navigate
            </button>
            <button
              type="button"
              :class="[
                'flex items-center justify-center gap-2 py-3.5 text-xs font-medium tracking-wide uppercase transition-colors',
                nextActionStyle(order.status),
              ]"
              :disabled="order.status === 'Delivered'"
              @click="advanceStatus(order.id)"
            >
              <Icon :name="nextActionIcon(order.status)" class="w-4 h-4 stroke-[1.5]" />
              {{ nextActionLabel(order.status) }}
            </button>
          </div>
        </article>
      </TransitionGroup>

      <div
        v-if="filteredOrders.length === 0"
        class="p-12 text-center bg-white"
      >
        <Icon name="heroicons:truck" class="w-8 h-8 text-farm-dark/20 mx-auto mb-3 stroke-[1.5]" />
        <p class="text-sm font-medium text-farm-dark">No orders in this status</p>
        <p class="text-xs text-farm-dark/45 mt-1">Try another filter above</p>
      </div>
    </section>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '~/components/ui/PageContainer.vue'

definePageMeta({ layout: 'delivery' })

const { user } = useAuth()

type OrderStatus = 'Pending' | 'Picked Up' | 'In Transit' | 'Delivered'

interface DeliveryOrder {
  id: string
  buyerName: string
  phone: string
  address: string
  items: string
  total: number
  time: string
  status: OrderStatus
}

const activeFilter = ref<'all' | OrderStatus>('all')

const orders = ref<DeliveryOrder[]>([
  {
    id: '#ORD-0041',
    buyerName: 'Maria Santos',
    phone: '0917-123-4567',
    address: 'Blk 12 Lot 4, Sampaguita St., Brgy. Bagong Silang, Caloocan City',
    items: '3 items — Pechay, Kangkong, Tomatoes',
    total: 215.00,
    time: '10:30 AM',
    status: 'Pending',
  },
  {
    id: '#ORD-0039',
    buyerName: 'Jose Reyes',
    phone: '0918-765-4321',
    address: '456 Rizal Ave., Brgy. Poblacion, Marikina City, Metro Manila',
    items: '1 item — Ampalaya (1 kg)',
    total: 60.00,
    time: '9:15 AM',
    status: 'Picked Up',
  },
  {
    id: '#ORD-0037',
    buyerName: 'Ana Cruz',
    phone: '0920-111-2222',
    address: 'Unit 3B, The Residences, Katipunan Ave., Quezon City',
    items: '5 items — Mixed Vegetables Bundle',
    total: 370.00,
    time: '8:00 AM',
    status: 'In Transit',
  },
  {
    id: '#ORD-0035',
    buyerName: 'Pedro Lim',
    phone: '0912-999-8888',
    address: '#78 Mabini St., Brgy. Central, Pasig City',
    items: '2 items — Malunggay, Sigarilyas',
    total: 55.00,
    time: 'Yesterday',
    status: 'Delivered',
  },
])

const statusFilters = [
  { label: 'All', value: 'all' as const, dotColor: 'bg-farm-dark/30' },
  { label: 'Pending', value: 'Pending' as const, dotColor: 'bg-farm-yellow' },
  { label: 'Picked Up', value: 'Picked Up' as const, dotColor: 'bg-blue-400' },
  { label: 'In Transit', value: 'In Transit' as const, dotColor: 'bg-orange-400' },
  { label: 'Delivered', value: 'Delivered' as const, dotColor: 'bg-farm-leaf' },
]

const summaryStats = computed(() => [
  { label: 'Active today', value: orders.value.filter(o => o.status !== 'Delivered').length },
  { label: 'Delivered', value: orders.value.filter(o => o.status === 'Delivered').length },
  { label: 'In transit', value: orders.value.filter(o => o.status === 'In Transit').length },
])

const filteredOrders = computed(() => {
  if (activeFilter.value === 'all') return orders.value
  return orders.value.filter(o => o.status === activeFilter.value)
})

function setFilter(value: 'all' | OrderStatus) {
  activeFilter.value = value
}

function countByStatus(s: string): number {
  if (s === 'all') return orders.value.length
  return orders.value.filter(o => o.status === s).length
}

const STATUS_FLOW: OrderStatus[] = ['Pending', 'Picked Up', 'In Transit', 'Delivered']

function advanceStatus(id: string) {
  const order = orders.value.find(o => o.id === id)
  if (!order) return
  const idx = STATUS_FLOW.indexOf(order.status)
  if (idx < STATUS_FLOW.length - 1) {
    order.status = STATUS_FLOW[idx + 1]
  }
}

function nextActionLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    Pending: 'Pick up',
    'Picked Up': 'Start delivery',
    'In Transit': 'Mark delivered',
    Delivered: 'Completed',
  }
  return map[status]
}

function nextActionIcon(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    Pending: 'heroicons:hand-raised',
    'Picked Up': 'heroicons:truck',
    'In Transit': 'heroicons:check-circle',
    Delivered: 'heroicons:check-badge',
  }
  return map[status]
}

function nextActionStyle(status: OrderStatus): string {
  if (status === 'Delivered') {
    return 'text-farm-leaf bg-farm-light/50 cursor-default'
  }
  return 'text-white bg-farm-deep hover:bg-farm-leaf'
}

function statusBadge(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    Pending: 'border-farm-yellow/60 text-farm-dark bg-farm-yellow/10',
    'Picked Up': 'border-blue-200 text-blue-800 bg-blue-50',
    'In Transit': 'border-orange-200 text-orange-800 bg-orange-50',
    Delivered: 'border-farm-light text-farm-leaf bg-farm-light/50',
  }
  return map[status]
}

useHead({ title: 'Delivery Dashboard — Senoro Green Farm' })
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

.list-enter-active,
.list-leave-active {
  transition: all 0.25s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
