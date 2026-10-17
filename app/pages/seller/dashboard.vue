<template>
  <div class="mx-auto w-full max-w-page space-y-8 py-6 md:space-y-10 md:py-8">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-xl font-semibold text-farm-deep">Hello, {{ firstName }}</h2>
        <p class="text-sm text-gray-500">Here is how your shop is doing.</p>
      </div>
      <NuxtLink to="/seller/inventory" class="ui-btn-accent w-full sm:w-auto">
        <Icon name="heroicons:plus" class="h-4 w-4" />
        Add product
      </NuxtLink>
    </div>

    <!-- Numbers -->
    <section class="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <UiStatCard
        v-for="stat in stats"
        :key="stat.label"
        :label="stat.label"
        :value="stat.value"
        :caption="stat.caption"
        :icon="stat.icon"
        :tone="stat.tone"
      />
    </section>

    <!-- Revenue chart -->
    <section class="ui-card overflow-hidden">
      <div class="ui-card-head">
        <div>
          <h2 class="text-base font-semibold text-farm-deep">Revenue</h2>
          <p class="text-xs text-gray-500">Last 6 months</p>
        </div>
      </div>
      <div class="p-4 md:p-5">
        <FarmChart :options="chartOptions" :height="240" />
      </div>
    </section>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-4">
      <!-- Recent sales -->
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-farm-deep">Recent sales</h2>
          <NuxtLink to="/seller/orders" class="ui-link">Orders</NuxtLink>
        </div>
        <div class="ui-card">
          <p v-if="metricsPending" class="py-10 text-center text-sm text-gray-400">Loading…</p>
          <p v-else-if="!recentSales.length" class="py-10 text-center text-sm text-gray-400">No sales yet.</p>
          <ul v-else class="divide-y divide-farm-leaf/10">
            <li v-for="(item, idx) in recentSales" :key="idx" class="flex items-center justify-between gap-3 px-4 py-3">
              <div class="min-w-0">
                <p class="text-sm text-shop-ink">{{ item.quantity }} {{ item.quantity === 1 ? 'unit' : 'units' }} sold</p>
                <p class="text-xs text-gray-400">{{ formatDate(item.created_at) }}</p>
              </div>
              <p class="flex-shrink-0 text-sm font-medium tabular-nums text-farm-leaf">{{ peso(item.price * item.quantity) }}</p>
            </li>
          </ul>
        </div>
      </section>

      <!-- Stock -->
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-farm-deep">Stock</h2>
          <NuxtLink to="/seller/inventory" class="ui-link">Inventory</NuxtLink>
        </div>
        <nav class="flex gap-5 overflow-x-auto border-b border-farm-leaf/15" aria-label="Filter stock">
          <button
            v-for="f in stockFilters"
            :key="f.value"
            type="button"
            class="ui-tab"
            :class="statusFilter === f.value ? 'ui-tab--active' : ''"
            @click="statusFilter = f.value"
          >
            {{ f.label }}
          </button>
        </nav>
        <div class="ui-card">
          <p v-if="productsPending" class="py-10 text-center text-sm text-gray-400">Loading…</p>
          <p v-else-if="!filteredProducts.length" class="py-10 text-center text-sm text-gray-400">No products here.</p>
          <ul v-else class="divide-y divide-farm-leaf/10">
            <li v-for="product in filteredProducts.slice(0, 6)" :key="product.id">
              <NuxtLink to="/seller/inventory" class="flex items-center justify-between gap-3 px-4 py-3">
                <div class="min-w-0">
                  <p class="truncate text-sm text-shop-ink">{{ product.name }}</p>
                  <p class="truncate text-xs text-gray-400">{{ peso(Number(product.price)) }} · {{ product.category || 'Uncategorized' }}</p>
                </div>
                <span class="flex-shrink-0 tabular-nums" :class="stockClass(product.stock)">
                  {{ product.stock === 0 ? 'Sold out' : `${product.stock} left` }}
                </span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <!-- Categories -->
    <section class="space-y-3">
      <div>
        <h2 class="text-base font-semibold text-farm-deep">Shop categories</h2>
        <p class="mt-0.5 text-xs text-gray-400">Buyers see these on your shop page. Add one before publishing products.</p>
      </div>

      <form class="flex gap-2" @submit.prevent="createCategory">
        <input
          v-model="newCategoryName"
          type="text"
          maxlength="120"
          placeholder="New category, e.g. Leafy greens"
          aria-label="New category name"
          class="ui-input min-w-0 flex-1 md:max-w-sm"
        >
        <button type="submit" class="ui-btn" :disabled="savingCategory || !newCategoryName.trim()">Add</button>
      </form>

      <div class="ui-card">
        <p v-if="categoriesPending" class="py-10 text-center text-sm text-gray-400">Loading…</p>
        <p v-else-if="!categories.length" class="py-10 text-center text-sm text-gray-400">No categories yet.</p>
        <ul v-else class="divide-y divide-farm-leaf/10">
          <li v-for="category in categories" :key="category.id">
            <form class="flex items-center gap-2 px-3 py-2.5 md:px-4" @submit.prevent="updateCategory(category)">
              <input
                v-model="category.name"
                type="text"
                maxlength="120"
                :aria-label="`Category name`"
                class="min-w-0 flex-1 rounded border border-transparent bg-transparent px-2 py-2 text-sm text-shop-ink outline-none focus:border-farm-leaf/40"
              >
              <button type="submit" class="ui-link px-2">Save</button>
              <button type="button" class="ui-icon-btn" title="Delete category" aria-label="Delete category" @click="deleteCategory(category)">
                <Icon name="heroicons:trash" class="h-4 w-4" />
              </button>
            </form>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Options, SeriesOptionsType } from 'highcharts'
