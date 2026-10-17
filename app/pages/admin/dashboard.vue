<template>
  <div class="space-y-10 py-8 md:py-10">
    <UiPageHeader label="Overview" title="Dashboard" :caption="today">
      <NuxtLink to="/admin/approvals" class="ui-btn-accent">
        Review approvals
        <span v-if="pendingCount > 0" class="rounded-full bg-white px-1.5 text-xs font-semibold text-market-orange">{{ pendingCount }}</span>
      </NuxtLink>
      <button type="button" class="ui-btn-outline" :disabled="analyticsPending" @click="refreshAnalytics()">
        {{ analyticsPending ? 'Refreshing…' : 'Refresh' }}
      </button>
    </UiPageHeader>

    <!-- Numbers -->
    <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <UiStatCard
        v-for="stat in stats"
        :key="stat.label"
        :label="stat.label"
        :value="analytics ? stat.value : '—'"
        :caption="stat.caption"
        :icon="stat.icon"
        :tone="stat.tone"
      />
    </section>

    <!-- Orders + roles -->
    <section class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="ui-card p-5 lg:col-span-2">
        <h2 class="text-base font-semibold text-farm-deep">Orders</h2>
        <p class="mt-0.5 text-xs text-gray-400">Placed and delivered, last 6 months</p>
        <div class="mt-4">
          <FarmChart :options="growthChartOptions" :height="280" />
        </div>
      </div>

      <div class="ui-card p-5">
        <h2 class="text-base font-semibold text-farm-deep">Accounts by role</h2>
        <p class="mt-0.5 text-xs text-gray-400">{{ users.length }} accounts in total</p>
        <ul class="mt-6 space-y-5">
          <li v-for="role in roleRows" :key="role.key">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">{{ role.label }}</span>
              <span class="font-semibold tabular-nums text-farm-deep">{{ role.count }}</span>
            </div>
            <div class="mt-2 h-1.5 rounded-full bg-farm-light">
              <div class="h-full rounded-full bg-farm-leaf" :style="{ width: `${role.share}%` }" />
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Users -->
    <section class="space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-base font-semibold text-farm-deep">Users</h2>
          <p class="mt-0.5 text-xs text-gray-400">{{ filteredUsers.length }} of {{ users.length }} shown</p>
        </div>
        <input
          v-model="search"
          type="search"
          placeholder="Search name or email"
          aria-label="Search users"
          class="ui-input sm:w-64"
        >
      </div>

      <nav class="flex gap-6 overflow-x-auto border-b border-farm-leaf/15" aria-label="Filter by role">
        <button
          v-for="f in roleFilters"
          :key="f.value"
          type="button"
          class="ui-tab"
          :class="activeFilter === f.value ? 'ui-tab--active' : ''"
          @click="activeFilter = f.value"
        >
          {{ f.label }}
          <span class="ml-1 text-gray-400">{{ f.value === 'all' ? users.length : roleCounts[f.value] }}</span>
        </button>
      </nav>

      <div class="ui-card overflow-hidden">
        <div class="hidden grid-cols-[1fr_100px_100px_110px] gap-4 border-b border-farm-leaf/15 bg-shop-mint px-5 py-3 text-xs font-medium text-farm-deep md:grid">
          <span>Name</span>
          <span>Role</span>
          <span>Status</span>
          <span class="text-right">Joined</span>
        </div>

        <p v-if="analyticsPending && !analytics" class="py-16 text-center text-sm text-gray-400">Loading…</p>

        <ul v-else-if="filteredUsers.length" class="max-h-[520px] divide-y divide-farm-leaf/10 overflow-y-auto">
          <li
            v-for="u in filteredUsers"
            :key="u.id"
            class="flex items-center gap-3 px-5 py-3.5 md:grid md:grid-cols-[1fr_100px_100px_110px] md:gap-4"
          >
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <AccountAvatar
                :name="u.full_name"
                :url="u.avatar_url"
                class="h-9 w-9 rounded-full bg-shop-mint text-sm text-farm-deep"
              />
              <div class="min-w-0">
                <p class="truncate text-sm text-shop-ink">{{ u.full_name }}</p>
                <p class="truncate text-xs text-gray-400">
                  {{ u.email }}<span class="md:hidden"> · {{ roleLabel(u.role) }}</span>
                </p>
              </div>
            </div>
            <span class="hidden text-sm text-gray-600 md:block">{{ roleLabel(u.role) }}</span>
            <span class="flex-shrink-0 capitalize" :class="statusClass(u.approval_status)">
              {{ u.approval_status ?? 'approved' }}
            </span>
            <span class="hidden text-right text-xs tabular-nums text-gray-400 md:block">
              {{ formatDate(u.created_at) }}
            </span>
          </li>
        </ul>

        <p v-else class="py-16 text-center text-sm text-gray-400">
          {{ search ? 'No accounts match your search.' : 'No accounts in this group.' }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Options } from 'highcharts'
