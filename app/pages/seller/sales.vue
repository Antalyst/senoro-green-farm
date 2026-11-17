<template>
  <div class="mx-auto w-full max-w-page space-y-4 py-5 md:space-y-5 md:py-8">
    <!-- Title -->
    <div>
      <NuxtLink to="/seller/dashboard" class="inline-flex min-h-[40px] items-center gap-1 text-sm font-medium text-farm-leaf hover:text-farm-deep">
        <Icon name="heroicons:chevron-left" class="h-4 w-4" />
        Sales report
      </NuxtLink>
      <h1 class="text-xl font-semibold text-farm-deep md:text-2xl">Sales details</h1>
      <p class="text-sm text-gray-500">{{ boundsLabel }} · cancelled orders not counted</p>
    </div>

    <!-- Filter -->
    <section class="ui-card space-y-3 p-4 md:p-5">
      <UiSlideSwitch v-if="modeOptions.length > 1" v-model="mode" :options="modeOptions" label="Show sales for" />

      <label v-if="mode === 'day'" class="block">
        <span class="ui-label">Day</span>
        <input v-model="day" type="date" :min="bounds.from" :max="bounds.to" class="ui-input">
      </label>

      <label v-else-if="mode === 'week'" class="block">
        <span class="ui-label">Week (Mon – Sun)</span>
        <select v-model="weekStart" class="ui-input">
          <option v-for="w in weeks" :key="w.from" :value="w.from">{{ w.label }}</option>
        </select>
      </label>

      <div v-else-if="mode === 'custom'" class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="ui-label">From</span>
          <input v-model="customFrom" type="date" :min="bounds.from" :max="bounds.to" class="ui-input">
        </label>
        <label class="block">
          <span class="ui-label">To</span>
          <input v-model="customTo" type="date" :min="customFrom || bounds.from" :max="bounds.to" class="ui-input">
        </label>
      </div>

      <p class="text-xs text-gray-500">
        Showing <span class="font-medium text-farm-deep">{{ rangeLabel(range.from, range.to) }}</span>
      </p>
    </section>

    <!-- Totals -->
    <div class="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      <UiStatCard label="Revenue" :value="data ? peso(data.totals.revenue) : '—'" icon="heroicons:banknotes" tone="primary" class="col-span-2 md:col-span-1" />
      <UiStatCard label="Orders" :value="data ? data.totals.orders : '—'" icon="heroicons:shopping-bag" />
      <UiStatCard label="Items sold" :value="data ? data.totals.quantity : '—'" icon="heroicons:cube" />
    </div>

    <!-- Products -->
    <section class="ui-card overflow-hidden">
      <div class="ui-card-head">
        <h2 class="text-base font-semibold text-farm-deep">Products sold</h2>
        <span v-if="data" class="text-xs text-gray-500">{{ data.totals.products }} {{ data.totals.products === 1 ? 'product' : 'products' }}</span>
      </div>

      <div v-if="pending && !data" class="space-y-px">
        <div v-for="n in 4" :key="n" class="h-16 animate-pulse bg-gray-50" />
      </div>

      <div v-else-if="error" class="px-4 py-12 text-center">
        <p class="text-sm font-medium text-shop-ink">{{ errorText }}</p>
        <button type="button" class="ui-btn mt-4" @click="refresh()">Try again</button>
      </div>

      <div v-else-if="!data?.products.length" class="px-4 py-12 text-center">
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-shop-mint text-farm-leaf">
          <Icon name="heroicons:shopping-bag" class="h-7 w-7" />
        </span>
        <p class="mt-3 text-sm font-medium text-shop-ink">No sales on these days</p>
        <p class="mt-1 text-xs text-gray-400">Pick other days above.</p>
      </div>

      <ul v-else class="divide-y divide-farm-leaf/10" :class="{ 'opacity-60': pending }">
        <li v-for="(item, i) in data.products" :key="item.key" class="flex items-center gap-3 px-4 py-3 md:px-5">
          <span class="w-5 flex-shrink-0 text-center text-xs font-semibold tabular-nums text-gray-400">{{ i + 1 }}</span>
          <img
            :src="item.image_url || '/logo.png'"
            alt=""
            class="h-12 w-12 flex-shrink-0 rounded bg-shop-cream object-cover"
            loading="lazy"
          >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-shop-ink">{{ item.name }}</p>
            <p class="text-xs text-gray-500">
              {{ item.quantity }} {{ item.unit_type || 'pc' }} sold · {{ item.orders }} {{ item.orders === 1 ? 'order' : 'orders' }}
            </p>
            <!-- Share of the revenue in this range -->
            <span class="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-shop-mint">
              <span class="block h-full rounded-full bg-farm-leaf" :style="{ width: `${share(item.revenue)}%` }" />
            </span>
          </div>
          <span class="flex-shrink-0 text-right text-sm font-semibold tabular-nums text-farm-leaf">{{ peso(item.revenue) }}</span>
        </li>
      </ul>

      <p v-if="data?.limited" class="border-t border-farm-leaf/10 px-4 py-2 text-center text-xs text-gray-400">
        Only the latest 5,000 items are counted. Pick fewer days for exact numbers.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'seller' })

type Scope = 'day' | 'week' | 'month' | 'year'
type Mode = 'all' | 'day' | 'week' | 'custom'

interface ProductSale {
  key: string
  product_id: string | null
  name: string
  image_url: string | null
  unit_type: string | null
  quantity: number
  revenue: number
  orders: number
}