import FarmChart from '~/components/ui/FarmChart.vue'

definePageMeta({ layout: 'seller' })

const { user } = useAuth()
const api = useApiFetch()
const { baseChart, FARM } = useFarmChartTheme()

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

interface SellerCategory {
  id: string
  name: string
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

const {
  data: categoriesData,
  pending: categoriesPending,
  refresh: refreshCategories,
} = await useAsyncData(
  'seller:dashboard-categories',
  () => api<{ categories: SellerCategory[] }>('/api/seller/categories'),
  { server: false },
)

const firstName = computed(() => user.value?.full_name?.trim().split(/\s+/)[0] ?? 'there')

const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const products = computed(() => productsData.value?.products ?? [])

const stats = computed(() => {
  const lowStock = products.value.filter(p => p.stock < 10).length
  return [
    { label: 'Revenue', value: metrics.value ? peso(metrics.value.totalRevenue ?? 0) : '—', caption: 'All time', icon: 'heroicons:banknotes', tone: 'primary' as const },
    { label: 'Orders', value: metrics.value ? metrics.value.totalOrders ?? 0 : '—', caption: 'All time', icon: 'heroicons:shopping-bag', tone: 'default' as const },
    { label: 'Products', value: productsData.value ? products.value.length : '—', caption: 'Listed in your shop', icon: 'heroicons:archive-box', tone: 'default' as const },
    { label: 'Low stock', value: productsData.value ? lowStock : '—', caption: 'Under 10 left', icon: 'heroicons:exclamation-triangle', tone: lowStock > 0 ? 'accent' as const : 'default' as const },
  ]
})

const recentSales = computed(() => (metrics.value?.items ?? []).slice(0, 6))

// Flat chart: revenue bars, no gradients, no animation.
const chartOptions = computed<Options>(() => {
  const chart = metrics.value?.chart
  return {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'column', height: 240 },
    legend: { enabled: false },
    xAxis: { ...baseChart.xAxis, categories: chart?.categories ?? [] },
    yAxis: {
      ...baseChart.yAxis,
      gridLineColor: '#F3F4F6',
      labels: {
        style: { color: '#9CA3AF', fontSize: '10px' },
        formatter() {
          const v = Number(this.value)
          return v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`
        },
      },
    },
    tooltip: {
      ...baseChart.tooltip,
      borderColor: '#E5E7EB',
      pointFormatter() {
        return `Revenue: <b>${peso(Number(this.y))}</b>`
      },
    },
    plotOptions: {
      series: { animation: false },
      column: { borderWidth: 0, borderRadius: 2, pointPadding: 0.2, groupPadding: 0.1 },
    },
    series: [
      { type: 'column', name: 'Revenue', data: chart?.revenue ?? [], color: FARM.leaf },
    ] as SeriesOptionsType[],
  }
})

const statusFilter = ref<'all' | 'active' | 'low' | 'outofstock'>('all')
const stockFilters = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'In stock' },
  { value: 'low', label: 'Low' },
  { value: 'outofstock', label: 'Sold out' },
] as const

const filteredProducts = computed(() => {
  const list = products.value
  if (statusFilter.value === 'low') return list.filter(p => p.stock > 0 && p.stock < 10)
  if (statusFilter.value === 'outofstock') return list.filter(p => p.stock === 0)
  if (statusFilter.value === 'active') return list.filter(p => p.stock > 0)
  return list
})

function stockClass(stock: number) {
  if (stock === 0) return 'ui-pill ui-pill-red'
  if (stock < 10) return 'ui-pill ui-pill-orange'
  return 'ui-pill ui-pill-green'
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const newCategoryName = ref('')
const savingCategory = ref(false)
const categories = computed(() => categoriesData.value?.categories ?? [])

async function createCategory() {
  const name = newCategoryName.value.trim()
  if (!name) return

  savingCategory.value = true
  try {
    await api('/api/seller/categories', {
      method: 'POST',
      body: { name },
    })
    newCategoryName.value = ''
    await refreshCategories()
  }
  finally {
    savingCategory.value = false
  }
}

async function updateCategory(category: SellerCategory) {
  const name = category.name.trim()
  if (!name) return

  await api(`/api/seller/categories/${category.id}`, {
    method: 'PUT',
    body: { name },
  })
  await refreshCategories()
}

async function deleteCategory(category: SellerCategory) {
  const confirmed = confirm(`Delete "${category.name}"? Products in this category will become uncategorized.`)
  if (!confirmed) return

  await api(`/api/seller/categories/${category.id}`, {
    method: 'DELETE',
  })
  await refreshCategories()
}

useHead({ title: 'Dashboard — NFWM Seller' })
</script>
