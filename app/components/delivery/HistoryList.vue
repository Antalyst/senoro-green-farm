<template>
  <div class="space-y-4">
    <!-- Totals -->
    <div class="grid grid-cols-3 gap-2">
      <div class="tile">
        <span class="text-lg font-bold tabular-nums text-farm-deep">{{ data ? data.summary.delivered : '—' }}</span>
        <span class="text-[11px] text-gray-500">Delivered</span>
      </div>
      <div class="tile">
        <span class="text-lg font-bold tabular-nums text-farm-deep">{{ data ? data.summary.delivered_this_month : '—' }}</span>
        <span class="text-[11px] text-gray-500">This month</span>
      </div>
      <div class="tile">
        <span class="truncate text-lg font-bold tabular-nums text-market-orange">{{ data ? peso(data.summary.fees_earned) : '—' }}</span>
        <span class="text-[11px] text-gray-500">Delivery fees</span>
      </div>
    </div>

    <!-- Chart: delivery fees and jobs delivered per day / week / month / year -->
    <section class="rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-sm font-semibold text-farm-deep">Earnings chart</h3>
          <p class="text-xs text-gray-500">Delivery fees and jobs delivered</p>
        </div>
      </div>
      <UiSlideSwitch v-model="period" :options="periodOptions" label="Chart period" class="mt-3" />

      <p v-if="!report" class="py-10 text-center text-sm text-gray-400">{{ pending ? 'Loading…' : 'No chart data yet.' }}</p>
      <template v-else>
        <div class="mt-3 grid grid-cols-2 gap-2">
          <div class="tile">
            <span class="truncate text-base font-bold tabular-nums text-market-orange">{{ peso(report.current.revenue) }}</span>
            <span class="text-[11px] text-gray-500">Fees {{ meta.current }}</span>
          </div>
          <div class="tile">
            <span class="text-base font-bold tabular-nums text-farm-deep">{{ report.current.orders }}</span>
            <span class="text-[11px] text-gray-500">Delivered {{ meta.current }}</span>
          </div>
        </div>
        <p class="mt-3 text-xs text-gray-500">{{ meta.range }}</p>
        <FarmChart :options="chartOptions" :height="220" class="mt-1" />
      </template>
    </section>

    <UiSlideSwitch v-model="filter" :options="filterOptions" label="Filter history" />

    <div v-if="pending && !data" class="space-y-3">
      <div v-for="n in 3" :key="n" class="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-black/5" />
    </div>

    <div v-else-if="error && !data" class="empty">
      <Icon name="heroicons:wifi" class="h-10 w-10 text-gray-300" />
      <p class="mt-3 font-medium text-shop-ink">Could not load your history</p>
      <button type="button" class="mt-4 rounded-full bg-farm-leaf px-5 py-2.5 text-sm font-semibold text-white" @click="refresh()">Try again</button>
    </div>

    <div v-else-if="!shown.length" class="empty">
      <span class="flex h-16 w-16 items-center justify-center rounded-full bg-shop-mint text-farm-leaf">
        <Icon name="heroicons:clock" class="h-8 w-8" />
      </span>
      <p class="mt-4 font-medium text-shop-ink">{{ filter === 'all' ? 'No finished jobs yet' : `No ${filter} jobs` }}</p>
      <p class="mt-1 max-w-xs text-sm text-gray-500">Jobs you deliver (or that get cancelled) are listed here.</p>
    </div>

    <ul v-else class="space-y-3">
      <li v-for="order in shown" :key="order.id" class="rounded-2xl bg-white p-4 ring-1 ring-black/5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-shop-ink">Order #{{ order.id.slice(0, 8).toUpperCase() }}</p>
            <p class="text-xs text-gray-500">{{ dateLabel(order) }}</p>
          </div>
          <span class="ui-pill flex-shrink-0" :class="order.status === 'delivered' ? 'ui-pill-green' : 'ui-pill-red'">
            {{ order.status === 'delivered' ? 'Delivered' : 'Cancelled' }}
          </span>
        </div>

        <dl class="mt-3 space-y-1.5 text-sm">
          <div class="flex gap-2">
            <dt class="w-16 flex-shrink-0 text-gray-400">Buyer</dt>
            <dd class="min-w-0 truncate text-shop-ink">{{ order.buyer_name || 'Buyer' }}<span v-if="order.area" class="text-gray-500"> · {{ order.area }}</span></dd>
          </div>
          <div class="flex gap-2">
            <dt class="w-16 flex-shrink-0 text-gray-400">{{ order.shops.length === 1 ? 'Shop' : 'Shops' }}</dt>
            <dd class="min-w-0 truncate text-shop-ink">{{ order.shops.join(', ') || '—' }}</dd>
          </div>
          <div class="flex gap-2">
            <dt class="w-16 flex-shrink-0 text-gray-400">Items</dt>
            <dd class="text-shop-ink">{{ order.item_count }}</dd>
          </div>
        </dl>

        <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
          <span class="text-gray-500">Order total <b class="tabular-nums text-shop-ink">{{ peso(order.total_amount) }}</b></span>
          <span v-if="order.delivery_fee != null" class="text-gray-500">Fee <b class="tabular-nums text-market-orange">{{ peso(order.delivery_fee) }}</b></span>
        </div>
      </li>
    </ul>

    <p v-if="data?.limited" class="text-center text-xs text-gray-400">Showing your latest 200 jobs.</p>
  </div>
</template>

