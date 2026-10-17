<template>
  <div class="mx-auto w-full max-w-2xl space-y-5 py-6 md:space-y-6 md:py-8">
    <!-- Account -->
    <section class="flex items-center gap-4 rounded-md bg-farm-deep p-4 text-white md:p-5">
      <AccountAvatarUpload avatar-class="w-16 h-16 rounded-full bg-market-orange text-xl text-white" />
      <div class="min-w-0">
        <p class="truncate text-base font-semibold">{{ user?.full_name ?? 'Seller' }}</p>
        <p class="truncate text-sm text-white/75">{{ user?.email }}</p>
        <p class="mt-1">
          <span class="ui-pill bg-market-orange text-white">Seller</span>
          <span class="ml-1 text-xs text-white/60">Tap the photo to change it</span>
        </p>
      </div>
    </section>

    <!-- Numbers -->
    <section class="grid grid-cols-2 gap-3 md:gap-4">
      <UiStatCard label="Revenue" :value="metrics ? peso(metrics.totalRevenue ?? 0) : '—'" icon="heroicons:banknotes" />
      <UiStatCard label="Orders" :value="metrics ? metrics.totalOrders ?? 0 : '—'" icon="heroicons:shopping-bag" />
    </section>

    <!-- Shop name -->
    <section class="ui-card p-4 md:p-5">
      <form @submit.prevent="saveShopName">
        <label for="shop-name" class="ui-label">Shop name</label>
        <p class="-mt-1 mb-2 text-xs text-gray-400">The name buyers see on your shop page.</p>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input
            id="shop-name"
            v-model="shopName"
            type="text"
            required
            maxlength="160"
            placeholder="e.g. Negros Weekend Grill"
            class="ui-input sm:flex-1"
          >
          <button type="submit" class="ui-btn" :disabled="savingShopName || !shopName.trim()">
            {{ savingShopName ? 'Saving…' : 'Save' }}
          </button>
        </div>
        <p v-if="profileMessage" class="mt-2 text-sm" :class="profileMessageType === 'success' ? 'text-gray-500' : 'text-red-600'">
          {{ profileMessage }}
        </p>
      </form>
    </section>

    <!-- Links -->
    <ul class="ui-card divide-y divide-farm-leaf/10">
      <li>
        <NuxtLink to="/seller/settings" class="flex min-h-[56px] items-center gap-3 px-4 md:px-5">
          <Icon name="heroicons:cog-6-tooth" class="h-5 w-5 text-gray-400" />
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-shop-ink">Shop settings</span>
            <span class="block truncate text-xs text-gray-400">Photo, banner and pickup location</span>
          </span>
          <Icon name="heroicons:chevron-right" class="h-4 w-4 text-gray-300" />
        </NuxtLink>
      </li>
      <li v-if="user?.id">
        <NuxtLink :to="`/buyer/shop/${user.id}`" target="_blank" class="flex min-h-[56px] items-center gap-3 px-4 md:px-5">
          <Icon name="heroicons:building-storefront" class="h-5 w-5 text-gray-400" />
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-shop-ink">View my shop</span>
            <span class="block truncate text-xs text-gray-400">See your shop the way buyers do</span>
          </span>
          <Icon name="heroicons:arrow-top-right-on-square" class="h-4 w-4 text-gray-300" />
        </NuxtLink>
      </li>
    </ul>

    <button type="button" class="ui-btn-danger w-full" :disabled="loggingOut" @click="handleLogout">
      {{ loggingOut ? 'Signing out…' : 'Sign out' }}
    </button>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'seller' })

const { user, logout } = useAuth()
const router = useRouter()
const api = useApiFetch()

const { data: metrics } = await useAsyncData(
  'seller:profile-metrics',
  () => api<{ totalRevenue: number; totalOrders: number }>('/api/seller/metrics'),
  { server: false },
)
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

const peso = (n: number) => `₱${(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
    profileMessage.value = 'Shop name saved.'
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

useHead({ title: 'Profile — NFWM Seller' })
</script>
