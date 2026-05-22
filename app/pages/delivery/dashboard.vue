<template>
  <div class="pb-6">
    <!-- Header Stats -->
    <div class="bg-farm-gradient px-5 pt-5 pb-8">
      <p class="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">Today's Run</p>
      <h2 class="text-white text-xl font-extrabold">{{ user?.full_name }}</h2>

      <div class="flex gap-3 mt-4">
        <div
          v-for="s in summaryStats"
          :key="s.label"
          class="flex-1 bg-white/10 rounded-2xl px-3 py-2.5 text-center"
        >
          <p class="text-white font-extrabold text-xl">{{ s.value }}</p>
          <p class="text-white/60 text-[10px] font-medium leading-tight mt-0.5">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <div class="px-4 -mt-4 space-y-3">
      <!-- Filter Tabs -->
      <div class="farm-card px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        <button
          v-for="f in statusFilters"
          :key="f.value"
          :class="[
            'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all',
            activeFilter === f.value
              ? 'bg-farm-deep text-white shadow-sm'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
          ]"
          @click="activeFilter = f.value"
        >
          <span :class="`w-1.5 h-1.5 rounded-full ${f.dotColor}`" />
          {{ f.label }}
          <span class="ml-0.5 opacity-70">({{ countByStatus(f.value) }})</span>
        </button>
      </div>

      <!-- Order Cards -->
      <div class="space-y-3">
        <TransitionGroup name="list">
          <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="farm-card overflow-hidden"
          >
            <!-- Order header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div class="flex items-center gap-2">
                <Icon name="heroicons:document-text" class="w-4 h-4 text-gray-400" />
                <span class="text-xs font-bold text-gray-600">{{ order.id }}</span>
              </div>
              <span :class="`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${statusBadge(order.status)}`">
                {{ order.status }}
              </span>
            </div>

            <!-- Buyer info -->
            <div class="flex items-start gap-3 px-4 pt-3">
              <div class="w-10 h-10 rounded-full bg-farm-gradient flex items-center justify-center flex-shrink-0">
                <span class="text-white font-bold text-sm">{{ order.buyerName.charAt(0) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 text-sm">{{ order.buyerName }}</p>
                <div class="flex items-center gap-1 mt-0.5">
                  <Icon name="heroicons:phone" class="w-3 h-3 text-gray-400" />
                  <p class="text-xs text-gray-500">{{ order.phone }}</p>
                </div>
              </div>
              <a :href="`tel:${order.phone}`" class="p-2 rounded-xl bg-farm-light flex-shrink-0">
                <Icon name="heroicons:phone-solid" class="w-4 h-4 text-farm-deep" />
              </a>
            </div>

            <!-- Address -->
            <div class="flex items-start gap-2 px-4 py-2 mx-4 my-2 bg-gray-50 rounded-xl">
              <Icon name="heroicons:map-pin-solid" class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p class="text-xs text-gray-600 leading-relaxed">{{ order.address }}</p>
            </div>

            <!-- Items summary -->
            <div class="flex items-center justify-between px-4 pb-3">
              <div>
                <p class="text-xs text-gray-400 font-medium">{{ order.items }}</p>
                <p class="text-sm font-extrabold text-gray-900 mt-0.5">₱{{ order.total.toFixed(2) }}</p>
              </div>
              <p class="text-xs text-gray-400">{{ order.time }}</p>
            </div>

            <!-- Action buttons -->
            <div class="border-t border-gray-100 grid grid-cols-2 divide-x divide-gray-100">
              <button
                class="flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Icon name="heroicons:map" class="w-4 h-4" />
                Navigate
              </button>
              <button
                :class="[
                  'flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors',
                  nextActionStyle(order.status),
                ]"
                :disabled="order.status === 'Delivered'"
                @click="advanceStatus(order.id)"
              >
                <Icon :name="nextActionIcon(order.status)" class="w-4 h-4" />
                {{ nextActionLabel(order.status) }}
              </button>
            </div>
          </div>
        </TransitionGroup>

        <!-- Empty state -->
        <div v-if="filteredOrders.length === 0" class="text-center py-16">
          <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Icon name="heroicons:truck" class="w-8 h-8 text-gray-300" />
          </div>
          <p class="text-gray-500 font-semibold text-sm">No orders in this status</p>
          <p class="text-gray-400 text-xs mt-1">Check another filter above</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  { label: 'All',        value: 'all',        dotColor: 'bg-gray-400' },
  { label: 'Pending',    value: 'Pending',    dotColor: 'bg-yellow-400' },
  { label: 'Picked Up',  value: 'Picked Up',  dotColor: 'bg-blue-400' },
  { label: 'In Transit', value: 'In Transit', dotColor: 'bg-orange-400' },
  { label: 'Delivered',  value: 'Delivered',  dotColor: 'bg-green-400' },
]

const summaryStats = computed(() => [
  { label: 'Total Today',  value: orders.value.filter(o => o.status !== 'Delivered').length },
  { label: 'Delivered',    value: orders.value.filter(o => o.status === 'Delivered').length },
  { label: 'In Transit',   value: orders.value.filter(o => o.status === 'In Transit').length },
])

const filteredOrders = computed(() => {
  if (activeFilter.value === 'all') return orders.value
  return orders.value.filter(o => o.status === activeFilter.value)
})

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
    'Pending': 'Pick Up',
    'Picked Up': 'Start Delivery',
    'In Transit': 'Mark Delivered',
    'Delivered': 'Completed ✓',
  }
  return map[status]
}

function nextActionIcon(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    'Pending': 'heroicons:hand-raised',
    'Picked Up': 'heroicons:truck',
    'In Transit': 'heroicons:check-circle',
    'Delivered': 'heroicons:check-badge',
  }
  return map[status]
}

function nextActionStyle(status: OrderStatus): string {
  if (status === 'Delivered') return 'text-green-500 bg-green-50 cursor-default'
  return 'text-white bg-farm-deep hover:bg-farm-leaf'
}

function statusBadge(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    'Pending':    'bg-yellow-50 text-yellow-700',
    'Picked Up':  'bg-blue-50 text-blue-700',
    'In Transit': 'bg-orange-50 text-orange-700',
    'Delivered':  'bg-green-50 text-green-700',
  }
  return map[status]
}

useHead({ title: 'Delivery Dashboard — Senoro Green Farm' })
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(-10px); }
</style>
