<template>
  <ion-page>
    <ion-header class="buyer-header">
      <ion-toolbar class="buyer-toolbar">
        <div class="max-w-page mx-auto w-full px-4 md:px-8 flex items-center gap-3 py-2">
          <button
            v-if="isSubPage"
            type="button"
            @click="router.back()"
            class="p-2 -ml-1 text-farm-dark/60 hover:text-farm-dark transition-colors flex-shrink-0"
            aria-label="Go back"
          >
            <Icon name="heroicons:arrow-left" class="w-5 h-5 stroke-[1.5]" />
          </button>
          <img
            v-else
            src="/logo.png"
            class="w-7 h-7 object-cover flex-shrink-0"
            alt="Senoro"
          >

          <div
            v-if="showSearch"
            class="flex-1 flex items-center border border-farm-light bg-farm-light/30 px-3 py-2 gap-2 min-w-0"
          >
            <Icon name="heroicons:magnifying-glass" class="w-4 h-4 text-farm-dark/35 flex-shrink-0" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search produce…"
              class="bg-transparent text-sm text-farm-dark placeholder:text-farm-dark/35 flex-1 outline-none min-w-0"
            >
          </div>
          <div v-else class="flex-1 min-w-0">
            <h1 class="text-sm font-medium text-farm-dark tracking-tight truncate">
              {{ headerTitle }}
            </h1>
          </div>

          <button
            v-if="route.path !== '/buyer/cart'"
            type="button"
            class="relative p-2 text-farm-dark/60 hover:text-farm-deep transition-colors flex-shrink-0"
            aria-label="Cart"
            @click="router.push('/buyer/cart')"
          >
            <Icon name="heroicons:shopping-bag" class="w-5 h-5 stroke-[1.5]" />
            <span
              v-if="cartCount > 0"
              class="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-farm-deep text-white text-[9px] font-medium flex items-center justify-center"
            >
              {{ cartCount }}
            </span>
          </button>
          <div v-else class="w-9" />
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="buyer-ion-content">
      <AppShell with-tab-bar>
        <slot />
      </AppShell>
    </ion-content>

    <nav class="buyer-tab-bar">
      <div class="max-w-page mx-auto w-full flex">
        <button
          v-for="tab in tabs"
          :key="tab.path"
          type="button"
          class="buyer-tab-btn"
          :class="{ 'buyer-tab-btn--active': currentPath.startsWith(tab.path) }"
          @click="router.push(tab.path)"
        >
          <Icon
            :name="currentPath.startsWith(tab.path) ? tab.iconActive : tab.icon"
            class="w-5 h-5 stroke-[1.5]"
          />
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </nav>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonContent } from '@ionic/vue'
import AppShell from '~/components/ui/AppShell.vue'

const router = useRouter()
const route = useRoute()
const searchQuery = ref('')
const cartCount = ref(0)
const layoutReady = ref(false)

const currentPath = computed(() => route.path ?? '')

const subPageTitle = ref('')
provide('setSubPageTitle', (title: string) => {
  subPageTitle.value = title
})

watch(() => route.path, () => {
  subPageTitle.value = ''
})

const isSubPage = computed(() => {
  const primaryPaths = ['/buyer/dashboard', '/buyer/categories', '/buyer/cart', '/buyer/profile']
  return !primaryPaths.includes(currentPath.value)
})

const headerTitle = computed(() => {
  if (isSubPage.value) {
    if (currentPath.value === '/buyer/orders') return 'Orders'
    if (currentPath.value.startsWith('/buyer/shop/')) return subPageTitle.value || 'Shop'
    return subPageTitle.value || 'Senoro Green Farm'
  }
  if (currentPath.value === '/buyer/cart') return 'Cart'
  if (currentPath.value === '/buyer/profile') return 'Profile'
  return ''
})

const showSearch = computed(() => {
  return currentPath.value === '/buyer/dashboard' || currentPath.value === '/buyer/categories'
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
  { label: 'Home', path: '/buyer/dashboard', icon: 'heroicons:home', iconActive: 'heroicons:home-solid' },
  { label: 'Shop', path: '/buyer/categories', icon: 'heroicons:squares-2x2', iconActive: 'heroicons:squares-2x2-solid' },
  { label: 'Cart', path: '/buyer/cart', icon: 'heroicons:shopping-bag', iconActive: 'heroicons:shopping-bag-solid' },
  { label: 'Account', path: '/buyer/profile', icon: 'heroicons:user', iconActive: 'heroicons:user-solid' },
]

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
  --background: #ffffff;
  --border-color: #EEF5EE;
  --min-height: 52px;
}

.buyer-ion-content {
  --background: #EEF5EE;
}

.buyer-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: #fff;
  border-top: 1px solid #EEF5EE;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.buyer-tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 4px 12px;
  color: rgba(26, 53, 33, 0.4);
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
  color: #2F5D3A;
}
</style>
