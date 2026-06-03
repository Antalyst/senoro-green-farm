<template>
  <ion-page>
    <ion-header class="buyer-header sticky top-0 z-50 bg-white shadow-sm border-b border-farm-light">
      <ion-toolbar class="buyer-toolbar bg-transparent text-farm-dark">
        <div class="max-w-page mx-auto w-full px-4 md:px-8 flex items-center gap-4 py-3">
          <button
            v-if="isSubPage"
            type="button"
            @click="router.back()"
            class="p-2 -ml-1 text-farm-dark/60 hover:text-farm-dark transition-colors flex-shrink-0"
            aria-label="Go back"
          >
            <Icon name="heroicons:arrow-left" class="w-5 h-5 stroke-[1.5]" />
          </button>
          <NuxtLink v-else to="/" class="flex-shrink-0 flex items-center gap-2">
            <img
              src="/logo2.png"
              class="w-8 h-8 object-contain"
              alt="Senoro"
            >
            <span class="hidden lg:block text-lg font-black text-market-orange tracking-tight">Senoro</span>
          </NuxtLink>

          <div
            v-if="showSearch"
            class="flex-1 flex items-center bg-farm-light/50 px-3 py-2 gap-2 min-w-0 rounded border border-farm-light"
          >
            <Icon name="heroicons:magnifying-glass" class="w-4 h-4 text-farm-dark/50 flex-shrink-0" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search for fresh produce or street food…"
              class="bg-transparent text-sm text-farm-dark placeholder:text-farm-dark/50 flex-1 outline-none min-w-0"
            >
          </div>
          <div v-else class="flex-1 min-w-0 flex items-center gap-4">
            <h1 class="text-sm font-bold text-farm-dark tracking-tight truncate mr-2">
              {{ headerTitle }}
            </h1>
          </div>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center gap-6 ml-4">
            <NuxtLink
              v-for="tab in desktopTabs"
              :key="tab.path"
              :to="tab.path"
              class="text-xs font-bold tracking-[0.15em] uppercase transition-colors"
              :class="currentPath === tab.path || (tab.path !== '/' && currentPath.startsWith(tab.path))
                ? 'text-market-orange border-b-2 border-market-orange py-1'
                : 'text-farm-dark hover:text-market-orange py-1'"
            >
              {{ tab.label }}
            </NuxtLink>
          </nav>

          <div class="flex items-center gap-2 ml-4">
            <!-- Cart Icon -->
            <button
              v-if="route.path !== '/buyer/cart' && route.path !== '/buyer/checkout'"
              type="button"
              class="relative p-2 text-farm-dark hover:text-market-orange transition-colors flex-shrink-0"
              aria-label="Cart"
              @click="router.push('/buyer/cart')"
            >
              <Icon name="heroicons:shopping-cart" class="w-6 h-6" />
              <span
                v-if="cartCount > 0"
                class="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-market-orange text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-sm ring-2 ring-white"
              >
                {{ cartCount }}
              </span>
            </button>
            <div v-else class="w-10" />

            <!-- Profile Avatar -->
            <NuxtLink
              to="/buyer/profile"
              class="hidden md:flex w-9 h-9 ml-2 rounded-full border-2 border-farm-dark bg-farm-light items-center justify-center text-farm-dark hover:border-market-orange hover:text-market-orange transition-colors flex-shrink-0 overflow-hidden"
              title="Your Profile"
            >
              <span class="text-sm font-black uppercase">{{ user?.full_name?.charAt(0) || 'U' }}</span>
            </NuxtLink>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="buyer-ion-content bg-white">
      <AppShell with-tab-bar>
        <!-- Minimalist Page Loader (Global) -->
        <div v-if="isLoading" class="absolute top-0 left-0 right-0 h-0.5 bg-market-orange animate-pulse z-50" />
        <slot />
      </AppShell>
    </ion-content>

    <nav class="buyer-tab-bar md:hidden">
      <div class="max-w-page mx-auto w-full flex">
        <button
          v-for="tab in tabs"
          :key="tab.path"
          type="button"
          class="buyer-tab-btn"
          :class="{ 'buyer-tab-btn--active': currentPath === tab.path || (tab.path !== '/' && currentPath.startsWith(tab.path)) }"
          @click="router.push(tab.path)"
        >
          <div class="relative">
            <Icon
              :name="currentPath === tab.path || (tab.path !== '/' && currentPath.startsWith(tab.path)) ? tab.iconActive : tab.icon"
              class="w-5 h-5 stroke-[1.5]"
            />
            <span v-if="currentPath === tab.path || (tab.path !== '/' && currentPath.startsWith(tab.path))" class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-market-orange"></span>
          </div>
          <span class="mt-1">{{ tab.label }}</span>
        </button>
      </div>
    </nav>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonContent } from '@ionic/vue'
