<template>
  <div class="space-y-12 py-8 md:py-12">
    <header class="border-b border-farm-light pb-8">
      <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-2">
        Executive overview
      </p>
      <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight">
        {{ user?.full_name }}
      </h1>
      <p class="text-sm text-farm-dark/45 mt-2">{{ today }}</p>
    </header>

    <section class="grid grid-cols-2 lg:grid-cols-4 border border-farm-light divide-x divide-y lg:divide-y-0 divide-farm-light">
      <div
        v-for="stat in platformStats"
        :key="stat.label"
        class="p-6 bg-white"
      >
        <p class="text-[10px] font-medium tracking-[0.16em] uppercase text-farm-dark/45 mb-2">
          {{ stat.label }}
        </p>
        <p class="text-2xl md:text-3xl font-light text-farm-dark tabular-nums">
          {{ stat.value }}
        </p>
        <p class="text-[11px] mt-2" :class="stat.hintClass">{{ stat.hint }}</p>
      </div>
    </section>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <section class="xl:col-span-2 border border-farm-light p-6 md:p-8 bg-white">
        <div class="mb-6">
          <h2 class="text-lg font-light text-farm-dark tracking-tight">
            Platform transaction growth
          </h2>
          <p class="text-xs text-farm-dark/45 mt-1">
            Marketplace orders vs. successful fulfillments (6 months)
          </p>
        </div>
        <ClientOnly>
          <FarmChart
            v-if="growthChartOptions"
            :options="growthChartOptions"
            :height="300"
          />
          <template #fallback>
            <div class="h-[300px] flex items-center justify-center bg-farm-light/20 border border-farm-light">
              <span class="text-[11px] text-farm-dark/40">Loading chart…</span>
            </div>
          </template>
        </ClientOnly>
      </section>

      <section class="border border-farm-light p-6 md:p-8 bg-white">
        <div class="mb-6">
          <h2 class="text-lg font-light text-farm-dark tracking-tight">
            User composition
          </h2>
          <p class="text-xs text-farm-dark/45 mt-1">
            Role distribution across the platform
          </p>
        </div>
        <ClientOnly>
          <FarmChart
            v-if="roleDonutChartOptions"
            :options="roleDonutChartOptions"
            :height="300"
          />
          <template #fallback>
            <div class="h-[300px] flex items-center justify-center bg-farm-light/20 border border-farm-light">
              <span class="text-[11px] text-farm-dark/40">Loading chart…</span>
            </div>
          </template>
        </ClientOnly>
      </section>
    </div>

    <section class="border border-farm-light">
      <div class="px-5 py-4 border-b border-farm-light flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-sm font-medium text-farm-dark tracking-tight">User directory</h2>
          <p class="text-[11px] text-farm-dark/40 mt-0.5">{{ users.length }} accounts on platform</p>
        </div>
        <button
          type="button"
          class="text-[10px] font-medium tracking-[0.12em] uppercase text-farm-deep border-b border-farm-deep pb-0.5 hover:text-farm-dark transition-colors flex items-center gap-1"
          :disabled="analyticsPending"
          @click="refreshAnalytics()"
        >
          <Icon name="heroicons:arrow-path" class="w-3.5 h-3.5" :class="{ 'animate-spin': analyticsPending }" />
          Refresh
        </button>
      </div>

      <div class="flex flex-wrap gap-1 px-5 py-3 border-b border-farm-light bg-farm-light/20">
        <button
          v-for="f in roleFilters"
          :key="f"
          type="button"
          class="px-3 py-1 text-[10px] font-medium tracking-[0.1em] uppercase transition-colors"
          :class="activeFilter === f
            ? 'bg-farm-deep text-white'
            : 'text-farm-dark/50 hover:text-farm-deep'"
          @click="activeFilter = f"
        >
          {{ f }}
        </button>
      </div>

      <div v-if="analyticsPending" class="divide-y divide-farm-light">
        <div v-for="i in 5" :key="i" class="px-5 py-4 flex gap-4">
          <div class="w-8 h-8 bg-farm-light animate-pulse" />
          <div class="flex-1 space-y-2">
            <div class="h-3 bg-farm-light animate-pulse w-1/3" />
            <div class="h-2 bg-farm-light animate-pulse w-1/2" />
          </div>
        </div>
      </div>

      <div v-else class="max-h-[480px] overflow-y-auto">
        <table class="w-full text-left">
          <thead class="sticky top-0 bg-white border-b border-farm-light">
            <tr class="text-[10px] uppercase tracking-wider text-farm-dark/40">
              <th class="px-5 py-3 font-medium">Member</th>
              <th class="px-5 py-3 font-medium">Role</th>
              <th class="px-5 py-3 font-medium text-right">Joined</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-farm-light">
            <tr
              v-for="u in filteredUsers"
              :key="u.id"
              class="hover:bg-farm-light transition-colors"
            >
              <td class="px-5 py-4">
                <p class="text-sm font-medium text-farm-dark">{{ u.full_name }}</p>
                <p class="text-[11px] text-farm-dark/45 truncate max-w-[220px]">{{ u.email }}</p>
              </td>
              <td class="px-5 py-4">
                <span class="text-[10px] font-medium tracking-[0.12em] uppercase text-farm-deep border border-farm-light px-2 py-1">
                  {{ u.role }}
                </span>
              </td>
              <td class="px-5 py-4 text-[11px] text-farm-dark/45 text-right tabular-nums">
                {{ formatDate(u.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredUsers.length === 0" class="py-16 text-center text-sm text-farm-dark/40">
          No users in this segment.
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Options } from 'highcharts'
import FarmChart from '~/components/ui/FarmChart.vue'

definePageMeta({ layout: 'admin' })

const { user } = useAuth()
const api = useApiFetch()
const { platformGrowthOptions, roleDonutOptions: buildRoleDonut, FARM } = useFarmChartTheme()

interface PlatformUser {
  id: string
  full_name: string
  email: string
  role: string
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
  roles?: {
    buyer: number
    seller: number
    delivery: number
    admin: number
  }
}

const activeFilter = ref('all')
const roleFilters = ['all', 'admin', 'seller', 'buyer', 'delivery']

const { data: analytics, pending: analyticsPending, refresh: refreshAnalytics } = await useAsyncData(
  'admin:analytics',
  () => api<AnalyticsPayload>('/api/admin/analytics'),
  { server: false },
)

const users = computed(() => analytics.value?.users ?? [])
const roleCounts = computed(() => analytics.value?.roles ?? {
  buyer: 0,
  seller: 0,
  delivery: 0,
  admin: 0,
})

const today = computed(() =>
  new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }),
)