interface SalesPayload {
  from: string
  to: string
  totals: { revenue: number; orders: number; quantity: number; products: number }
  products: ProductSale[]
  limited: boolean
}

const route = useRoute()
const api = useApiFetch()

// ---- Dates (YYYY-MM-DD, Philippine calendar) ------------------------------------------------
const DAY_MS = 86_400_000
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const toDate = (key: string) => new Date(`${key}T00:00:00Z`)
const toKey = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (key: string, n: number) => toKey(new Date(toDate(key).getTime() + n * DAY_MS))
const isDay = (value: unknown): value is string => typeof value === 'string' && DATE_RE.test(value) && toKey(toDate(value)) === value
const clamp = (key: string, min: string, max: string) => (key < min ? min : key > max ? max : key)
const phToday = () => toKey(new Date(Date.now() + 8 * 60 * 60 * 1000))

function fmt(key: string, withYear = false) {
  return toDate(key).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) })
}

function rangeLabel(from: string, to: string) {
  if (from === to) return toDate(from).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmt(from)} – ${fmt(to, true)}`
}

/** Monday of the week that contains the day. */
function mondayOf(key: string) {
  const weekday = (toDate(key).getUTCDay() + 6) % 7
  return addDays(key, -weekday)
}

// ---- The period that was clicked on the dashboard (defaults to this month) -------------------
const bounds = computed(() => {
  const qFrom = route.query.from
  const qTo = route.query.to
  if (isDay(qFrom) && isDay(qTo) && qFrom <= qTo) return { from: qFrom, to: qTo }
  const today = phToday()
  const first = `${today.slice(0, 7)}-01`
  const d = toDate(first)
  const last = toKey(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)))
  return { from: first, to: last }
})

const scope = computed<Scope>(() => {
  const s = String(route.query.scope ?? '')
  if (s === 'day' || s === 'week' || s === 'month' || s === 'year') return s
  return bounds.value.from === bounds.value.to ? 'day' : 'month'
})

const boundsLabel = computed(() => {
  const label = route.query.label
  return typeof label === 'string' && label ? label : rangeLabel(bounds.value.from, bounds.value.to)
})

// ---- Filter inside that period -----------------------------------------------------------------
const WHOLE: Record<Scope, string> = { day: 'Whole day', week: 'Whole week', month: 'Whole month', year: 'Whole year' }

const modeOptions = computed<{ value: Mode; label: string }[]>(() => {
  if (scope.value === 'day') return [{ value: 'all', label: WHOLE.day }]
  const options: { value: Mode; label: string }[] = [{ value: 'all', label: WHOLE[scope.value] }, { value: 'day', label: 'Day' }]
  if (scope.value !== 'week') options.push({ value: 'week', label: 'Week' })
  options.push({ value: 'custom', label: 'Custom' })
  return options
})

const mode = ref<Mode>('all')
const day = ref('')
const weekStart = ref('')
const customFrom = ref('')
const customTo = ref('')

/** Weeks (Mon – Sun) that touch the period, cut to the period's first and last day. */
const weeks = computed(() => {
  const list: { from: string; to: string; label: string }[] = []
  for (let start = mondayOf(bounds.value.from); start <= bounds.value.to; start = addDays(start, 7)) {
    const from = clamp(start, bounds.value.from, bounds.value.to)
    const to = clamp(addDays(start, 6), bounds.value.from, bounds.value.to)
    list.push({ from, to, label: from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}` })
  }
  return list
})

/** Start the filters on today when today is inside the period, otherwise on its last day. */
function resetFilters() {
  const focus = clamp(phToday(), bounds.value.from, bounds.value.to)
  mode.value = 'all'
  day.value = focus
  weekStart.value = weeks.value.find(w => w.from <= focus && focus <= w.to)?.from ?? weeks.value[0]?.from ?? bounds.value.from
  customFrom.value = bounds.value.from
  customTo.value = bounds.value.to
}
watch(bounds, resetFilters, { immediate: true })

/** The days actually shown. */
const range = computed(() => {
  const { from, to } = bounds.value
  if (mode.value === 'day' && isDay(day.value)) {
    const d = clamp(day.value, from, to)
    return { from: d, to: d }
  }
  if (mode.value === 'week') {
    const w = weeks.value.find(x => x.from === weekStart.value)
    if (w) return { from: w.from, to: w.to }
  }
  if (mode.value === 'custom' && isDay(customFrom.value) && isDay(customTo.value)) {
    const a = clamp(customFrom.value, from, to)
    const b = clamp(customTo.value, from, to)
    return a <= b ? { from: a, to: b } : { from: b, to: a }
  }
  return { from, to }
})

// ---- Data ----------------------------------------------------------------------------------------
const { data, pending, error, refresh } = useAsyncData(
  'seller:sales-details',
  () => api<SalesPayload>('/api/seller/sales', { params: { from: range.value.from, to: range.value.to } }),
  { server: false, watch: [range] },
)

const errorText = computed(() => {
  const e = error.value as { data?: { statusMessage?: string } } | null
  return e?.data?.statusMessage || 'Could not load the sales details.'
})

const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const share = (revenue: number) => {
  const top = data.value?.products[0]?.revenue ?? 0
  return top > 0 ? Math.max(2, Math.round((revenue / top) * 100)) : 0
}

useHead({ title: 'Sales details — NFWM Farmers to Market Seller' })
</script>
