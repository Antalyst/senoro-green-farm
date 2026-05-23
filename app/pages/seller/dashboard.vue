<template>
  <PageContainer class="space-y-12 py-8 md:py-12">
      <header class="border-b border-farm-light pb-8">
        <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-2">
          Seller analytics
        </p>
        <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight">
          {{ user?.full_name ?? 'Seller workspace' }}
        </h1>
      </header>

      <!-- Executive metrics matrix -->
      <section class="grid grid-cols-1 md:grid-cols-3 border border-farm-light divide-y md:divide-y-0 md:divide-x divide-farm-light">
        <div class="p-6 md:p-8 bg-white">
          <p class="text-[10px] font-medium tracking-[0.18em] uppercase text-farm-dark/45 mb-2">Total revenue</p>
          <p class="text-3xl font-light text-farm-dark tabular-nums">
            ₱{{ (metrics?.totalRevenue ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
          </p>
          <p class="text-[11px] text-farm-leaf mt-2">Lifetime store earnings</p>
        </div>
        <div class="p-6 md:p-8 bg-white">
          <p class="text-[10px] font-medium tracking-[0.18em] uppercase text-farm-dark/45 mb-2">Orders fulfilled</p>
          <p class="text-3xl font-light text-farm-dark tabular-nums">
            {{ metrics?.totalOrders ?? 0 }}
          </p>
          <p class="text-[11px] text-farm-dark/40 mt-2">Unique checkout events</p>
        </div>
        <div class="p-6 md:p-8 bg-white">
          <p class="text-[10px] font-medium tracking-[0.18em] uppercase text-farm-dark/45 mb-2">Active listings</p>
          <p class="text-3xl font-light text-farm-dark tabular-nums">
            {{ productsData?.products?.length ?? 0 }}
          </p>
          <p class="text-[11px] text-farm-dark/40 mt-2">Products in catalog</p>
        </div>
      </section>

      <!-- Revenue chart -->
      <section class="border border-farm-light p-6 md:p-8">
        <div class="flex items-end justify-between mb-6">
          <div>
            <h2 class="text-lg font-light text-farm-dark tracking-tight">
              Monthly store revenue
            </h2>
            <p class="text-xs text-farm-dark/45 mt-1">Trailing six-month performance</p>
          </div>
        </div>
        <ClientOnly>
          <FarmChart
            v-if="sellerChartOptions"
            :options="sellerChartOptions"
            :height="300"
          />
          <template #fallback>
            <div class="h-[300px] flex items-center justify-center border border-farm-light bg-farm-light/20">
              <span class="text-[11px] text-farm-dark/40 tracking-wide">Loading chart…</span>
            </div>
          </template>
        </ClientOnly>
      </section>

      <!-- Quick navigation -->
      <section class="grid grid-cols-3 gap-px bg-farm-light border border-farm-light">
        <button
          v-for="link in quickLinks"
          :key="link.path"
          type="button"
          class="bg-white py-6 px-4 text-center hover:bg-farm-light/40 transition-colors"
          @click="router.push(link.path)"
        >
          <Icon :name="link.icon" class="w-5 h-5 text-farm-deep mx-auto mb-2 stroke-[1.5]" />
          <span class="text-[10px] font-medium tracking-[0.14em] uppercase text-farm-dark">{{ link.label }}</span>
        </button>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <!-- Order ledger -->
        <section class="border border-farm-light">
          <div class="px-5 py-4 border-b border-farm-light flex items-center justify-between">
            <h2 class="text-sm font-medium text-farm-dark tracking-tight">Recent sales</h2>
            <span class="text-[10px] text-farm-dark/40 uppercase tracking-wider">
              {{ metrics?.items?.length ?? 0 }} line items
            </span>
          </div>

          <div v-if="metricsPending" class="p-8 text-center text-xs text-farm-dark/40">Loading…</div>
          <div v-else-if="!recentSales.length" class="p-8 text-center text-xs text-farm-dark/40">
            No sales recorded yet.
          </div>
          <table v-else class="w-full text-left">
            <thead>
              <tr class="border-b border-farm-light text-[10px] uppercase tracking-wider text-farm-dark/40">
                <th class="px-5 py-3 font-medium">Order</th>
                <th class="px-5 py-3 font-medium">Date</th>
                <th class="px-5 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-farm-light">
              <tr
                v-for="(item, idx) in recentSales"
                :key="idx"
                class="hover:bg-farm-light/50 transition-colors"
              >
                <td class="px-5 py-4">
                  <p class="text-sm text-farm-dark font-medium">{{ item.quantity }} units sold</p>
                  <span
                    class="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border border-farm-light text-farm-leaf"
                  >
                    fulfilled
                  </span>
                </td>
                <td class="px-5 py-4 text-xs text-farm-dark/50 tabular-nums">
                  {{ formatDate(item.created_at) }}
                </td>
                <td class="px-5 py-4 text-sm text-farm-leaf font-medium text-right tabular-nums">
                  ₱{{ (item.price * item.quantity).toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Product inventory table -->
        <section class="border border-farm-light">
          <div class="px-5 py-4 border-b border-farm-light flex items-center justify-between gap-3">
            <h2 class="text-sm font-medium text-farm-dark tracking-tight">Inventory snapshot</h2>
            <select
              v-model="statusFilter"
              class="text-[10px] uppercase tracking-wider border border-farm-light px-2 py-1 text-farm-dark/60 bg-white outline-none focus:border-farm-deep"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="low">Low stock</option>
              <option value="outofstock">Out of stock</option>
            </select>
          </div>

          <div v-if="productsPending" class="p-8 text-center text-xs text-farm-dark/40">Loading…</div>
          <div v-else-if="!filteredProducts.length" class="p-8 text-center text-xs text-farm-dark/40">
            No products found.
          </div>
          <table v-else class="w-full text-left">
            <thead>
              <tr class="border-b border-farm-light text-[10px] uppercase tracking-wider text-farm-dark/40">
                <th class="px-5 py-3 font-medium">Product</th>
                <th class="px-5 py-3 font-medium text-right">Price</th>
                <th class="px-5 py-3 font-medium text-right">Stock</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-farm-light">
              <tr
                v-for="product in filteredProducts.slice(0, 6)"
                :key="product.id"
                class="hover:bg-farm-light/50 transition-colors cursor-pointer"
                @click="router.push('/seller/inventory')"
              >
                <td class="px-5 py-4">
                  <p class="text-sm text-farm-dark font-medium truncate max-w-[160px]">{{ product.name }}</p>
                  <p class="text-[10px] text-farm-dark/40 mt-0.5">{{ product.category }}</p>
                </td>
                <td class="px-5 py-4 text-sm text-farm-leaf text-right tabular-nums">
                  ₱{{ parseFloat(product.price).toFixed(2) }}
                </td>
                <td class="px-5 py-4 text-right">
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-full border"
                    :class="stockChipClass(product.stock)"
                  >
                    {{ product.stock }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <div class="flex justify-end pt-4">
        <button
          type="button"
          class="px-6 py-3 bg-farm-deep text-white text-[10px] font-medium tracking-[0.14em] uppercase hover:bg-farm-dark transition-colors"
          @click="router.push('/seller/inventory')"
        >
          Manage inventory
        </button>
      </div>
  </PageContainer>
</template>

<script setup lang="ts">
import type { Options } from 'highcharts'
import PageContainer from '~/components/ui/PageContainer.vue'
import FarmChart from '~/components/ui/FarmChart.vue'

definePageMeta({ layout: 'seller' })

const { user } = useAuth()
const router = useRouter()
const statusFilter = ref('all')
const api = useApiFetch()
const { sellerDualAxisOptions } = useFarmChartTheme()

interface MetricItem {
  price: number
  quantity: number
  created_at: string
}

interface MetricsPayload {
  totalRevenue: number
  totalOrders: number
  items: MetricItem[]
  chart?: {
    categories: string[]
    revenue: number[]
    orderCount: number[]
  }
}

const { data: metrics, pending: metricsPending } = await useAsyncData(
  'seller:metrics',
  () => api<MetricsPayload>('/api/seller/metrics'),
  { server: false },
)

const { data: productsData, pending: productsPending } = await useAsyncData(
  'seller:products',
  () => api<{ products: { id: string; name: string; price: string; stock: number; category: string }[] }>('/api/seller/products'),
  { server: false },
)

const recentSales = computed(() => (metrics.value?.items ?? []).slice(0, 8))

const sellerChartOptions = computed<Options>(() => {
  const chart = metrics.value?.chart
  const categories = chart?.categories ?? []
  const revenue = chart?.revenue ?? []
  const orderCount = chart?.orderCount ?? []

  return sellerDualAxisOptions(categories, revenue, orderCount)
})

const filteredProducts = computed(() => {
  const list = productsData.value?.products ?? []
  if (statusFilter.value === 'all') return list
  if (statusFilter.value === 'low') return list.filter(p => p.stock > 0 && p.stock < 10)
  if (statusFilter.value === 'outofstock') return list.filter(p => p.stock === 0)
  if (statusFilter.value === 'active') return list.filter(p => p.stock > 0)
  return list
})

const quickLinks = [
  { label: 'Inventory', path: '/seller/inventory', icon: 'heroicons:archive-box' },
  { label: 'Reviews', path: '/seller/reviews', icon: 'heroicons:star' },
  { label: 'Profile', path: '/seller/profile', icon: 'heroicons:user' },
]

function stockChipClass(stock: number) {
  if (stock === 0) return 'border-red-200 text-red-600'
  if (stock < 10) return 'border-farm-yellow/50 text-farm-dark'
  return 'border-farm-light text-farm-leaf'
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

useHead({ title: 'Seller Dashboard — Senoro Green Farm' })
</script>