const platformStats = computed(() => {
  const r = roleCounts.value
  return [
    {
      label: 'Active users',
      value: users.value.length,
      hint: 'Registered accounts',
      hintClass: 'text-farm-dark/40',
    },
    {
      label: 'Seller partners',
      value: r.seller,
      hint: 'Store operators',
      hintClass: 'text-farm-leaf',
    },
    {
      label: 'Buyer community',
      value: r.buyer,
      hint: 'Marketplace shoppers',
      hintClass: 'text-farm-leaf',
    },
    {
      label: 'Logistics fleet',
      value: r.delivery,
      hint: 'Delivery personnel',
      hintClass: 'text-farm-dark/40',
    },
  ]
})

const filteredUsers = computed(() => {
  if (activeFilter.value === 'all') return users.value
  return users.value.filter(u => u.role === activeFilter.value)
})

const growthChartOptions = computed<Options>(() => {
  const chart = analytics.value?.chart
  return platformGrowthOptions(
    chart?.categories ?? [],
    chart?.orderVolume ?? [],
    chart?.fulfilledVolume ?? [],
  )
})

const roleDonutChartOptions = computed<Options>(() => {
  const r = roleCounts.value
  const slices = [
    { name: 'Buyers', y: r.buyer, color: FARM.leaf },
    { name: 'Sellers', y: r.seller, color: FARM.deep },
    { name: 'Delivery', y: r.delivery, color: FARM.yellow },
    { name: 'Admin', y: r.admin, color: FARM.dark },
  ].filter(s => s.y > 0)

  if (!slices.length) {
    return buildRoleDonut([{ name: 'No users', y: 1, color: FARM.light }])
  }

  return buildRoleDonut(slices)
})

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

useHead({ title: 'Admin Dashboard — Senoro Green Farm' })
</script>