import FarmChart from '~/components/ui/FarmChart.vue'

definePageMeta({ layout: 'admin' })

const api = useApiFetch()
const { platformGrowthOptions, baseChart } = useFarmChartTheme()

type RoleKey = 'buyer' | 'seller' | 'delivery' | 'admin'

interface PlatformUser {
  id: string
  full_name: string
  email: string
  role: string
  approval_status?: string
  avatar_url?: string | null
  created_at: string
}

interface AnalyticsPayload {
  users: PlatformUser[]
  orders: { id: string; total_amount: number; status: string; created_at: string }[]
  chart?: {
    categories: string[]
    orderVolume: number[]
    fulfilledVolume: number[]
  }
  roles?: Record<RoleKey, number>
}

const { data: analytics, pending: analyticsPending, refresh: refreshAnalytics } = await useAsyncData(
  'admin:analytics',
  () => api<AnalyticsPayload>('/api/admin/analytics'),
  { server: false },
)

const users = computed(() => analytics.value?.users ?? [])
const orders = computed(() => analytics.value?.orders ?? [])
const roleCounts = computed<Record<RoleKey, number>>(() => analytics.value?.roles ?? {
  buyer: 0, seller: 0, delivery: 0, admin: 0,
})
const pendingCount = computed(() => users.value.filter(u => u.approval_status === 'pending').length)

const today = new Date().toLocaleDateString('en-PH', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
})

function isThisMonth(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`

const stats = computed(() => {
  const delivered = orders.value.filter(o => o.status === 'delivered')
  const sales = delivered.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0)
  const newUsers = users.value.filter(u => isThisMonth(u.created_at)).length
  const newOrders = orders.value.filter(o => isThisMonth(o.created_at)).length
  const rate = orders.value.length ? Math.round((delivered.length / orders.value.length) * 100) : 0

  return [
    { label: 'Delivered sales', value: peso(sales), caption: 'Cash on delivery', icon: 'heroicons:banknotes', tone: 'primary' as const },
    { label: 'Orders', value: orders.value.length, caption: `${newOrders} this month`, icon: 'heroicons:shopping-bag', tone: 'default' as const },
    { label: 'Delivered', value: delivered.length, caption: `${rate}% of all orders`, icon: 'heroicons:truck', tone: 'default' as const },
    { label: 'Accounts', value: users.value.length, caption: `${newUsers} new this month`, icon: 'heroicons:users', tone: 'default' as const },
  ]
})

const roleRows = computed(() => {
  const r = roleCounts.value
  const total = users.value.length || 1
  return ([
    { key: 'buyer', label: 'Buyers' },
    { key: 'seller', label: 'Sellers' },
    { key: 'delivery', label: 'Riders' },
    { key: 'admin', label: 'Admins' },
  ] as const).map(row => ({
    ...row,
    count: r[row.key],
    share: Math.round((r[row.key] / total) * 100),
  }))
})

const activeFilter = ref<'all' | RoleKey>('all')
const search = ref('')
const roleFilters = [
  { value: 'all', label: 'All' },
  { value: 'buyer', label: 'Buyers' },
  { value: 'seller', label: 'Sellers' },
  { value: 'delivery', label: 'Riders' },
  { value: 'admin', label: 'Admins' },
] as const

const filteredUsers = computed(() => {
  const q = search.value.trim().toLowerCase()
  return users.value.filter((u) => {
    if (activeFilter.value !== 'all' && u.role !== activeFilter.value) return false
    if (!q) return true
    return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })
})

// Flat line chart: no animation, no markers, light grid.
const growthChartOptions = computed<Options>(() => {
  const chart = analytics.value?.chart
  return platformGrowthOptions(
    chart?.categories ?? [],
    chart?.orderVolume ?? [],
    chart?.fulfilledVolume ?? [],
    {
      chart: { ...baseChart.chart, height: 280 },
      legend: { ...baseChart.legend, symbolRadius: 0 },
      tooltip: { ...baseChart.tooltip, borderColor: '#E5E7EB', shared: true },
      yAxis: { ...baseChart.yAxis, allowDecimals: false, gridLineColor: '#F3F4F6' },
      plotOptions: {
        series: { animation: false, lineWidth: 1.5, marker: { enabled: false } },
      },
    },
  )
})

const roleLabels: Record<string, string> = { buyer: 'Buyer', seller: 'Seller', delivery: 'Rider', admin: 'Admin' }
const roleLabel = (role: string) => roleLabels[role] ?? role

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusClass(status?: string) {
  if (status === 'pending') return 'ui-pill ui-pill-orange'
  if (status === 'rejected') return 'ui-pill ui-pill-red'
  return 'ui-pill ui-pill-green'
}

useHead({ title: 'Dashboard — NFWM Admin' })
</script>