<script setup lang="ts">
interface HistoryOrder {
  id: string
  status: 'delivered' | 'cancelled'
  created_at: string
  finished_at: string | null
  total_amount: number
  delivery_fee: number | null
  buyer_name: string | null
  area: string | null
  shops: string[]
  item_count: number
}

type Period = 'day' | 'week' | 'month' | 'year'

interface PeriodReport {
  categories: string[]
  full_labels: string[]
  /** Delivery fees collected in each bar. */
  revenue: number[]
  /** Jobs delivered in each bar. */
  orders: number[]
  current: { revenue: number; orders: number }
  previous: { revenue: number; orders: number }
  total: { revenue: number; orders: number }
}

interface HistoryPayload {
  orders: HistoryOrder[]
  reports?: Record<Period, PeriodReport>
  summary: { delivered: number; cancelled: number; delivered_this_month: number; fees_earned: number }
  limited: boolean
}

import type { Options, SeriesOptionsType } from 'highcharts'
import FarmChart from '~/components/ui/FarmChart.vue'

const api = useApiFetch()

// No await: this list mounts later, when the rider opens the History tab.
const { data, pending, error, refresh } = useAsyncData(
  'delivery:history',
  () => api<HistoryPayload>('/api/delivery/history'),
  { server: false },
)

// The tab is opened again later: show the saved list at once, then update it.
onMounted(() => { if (data.value) refresh() })

type Filter = 'all' | 'delivered' | 'cancelled'
const filter = ref<Filter>('all')
const filterOptions = computed<{ value: Filter; label: string }[]>(() => [
  { value: 'all', label: `All ${data.value ? data.value.orders.length : ''}`.trim() },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
])

const shown = computed(() => {
  const list = data.value?.orders ?? []
  return filter.value === 'all' ? list : list.filter(o => o.status === filter.value)
})

// ---- Chart -------------------------------------------------------------------------------
const { baseChart, FARM } = useFarmChartTheme()

const periodOptions: { value: Period; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

const META: Record<Period, { current: string; range: string }> = {
  day: { current: 'today', range: 'Last 7 days' },
  week: { current: 'this week', range: 'Last 8 weeks (Mon – Sun)' },
  month: { current: 'this month', range: 'Last 12 months' },
  year: { current: 'this year', range: 'Last 5 years' },
}

// Remember the last chosen period on this device (just a convenience).
const STORAGE_KEY = 'nfwm:rider-chart-period'
const period = ref<Period>('month')
onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Period | null
    if (saved && saved in META) period.value = saved
  }
  catch { /* storage blocked */ }
})
watch(period, (value) => {
  try { localStorage.setItem(STORAGE_KEY, value) }
  catch { /* storage blocked */ }
})

const report = computed(() => data.value?.reports?.[period.value] ?? null)
const meta = computed(() => META[period.value])

// Flat chart: delivery fees as green bars (left axis), jobs delivered as an orange line (right axis).
const chartOptions = computed<Options>(() => {
  const r = report.value
  const fullLabels = r?.full_labels ?? []
  return {
    ...baseChart,
    chart: { ...baseChart.chart, height: 220 },
    legend: { ...baseChart.legend, enabled: true, symbolRadius: 0, itemStyle: { color: '#4B5563', fontSize: '11px', fontWeight: '500' } },
    xAxis: { ...baseChart.xAxis, categories: r?.categories ?? [] },
    yAxis: [
      {
        ...baseChart.yAxis,
        min: 0,
        gridLineColor: '#F3F4F6',
        title: { text: undefined },
        labels: {
          style: { color: '#9CA3AF', fontSize: '10px' },
          formatter() {
            const v = Number(this.value)
            return v >= 1000 ? `₱${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `₱${v}`
          },
        },
      },
      {
        min: 0,
        allowDecimals: false,
        opposite: true,
        gridLineWidth: 0,
        title: { text: undefined },
        labels: { style: { color: '#9CA3AF', fontSize: '10px' } },
      },
    ],
    tooltip: {
      ...baseChart.tooltip,
      shared: true,
      borderColor: '#E5E7EB',
      formatter() {
        const i = Number(this.points?.[0]?.point.index ?? 0)
        return `<b>${fullLabels[i] ?? ''}</b><br>Fees: <b>${peso(r?.revenue[i] ?? 0)}</b><br>Delivered: <b>${r?.orders[i] ?? 0}</b>`
      },
    },
    plotOptions: {
      series: { animation: false },
      column: { borderWidth: 0, borderRadius: 2, pointPadding: 0.15, groupPadding: 0.1 },
      line: { lineWidth: 2, marker: { enabled: true, radius: 3 } },
    },
    series: [
      { type: 'column', name: 'Delivery fees', data: r?.revenue ?? [], color: FARM.leaf, yAxis: 0 },
      { type: 'line', name: 'Delivered', data: r?.orders ?? [], color: '#E67E22', yAxis: 1 },
    ] as SeriesOptionsType[],
  }
})

const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function dateLabel(order: HistoryOrder) {
  if (order.finished_at) return `${order.status === 'delivered' ? 'Delivered' : 'Cancelled'} ${formatDate(order.finished_at)}`
  return `Ordered ${formatDate(order.created_at)}`
}

defineExpose({ refresh })
</script>

<style scoped>
.tile {
  @apply flex min-w-0 flex-col items-start rounded-xl bg-white px-3 py-2.5 ring-1 ring-black/5;
}
.empty {
  @apply flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-black/5;
}
</style>
