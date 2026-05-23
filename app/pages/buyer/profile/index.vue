<template>
  <PageContainer class="space-y-12 py-8 md:py-12">
    <header class="border-b border-farm-light pb-8">
      <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-2">
        Your account
      </p>
      <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight">
        {{ user?.full_name ?? 'Account' }}
      </h1>
      <p class="text-sm text-farm-dark/50 mt-2">{{ user?.email }}</p>
    </header>

    <section class="border border-farm-light p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
      <div class="w-16 h-16 border border-farm-deep flex items-center justify-center text-xl font-medium text-farm-deep flex-shrink-0">
        {{ user?.full_name?.charAt(0).toUpperCase() ?? 'B' }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-[10px] font-medium tracking-[0.18em] uppercase text-farm-dark/45 mb-1">Member type</p>
        <p class="text-sm font-medium text-farm-dark capitalize">{{ user?.role ?? 'buyer' }}</p>
      </div>
    </section>

    <section class="border border-farm-light divide-y divide-farm-light">
      <NuxtLink
        to="/buyer/orders"
        class="flex items-center justify-between px-5 py-4 hover:bg-farm-light/30 transition-colors"
      >
        <div class="flex items-center gap-3 min-w-0">
          <Icon name="heroicons:clipboard-document-list" class="w-5 h-5 text-farm-deep stroke-[1.5] flex-shrink-0" />
          <div class="min-w-0">
            <p class="text-sm font-medium text-farm-dark">My orders</p>
            <p class="text-xs text-farm-dark/45 truncate">Purchase history and status</p>
          </div>
        </div>
        <Icon name="heroicons:chevron-right" class="w-4 h-4 text-farm-dark/30 flex-shrink-0" />
      </NuxtLink>
      <NuxtLink
        to="/buyer/profile/addresses"
        class="flex items-center justify-between px-5 py-4 hover:bg-farm-light/30 transition-colors"
      >
        <div class="flex items-center gap-3 min-w-0">
          <Icon name="heroicons:map-pin" class="w-5 h-5 text-farm-deep stroke-[1.5] flex-shrink-0" />
          <div class="min-w-0">
            <p class="text-sm font-medium text-farm-dark">Delivery addresses</p>
            <p class="text-xs text-farm-dark/45 truncate">Add, edit, and set default</p>
          </div>
        </div>
        <Icon name="heroicons:chevron-right" class="w-4 h-4 text-farm-dark/30 flex-shrink-0" />
      </NuxtLink>
      <div class="flex items-center justify-between px-5 py-4 hover:bg-farm-light/30 transition-colors">
        <div class="flex items-center gap-3 min-w-0">
          <Icon name="heroicons:question-mark-circle" class="w-5 h-5 text-farm-dark/50 stroke-[1.5] flex-shrink-0" />
          <div class="min-w-0">
            <p class="text-sm font-medium text-farm-dark">Help desk</p>
            <p class="text-xs text-farm-dark/45 truncate">Support and FAQ</p>
          </div>
        </div>
        <Icon name="heroicons:chevron-right" class="w-4 h-4 text-farm-dark/30 flex-shrink-0" />
      </div>
    </section>

    <button
      type="button"
      :disabled="loggingOut"
      class="w-full border border-red-200 text-red-700 py-3 text-xs font-medium tracking-[0.12em] uppercase hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      @click="handleLogout"
    >
      <Icon v-if="loggingOut" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
      <Icon v-else name="heroicons:arrow-right-on-rectangle" class="w-4 h-4 stroke-[1.5]" />
      <span>Sign out</span>
    </button>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '~/components/ui/PageContainer.vue'

definePageMeta({ layout: 'buyer' })

const { user, logout } = useAuth()
const router = useRouter()

const loggingOut = ref(false)

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

useHead({ title: 'My Profile — Senoro Green Farm' })
</script>