import AppShell from '~/components/ui/AppShell.vue'

const { user } = useAuth()
const router = useRouter()
const route = useRoute()
const searchQuery = ref('')
const cartCount = ref(0)
const layoutReady = ref(false)
const isLoading = ref(false)

// Global loader hooking into Nuxt page transitions
const nuxtApp = useNuxtApp()
nuxtApp.hook('page:start', () => { isLoading.value = true })
nuxtApp.hook('page:finish', () => { isLoading.value = false })

const currentPath = computed(() => route.path ?? '')

const subPageTitle = ref('')
provide('setSubPageTitle', (title: string) => {
  subPageTitle.value = title
})

watch(() => route.path, () => {
  subPageTitle.value = ''
})

const isSubPage = computed(() => {
  const primaryPaths = ['/', '/buyer/categories', '/buyer/cart', '/buyer/profile']
  return !primaryPaths.includes(currentPath.value)
})

const headerTitle = computed(() => {
  if (isSubPage.value) {
    if (currentPath.value === '/buyer/orders') return 'Orders'
    if (currentPath.value.startsWith('/buyer/orders/')) return subPageTitle.value || 'Order tracking'
    if (currentPath.value === '/buyer/profile/addresses') return 'Addresses'
    if (currentPath.value.startsWith('/buyer/shop/')) return subPageTitle.value || 'Shop'
    return subPageTitle.value || 'Senoro Green Farm'
  }
  if (currentPath.value === '/buyer/cart') return 'Cart'
  if (currentPath.value === '/buyer/profile') return 'Profile'
  return ''
})

const showSearch = computed(() => {
  return currentPath.value === '/' || currentPath.value === '/buyer/categories'
})

async function refreshCartCount() {
  try {
    const api = useApiFetch()
    const data = await api<{ cart_items?: unknown[] } | unknown[]>('/api/cart')
    if (Array.isArray(data)) {
      cartCount.value = data.length
    }
    else {
      cartCount.value = data?.cart_items?.length ?? 0
    }
  }
  catch {
    cartCount.value = 0
  }
}

provide('refreshCartCount', refreshCartCount)

const tabs = [
  { label: 'Home', path: '/', icon: 'heroicons:home', iconActive: 'heroicons:home-solid' },
  { label: 'Shop', path: '/buyer/categories', icon: 'heroicons:squares-2x2', iconActive: 'heroicons:squares-2x2-solid' },
  { label: 'Orders', path: '/buyer/orders', icon: 'heroicons:clipboard-document-list', iconActive: 'heroicons:clipboard-document-list-solid' },
  { label: 'Cart', path: '/buyer/cart', icon: 'heroicons:shopping-bag', iconActive: 'heroicons:shopping-cart-solid' },
  { label: 'Profile', path: '/buyer/profile', icon: 'heroicons:user', iconActive: 'heroicons:user-solid' },
]

const desktopTabs = tabs.filter(t => ['/', '/buyer/categories', '/buyer/orders'].includes(t.path))

onMounted(() => {
  searchQuery.value = (route.query.search as string) || ''
  layoutReady.value = true
  refreshCartCount()
})

watch(searchQuery, (newVal) => {
  if (!layoutReady.value) return
  router.replace({ query: { ...route.query, search: newVal || undefined } })
})

watch(() => route.query.search, (newVal) => {
  const next = (newVal as string) || ''
  if (searchQuery.value !== next) searchQuery.value = next
})
</script>

<style scoped>
.buyer-header ion-toolbar {
  --background: transparent;
  --min-height: 52px;
}

.buyer-ion-content {
  --background: #ffffff;
}

.buyer-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: #1A3521;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.buyer-tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 10px 4px 14px;
  color: rgba(255, 255, 255, 0.4);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: color 0.2s ease;
}

.buyer-tab-btn--active {
  color: #E67E22;
}
</style>
