<template>
  <div>
    <!-- Seller Banner -->
    <div class="bg-farm-gradient px-5 pt-5 pb-10">
      <p class="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">Seller Center</p>
      <h2 class="text-white text-xl font-extrabold">{{ user?.full_name }}</h2>

      <!-- Quick Stats Row -->
      <div class="flex gap-3 mt-4">
        <div
          v-for="s in quickStats"
          :key="s.label"
          class="flex-1 bg-white/10 rounded-2xl px-3 py-2.5 text-center"
        >
          <p class="text-white font-extrabold text-lg">{{ s.value }}</p>
          <p class="text-white/60 text-[10px] font-medium leading-tight mt-0.5">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <div class="px-4 -mt-4 space-y-4 pb-24">
      <!-- Product List Header -->
      <div class="farm-card overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 class="font-bold text-gray-900 text-sm">My Products</h3>
          <div class="flex items-center gap-2">
            <!-- Filter -->
            <select
              v-model="statusFilter"
              class="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 outline-none bg-white"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="low">Low Stock</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <!-- Products -->
        <div class="divide-y divide-gray-100">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <!-- Product image -->
            <div
              :class="`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl ${product.bg}`"
            >
              {{ product.emoji }}
            </div>

            <!-- Product info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ product.name }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <p class="text-farm-deep font-bold text-sm">₱{{ product.price.toFixed(2) }}</p>
                <span class="text-gray-400 text-xs">/ {{ product.unit }}</span>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <span :class="`text-[10px] font-bold px-2 py-0.5 rounded-full ${stockBadge(product.stock)}`">
                  {{ product.stock }} in stock
                </span>
                <span :class="`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(product.status)}`">
                  {{ product.status }}
                </span>
              </div>
            </div>

            <!-- Action -->
            <button class="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Icon name="heroicons:ellipsis-vertical" class="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Orders Card -->
      <div class="farm-card overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 class="font-bold text-gray-900 text-sm">Recent Orders</h3>
          <span class="text-xs font-semibold text-farm-leaf bg-farm-light px-2 py-0.5 rounded-full">{{ pendingOrders }} Pending</span>
        </div>
        <div class="divide-y divide-gray-100">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="flex items-center justify-between px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon name="heroicons:shopping-bag" class="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ order.buyer }}</p>
                <p class="text-xs text-gray-500">{{ order.items }} · {{ order.date }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-gray-900">₱{{ order.total.toFixed(2) }}</p>
              <span :class="`text-[10px] font-bold px-2 py-0.5 rounded-full ${orderStatusBadge(order.status)}`">
                {{ order.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FAB: Add Product -->
    <div class="fixed bottom-6 right-5 z-30">
      <button
        class="flex items-center gap-2 bg-farm-deep text-white font-bold px-5 py-3.5 rounded-2xl shadow-farm-glow hover:bg-farm-leaf transition-colors active:scale-95"
      >
        <Icon name="heroicons:plus" class="w-5 h-5" />
        <span class="text-sm">Add Product</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'seller' })

const { user } = useAuth()
const statusFilter = ref('all')

const quickStats = [
  { label: 'Products Listed', value: '12' },
  { label: 'Pending Orders', value: '3' },
  { label: 'Revenue Today', value: '₱1.4k' },
]

const products = ref([
  { id: 1, name: 'Pechay (Bok Choy)', price: 25, unit: 'bundle', stock: 80, status: 'active', emoji: '🥬', bg: 'bg-green-50' },
  { id: 2, name: 'Kangkong', price: 15, unit: 'bundle', stock: 5, status: 'active', emoji: '🌿', bg: 'bg-emerald-50' },
  { id: 3, name: 'Ampalaya (Bitter Gourd)', price: 60, unit: 'kg', stock: 30, status: 'active', emoji: '🥒', bg: 'bg-lime-50' },
  { id: 4, name: 'Kamatis (Tomato)', price: 45, unit: 'kg', stock: 0, status: 'draft', emoji: '🍅', bg: 'bg-red-50' },
  { id: 5, name: 'Sigarilyas', price: 35, unit: 'kg', stock: 12, status: 'active', emoji: '🫛', bg: 'bg-yellow-50' },
])

const filteredProducts = computed(() => {
  if (statusFilter.value === 'all') return products.value
  if (statusFilter.value === 'low') return products.value.filter(p => p.stock > 0 && p.stock < 10)
  return products.value.filter(p => p.status === statusFilter.value)
})

const pendingOrders = computed(() =>
  recentOrders.value.filter(o => o.status === 'Pending').length,
)

const recentOrders = ref([
  { id: 1, buyer: 'Maria Santos', items: '3 items', total: 215, date: 'Today, 9:30 AM', status: 'Pending' },
  { id: 2, buyer: 'Jose Reyes', items: '1 item', total: 60, date: 'Today, 8:15 AM', status: 'Processing' },
  { id: 3, buyer: 'Ana Cruz', items: '5 items', total: 370, date: 'Yesterday', status: 'Delivered' },
])

function stockBadge(stock: number): string {
  if (stock === 0) return 'bg-red-50 text-red-600'
  if (stock < 10) return 'bg-yellow-50 text-yellow-700'
  return 'bg-farm-light text-farm-deep'
}

function statusBadge(status: string): string {
  return status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
}

function orderStatusBadge(status: string): string {
  const map: Record<string, string> = {
    Pending: 'bg-yellow-50 text-yellow-700',
    Processing: 'bg-blue-50 text-blue-700',
    Delivered: 'bg-green-50 text-green-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

useHead({ title: 'Seller Dashboard — Senoro Green Farm' })
</script>
