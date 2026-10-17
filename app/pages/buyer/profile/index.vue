<template>
  <div class="mx-auto max-w-3xl space-y-5 py-6 md:py-10">
    <!-- Account header -->
    <section class="relative overflow-hidden rounded-2xl bg-shop-mint p-6 md:p-8">
      <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/40" aria-hidden="true" />
      <div class="relative flex items-center gap-4 md:gap-5">
        <AccountAvatarUpload avatar-class="h-16 w-16 rounded-full bg-farm-leaf text-2xl text-white ring-4 ring-white md:h-20 md:w-20 md:text-3xl" />
        <div class="min-w-0">
          <h1 class="truncate text-xl font-bold tracking-tight text-shop-ink md:text-2xl">{{ user?.full_name ?? 'My account' }}</h1>
          <p class="truncate text-sm text-gray-600">{{ user?.email }}</p>
          <span class="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-farm-leaf ring-1 ring-farm-leaf/20">
            <Icon name="heroicons:shopping-bag" class="h-3.5 w-3.5" />
            Buyer account
          </span>
        </div>
      </div>
    </section>

    <!-- My purchases -->
    <section class="card">
      <div class="flex items-center justify-between">
        <h2 class="card-title">My purchases</h2>
        <NuxtLink to="/buyer/orders" class="inline-flex items-center gap-0.5 text-sm text-gray-500 hover:text-farm-leaf">
          View all
          <Icon name="heroicons:chevron-right" class="h-4 w-4" />
        </NuxtLink>
      </div>
      <div class="mt-5 grid grid-cols-4 gap-2">
        <NuxtLink
          v-for="group in ORDER_GROUPS"
          :key="group.key"
          :to="{ path: '/buyer/orders', query: { status: group.key } }"
          class="group flex flex-col items-center gap-2 rounded-xl py-2 text-center transition hover:bg-gray-50"
        >
          <span class="relative flex h-11 w-11 items-center justify-center rounded-full bg-shop-mint text-farm-leaf transition group-hover:bg-farm-leaf group-hover:text-white">
            <Icon :name="group.icon" class="h-6 w-6" />
            <span
              v-if="counts[group.key]"
              class="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-market-orange px-1 text-[10px] font-bold text-white ring-2 ring-white"
            >
              {{ counts[group.key] }}
            </span>
          </span>
          <span class="text-xs font-medium text-gray-700">{{ group.label }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- Default address -->
    <section class="card">
      <div class="flex items-center justify-between">
        <h2 class="card-title">Delivery address</h2>
        <NuxtLink to="/buyer/profile/addresses" class="inline-flex items-center gap-0.5 text-sm text-gray-500 hover:text-farm-leaf">
          {{ defaultAddress ? 'Manage' : 'Add' }}
          <Icon name="heroicons:chevron-right" class="h-4 w-4" />
        </NuxtLink>
      </div>

      <div v-if="loading" class="mt-4 h-14 animate-pulse rounded-lg bg-gray-100" />

      <div v-else-if="defaultAddress" class="mt-4 flex items-start gap-3">
        <span class="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-market-orange/10 text-market-orange">
          <Icon name="heroicons:map-pin-solid" class="h-5 w-5" />
        </span>
        <div class="min-w-0 text-sm">
          <p class="font-medium text-shop-ink">
            {{ defaultAddress.full_name }}
            <span class="font-normal text-gray-400">· {{ defaultAddress.phone_number }}</span>
          </p>
          <p class="mt-0.5 text-gray-600">{{ defaultAddress.detailed_address }}</p>
          <p class="text-gray-500">Brgy. {{ defaultAddress.barangay }}, {{ defaultAddress.city }}</p>
          <p v-if="addressCount > 1" class="mt-1 text-xs text-gray-400">+ {{ addressCount - 1 }} more saved</p>
        </div>
      </div>

      <NuxtLink
        v-else
        to="/buyer/profile/addresses"
        class="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100"
      >
        <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 flex-shrink-0 text-amber-500" />
        Add a delivery address so you can check out.
      </NuxtLink>
    </section>

    <!-- Menu -->
    <section class="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white ring-1 ring-gray-100">
      <NuxtLink v-for="item in menu" :key="item.to" :to="item.to" class="menu-row">
        <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
          <Icon :name="item.icon" class="h-5 w-5" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-medium text-shop-ink">{{ item.label }}</span>
          <span class="block truncate text-xs text-gray-500">{{ item.caption }}</span>
        </span>
        <Icon name="heroicons:chevron-right" class="h-5 w-5 flex-shrink-0 text-gray-300" />
      </NuxtLink>
    </section>

    <button
      type="button"
      :disabled="loggingOut"
      class="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
      @click="handleLogout"
    >
      <Icon :name="loggingOut ? 'heroicons:arrow-path' : 'heroicons:arrow-right-on-rectangle'" class="h-5 w-5" :class="loggingOut ? 'animate-spin' : ''" />
      {{ loggingOut ? 'Signing out…' : 'Sign out' }}
    </button>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'buyer' })

interface AddressRow {
  id: string
  full_name: string
  phone_number: string
  city: string
  barangay: string
  detailed_address: string
  is_default: boolean
}

const { user, logout } = useAuth()
const router = useRouter()
const api = useApiFetch()

const loggingOut = ref(false)
const loading = ref(true)
const orders = ref<{ status: string }[]>([])
const addresses = ref<AddressRow[]>([])

const counts = computed(() => countOrdersByGroup(orders.value))
const defaultAddress = computed(() => addresses.value.find(a => a.is_default) ?? addresses.value[0] ?? null)
const addressCount = computed(() => addresses.value.length)

const menu = [
  { label: 'My orders', caption: 'Track parcels and leave reviews', icon: 'heroicons:clipboard-document-list', to: '/buyer/orders' },
  { label: 'Delivery addresses', caption: 'Add, edit, pin on map, set default', icon: 'heroicons:map-pin', to: '/buyer/profile/addresses' },
  { label: 'My cart', caption: 'Items waiting for checkout', icon: 'heroicons:shopping-cart', to: '/buyer/cart' },
  { label: 'Browse the market', caption: 'Fresh products and local shops', icon: 'heroicons:building-storefront', to: '/' },
]

async function load() {
  loading.value = true
  const [ordersRes, addressesRes] = await Promise.allSettled([
    api<{ orders: { status: string }[] }>('/api/buyer/orders'),
    api<{ addresses: AddressRow[] }>('/api/buyer/addresses'),
  ])
  orders.value = ordersRes.status === 'fulfilled' ? (ordersRes.value.orders ?? []) : []
  addresses.value = addressesRes.status === 'fulfilled' ? (addressesRes.value.addresses ?? []) : []
  loading.value = false
}

async function handleLogout() {
  loggingOut.value = true
  try {
    await logout()
    router.push('/auth/login')
  }
  catch (err) {
    console.error('Logout error:', err)
  }
  finally {
    loggingOut.value = false
  }
}

onMounted(load)

useHead({ title: 'My account — NFWM' })
</script>

<style scoped>
.card {
  @apply rounded-2xl bg-white p-5 ring-1 ring-gray-100 md:p-6;
}
.card-title {
  @apply text-base font-semibold text-shop-ink;
}
.menu-row {
  @apply flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50 md:px-6;
}
</style>
