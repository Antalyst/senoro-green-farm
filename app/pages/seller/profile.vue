<template>
  <PageContainer class="space-y-12 py-8 md:py-12">
    <header class="border-b-4 border-farm-dark pb-8">
      <p class="text-[10px] font-bold tracking-[0.2em] uppercase text-market-orange mb-2">
        Seller Headquarters
      </p>
      <h1 class="text-3xl md:text-4xl font-black text-farm-dark tracking-tight">
        {{ user?.full_name ?? 'Seller profile' }}
      </h1>
      <p class="text-base font-bold text-farm-dark/50 mt-2">{{ user?.email }}</p>
    </header>

    <section class="border-2 border-farm-dark p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-6 shadow-sm bg-white">
      <div class="w-20 h-20 border-4 border-farm-dark bg-farm-dark text-white flex items-center justify-center text-3xl font-black flex-shrink-0">
        {{ user?.full_name?.charAt(0).toUpperCase() ?? 'S' }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-[10px] font-bold tracking-[0.2em] uppercase text-farm-dark/60 mb-2">Role</p>
        <p class="text-lg font-black text-farm-dark uppercase tracking-widest">{{ user?.role ?? 'seller' }}</p>
      </div>
    </section>

    <section class="border-2 border-farm-dark p-6 md:p-8 bg-white shadow-sm">
      <div class="mb-5">
        <p class="text-[10px] font-bold tracking-[0.2em] uppercase text-farm-dark/60 mb-2">Shop settings</p>
        <h2 class="text-xl font-black text-farm-dark tracking-tight">Storefront name</h2>
        <p class="text-sm font-medium text-farm-dark/55 mt-1">This is the public shop name buyers see on your storefront.</p>
      </div>
      <form class="flex flex-col gap-3 sm:flex-row" @submit.prevent="saveShopName">
        <input
          v-model="shopName"
          type="text"
          required
          maxlength="160"
          placeholder="e.g. Negros Weekend Grill"
          class="min-w-0 flex-1 border-2 border-farm-dark px-4 py-3 text-sm font-bold text-farm-dark outline-none focus:border-market-orange"
        >
        <button
          type="submit"
          :disabled="savingShopName || !shopName.trim()"
          class="border-2 border-farm-dark bg-farm-dark px-6 py-3 text-xs font-black uppercase tracking-[0.15em] text-white hover:bg-market-orange transition-colors disabled:opacity-50"
        >
          {{ savingShopName ? 'Saving...' : 'Save shop' }}
        </button>
      </form>
      <p v-if="profileMessage" class="mt-3 text-xs font-bold" :class="profileMessageType === 'success' ? 'text-farm-leaf' : 'text-red-600'">
        {{ profileMessage }}
      </p>
    </section>

    <section class="grid grid-cols-1 sm:grid-cols-2 gap-px bg-farm-dark border-2 border-farm-dark shadow-sm">
      <div class="bg-white p-6 md:p-8">
        <p class="text-[10px] font-bold tracking-[0.18em] uppercase text-farm-dark/60 mb-2">Revenue</p>
        <p class="text-3xl font-black text-market-orange tabular-nums">
          ₱{{ (metrics?.totalRevenue ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </p>
      </div>
      <div class="bg-white p-6 md:p-8">
        <p class="text-[10px] font-bold tracking-[0.18em] uppercase text-farm-dark/60 mb-2">Orders</p>
        <p class="text-3xl font-black text-farm-dark tabular-nums">
          {{ metrics?.totalOrders ?? 0 }}
        </p>
      </div>
    </section>

    <section class="border-2 border-farm-dark divide-y-2 divide-farm-dark bg-white">
      <div class="flex items-center justify-between px-6 py-5 hover:bg-farm-light/50 transition-colors cursor-pointer group">
        <div class="flex items-center gap-4 min-w-0">
          <Icon name="heroicons:shopping-bag" class="w-7 h-7 text-farm-dark group-hover:text-market-orange transition-colors flex-shrink-0" />
          <div class="min-w-0">
            <p class="text-lg font-bold text-farm-dark">Shop profile</p>
            <p class="text-sm font-medium text-farm-dark/60 truncate mt-1">Name and farm address</p>
          </div>
        </div>
        <Icon name="heroicons:chevron-right" class="w-6 h-6 text-farm-dark/30 group-hover:text-market-orange transition-colors flex-shrink-0" />
      </div>
      <div class="flex items-center justify-between px-6 py-5 hover:bg-farm-light/50 transition-colors cursor-pointer group">
        <div class="flex items-center gap-4 min-w-0">
          <Icon name="heroicons:cog-6-tooth" class="w-7 h-7 text-farm-dark group-hover:text-market-orange transition-colors flex-shrink-0" />
          <div class="min-w-0">
            <p class="text-lg font-bold text-farm-dark">Account settings</p>
            <p class="text-sm font-medium text-farm-dark/60 truncate mt-1">Password and notifications</p>
          </div>
        </div>
        <Icon name="heroicons:chevron-right" class="w-6 h-6 text-farm-dark/30 group-hover:text-market-orange transition-colors flex-shrink-0" />
      </div>
      <div class="flex items-center justify-between px-6 py-5 hover:bg-farm-light/50 transition-colors cursor-pointer group">
        <div class="flex items-center gap-4 min-w-0">
          <Icon name="heroicons:question-mark-circle" class="w-7 h-7 text-farm-dark group-hover:text-market-orange transition-colors flex-shrink-0" />
          <div class="min-w-0">
            <p class="text-lg font-bold text-farm-dark">Help & support</p>
            <p class="text-sm font-medium text-farm-dark/60 truncate mt-1">FAQ and contact</p>
          </div>
        </div>
        <Icon name="heroicons:chevron-right" class="w-6 h-6 text-farm-dark/30 group-hover:text-market-orange transition-colors flex-shrink-0" />
      </div>
    </section>

    <button
      type="button"
      :disabled="loggingOut"
      class="w-full border-2 border-red-700 bg-white text-red-700 py-4 text-xs font-black tracking-[0.15em] uppercase hover:bg-red-700 hover:text-white transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
      @click="handleLogout"
    >
      <Icon v-if="loggingOut" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
      <Icon v-else name="heroicons:arrow-right-on-rectangle" class="w-5 h-5" />
      <span>Sign out</span>
    </button>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '~/components/ui/PageContainer.vue'

definePageMeta({ layout: 'seller' })

const { user, logout } = useAuth()
const router = useRouter()
const api = useApiFetch()

const { data: metrics } = await useAsyncData('seller:profile-metrics', () => api('/api/seller/metrics'), { server: false })
const { data: sellerProfile, refresh: refreshSellerProfile } = await useAsyncData(
  'seller:profile-settings',
  () => api<{ seller: { shop_name?: string | null } }>('/api/seller/profile'),
  { server: false },
)

const loggingOut = ref(false)
const savingShopName = ref(false)
const shopName = ref('')
const profileMessage = ref('')
const profileMessageType = ref<'success' | 'error'>('success')

watchEffect(() => {
  shopName.value = sellerProfile.value?.seller?.shop_name ?? user.value?.full_name ?? ''
})

async function saveShopName() {
  savingShopName.value = true
  profileMessage.value = ''
  try {
    await api('/api/seller/profile', {
      method: 'PUT',
      body: { shop_name: shopName.value },
    })
    await refreshSellerProfile()
    profileMessageType.value = 'success'
    profileMessage.value = 'Shop name updated.'
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    profileMessageType.value = 'error'
    profileMessage.value = e.data?.statusMessage || 'Failed to update shop name.'
  }
  finally {
    savingShopName.value = false
  }
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

useHead({ title: 'Seller Profile — Senoro Green Farm' })
</script>
