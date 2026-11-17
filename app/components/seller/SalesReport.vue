<template>
  <section class="ui-card overflow-hidden">
    <div class="ui-card-head flex-col !items-stretch gap-3 sm:flex-row sm:!items-center sm:justify-between">
      <div>
        <h2 class="text-base font-semibold text-farm-deep">Sales report</h2>
        <p class="text-xs text-gray-500">Revenue and orders · cancelled orders not counted</p>
      </div>
      <UiSlideSwitch v-model="period" :options="periodOptions" label="Report period" class="w-full sm:w-80" />
    </div>

    <div class="space-y-5 p-4 md:p-5">
      <p v-if="pending && !reports" class="py-10 text-center text-sm text-gray-400">Loading…</p>
      <p v-else-if="!report" class="py-10 text-center text-sm text-gray-400">No sales data yet.</p>

      <template v-else>
        <!-- This period vs the one before -->
        <div class="grid grid-cols-2 gap-3 md:gap-4">
          <UiStatCard
            :label="`Revenue ${meta.current}`"
            :value="peso(report.current.revenue)"
            :caption="`${meta.previous}: ${peso(report.previous.revenue)}`"
            icon="heroicons:banknotes"
            tone="primary"
          />
          <UiStatCard
            :label="`Orders ${meta.current}`"
            :value="report.current.orders"
            :caption="`${meta.previous}: ${report.previous.orders}`"
            icon="heroicons:shopping-bag"
          />
        </div>

        <div>
          <p class="text-xs text-gray-500">
            {{ meta.range }} · <span class="font-medium text-farm-deep">{{ peso(report.total.revenue) }}</span>
            from <span class="font-medium text-farm-deep">{{ report.total.orders }}</span> {{ report.total.orders === 1 ? 'order' : 'orders' }}
          </p>
          <p class="mt-0.5 text-xs text-farm-leaf">Tap a bar or a row to see the products sold.</p>
          <FarmChart :options="chartOptions" :height="260" class="mt-2" />
        </div>

        <!-- Exact numbers, newest first -->
        <div class="overflow-hidden rounded-md border border-farm-leaf/15">
          <div class="grid grid-cols-[1fr_64px_112px] gap-2 bg-shop-mint px-3 py-2 text-xs font-medium text-farm-deep md:px-4">
            <span>{{ meta.column }}</span>
            <span class="text-right">Orders</span>
            <span class="text-right">Revenue</span>
          </div>
          <ul class="max-h-72 divide-y divide-farm-leaf/10 overflow-y-auto">
            <li v-for="row in tableRows" :key="row.label">
              <NuxtLink
                :to="detailsLink(row.index)"
                class="grid grid-cols-[1fr_64px_112px] gap-2 px-3 py-2.5 text-sm hover:bg-shop-mint/60 md:px-4"
              >
                <span class="flex min-w-0 items-center gap-1 text-shop-ink">
                  <span class="truncate">{{ row.label }}</span>
                  <Icon name="heroicons:chevron-right" class="h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                </span>
                <span class="text-right tabular-nums text-gray-600">{{ row.orders }}</span>
                <span class="text-right tabular-nums font-medium" :class="row.revenue > 0 ? 'text-farm-leaf' : 'text-gray-400'">{{ peso(row.revenue) }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Options, SeriesOptionsType } from 'highcharts'
import FarmChart from '~/components/ui/FarmChart.vue'

export type SalesPeriod = 'day' | 'week' | 'month' | 'year'

export interface PeriodReport {
  categories: string[]
  full_labels: string[]
  /** First and last day of each bar (YYYY-MM-DD). Missing from older servers. */
  ranges?: { from: string; to: string }[]
  revenue: number[]
  orders: number[]
  current: { revenue: number; orders: number }
  previous: { revenue: number; orders: number }
  total: { revenue: number; orders: number }
}

const props = defineProps<{
  reports?: Record<SalesPeriod, PeriodReport> | null
  pending?: boolean
}>()

const { baseChart, FARM } = useFarmChartTheme()

const periodOptions: { value: SalesPeriod; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

const META: Record<SalesPeriod, { current: string; previous: string; range: string; column: string }> = {
  day: { current: 'today', previous: 'Yesterday', range: 'Last 7 days', column: 'Day' },
  week: { current: 'this week', previous: 'Last week', range: 'Last 8 weeks', column: 'Week (Mon – Sun)' },
  month: { current: 'this month', previous: 'Last month', range: 'Last 12 months', column: 'Month' },
  year: { current: 'this year', previous: 'Last year', range: 'Last 5 years', column: 'Year' },
}

// Remember the last chosen period on this device (just a convenience).
const STORAGE_KEY = 'nfwm:seller-sales-period'
const period = ref<SalesPeriod>('month')
onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as SalesPeriod | null
    if (saved && saved in META) period.value = saved
  }
  catch { /* storage blocked */ }
})
watch(period, (value) => {
  try { localStorage.setItem(STORAGE_KEY, value) }
  catch { /* storage blocked */ }
})

const report = computed(() => props.reports?.[period.value] ?? null)
const meta = computed(() => META[period.value])

const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const tableRows = computed(() => {
  const r = report.value
  if (!r) return []
  return r.full_labels
    .map((label, i) => ({ index: i, label, orders: r.orders[i] ?? 0, revenue: r.revenue[i] ?? 0 }))
    .reverse()
})

/** The sales details page for one bar: its dates, and which kind of bar it was. */
function detailsLink(index: number) {
  const r = report.value
  const range = r?.ranges?.[index]
  if (!r || !range) return '/seller/sales'
  return { path: '/seller/sales', query: { from: range.from, to: range.to, scope: period.value, label: r.full_labels[index] } }
}

function openDetails(index: number) {
  if (!report.value?.ranges?.[index]) return
  navigateTo(detailsLink(index))
}

// Flat chart: revenue bars (green, left axis) and orders line (orange, right axis).
const chartOptions = computed<Options>(() => {
  const r = report.value
  const fullLabels = r?.full_labels ?? []
  return {
    ...baseChart,
    chart: {
      ...baseChart.chart,
      height: 260,
      // A tap anywhere in a bar's column opens that bar, even when it is ₱0.
      events: {
        click(e) {
          const x = (e as unknown as { xAxis?: { value: number }[] }).xAxis?.[0]?.value
          if (typeof x === 'number') openDetails(Math.round(x))
        },
      },
    },
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
        const revenue = r?.revenue[i] ?? 0
        const orders = r?.orders[i] ?? 0
        return `<b>${fullLabels[i] ?? ''}</b><br>Revenue: <b>${peso(revenue)}</b><br>Orders: <b>${orders}</b>`
      },
    },
    plotOptions: {
      series: {
        animation: false,
        cursor: 'pointer',
        point: { events: { click() { openDetails(Number(this.index)) } } },
      },
      column: { borderWidth: 0, borderRadius: 2, pointPadding: 0.15, groupPadding: 0.1 },
      line: { lineWidth: 2, marker: { enabled: true, radius: 3 } },
    },
    series: [
      { type: 'column', name: 'Revenue', data: r?.revenue ?? [], color: FARM.leaf, yAxis: 0 },
      { type: 'line', name: 'Orders', data: r?.orders ?? [], color: '#E67E22', yAxis: 1 },
    ] as SeriesOptionsType[],
  }
})
</script>
