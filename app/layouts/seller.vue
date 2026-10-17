<template>
  <ion-page>
    <div class="flex h-full w-full bg-white">
      <!-- Desktop sidebar (md+). Phones use the bottom tab bar + "More" sheet instead. -->
      <aside class="hidden w-60 flex-shrink-0 flex-col bg-farm-deep text-white md:flex" aria-label="Seller navigation">
        <NuxtLink to="/seller/dashboard" class="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <img src="/logo2.png" alt="NFWM" class="h-8 w-8 object-contain">
          <span class="text-base font-bold tracking-tight text-white">NFWM</span>
          <span class="rounded bg-market-orange px-1.5 py-0.5 text-[11px] font-semibold text-white">Seller</span>
        </NuxtLink>

        <div class="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <AccountAvatar
            :name="shopName"
            :url="shop.shop_avatar_url"
            class="h-10 w-10 rounded-full bg-market-orange text-sm text-white"
          />
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-white">{{ shopName }}</p>
            <NuxtLink v-if="user?.id" :to="`/buyer/shop/${user.id}`" target="_blank" class="text-xs text-white/60 hover:text-market-orange">
              View my shop
            </NuxtLink>
          </div>
        </div>

        <nav class="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          <div v-for="group in navGroups" :key="group.label">
            <p class="mb-1 px-3 text-xs text-white/45">{{ group.label }}</p>
            <ul>
              <li v-for="item in group.items" :key="item.path">
                <NuxtLink
                  :to="item.path"
                  class="flex items-center gap-3 rounded border-l-2 px-3 py-2 text-sm transition-colors"
                  :class="isActive(item.path) ? 'border-market-orange bg-white/10 font-medium text-white' : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'"
                >
                  <Icon :name="item.icon" class="h-5 w-5 flex-shrink-0" :class="isActive(item.path) ? 'text-market-orange' : 'text-white/50'" />
                  <span class="flex-1">{{ item.label }}</span>
                  <span v-if="item.badge && item.badge() > 0" class="min-w-[20px] rounded-full bg-market-orange px-1.5 py-0.5 text-center text-[10px] font-semibold text-white">{{ item.badge() }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </nav>

        <div class="border-t border-white/10 p-3">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            @click="handleLogout"
          >
            <Icon name="heroicons:arrow-left-on-rectangle" class="h-5 w-5 text-white/50" />
            Sign out
          </button>
        </div>
      </aside>

      <!-- Main column -->
      <div class="flex min-w-0 flex-1 flex-col">
        <ion-header class="seller-header">
          <ion-toolbar>
            <div class="flex h-14 items-center gap-3 px-4 md:h-16 md:px-8">
              <img src="/logo2.png" alt="" class="h-8 w-8 object-contain md:hidden">
              <h1 class="min-w-0 flex-1 truncate text-base font-semibold text-white md:text-lg md:text-farm-deep">{{ currentTitle }}</h1>

              <button
                type="button"
                class="relative flex h-10 w-10 items-center justify-center rounded text-white/85 hover:text-white md:text-farm-deep md:hover:text-farm-leaf"
                aria-label="Notifications"
                @click.stop="toggleNotificationModal"
              >
                <Icon name="heroicons:bell" class="h-6 w-6" />
                <span
                  v-if="unreadCount > 0"
                  class="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-market-orange px-1 text-[10px] font-semibold text-white"
                >
                  {{ unreadCount }}
                </span>
              </button>

              <button
                type="button"
                class="hidden items-center gap-2 rounded py-1 pl-1 pr-2 text-gray-600 hover:text-shop-ink md:flex"
                aria-label="Account menu"
                @click="showProfileMenu = !showProfileMenu"
              >
                <AccountAvatar :name="user?.full_name" :url="user?.avatar_url" fallback="S" class="h-8 w-8 rounded-full bg-farm-leaf text-xs text-white" />
                <span class="hidden max-w-[140px] truncate text-sm lg:block">{{ user?.full_name }}</span>
                <Icon name="heroicons:chevron-down" class="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </ion-toolbar>
        </ion-header>

        <ion-content class="seller-ion-content">
          <AppShell with-tab-bar tinted>
            <slot />
          </AppShell>
        </ion-content>
      </div>
    </div>

    <!-- Phones: bottom tab bar -->
    <nav class="seller-tab-bar md:hidden" aria-label="Seller navigation">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="seller-tab"
        :class="{ 'seller-tab--active': isActive(tab.path) }"
      >
        <span class="relative">
          <Icon :name="isActive(tab.path) ? tab.iconActive : tab.icon" class="h-6 w-6" />
          <span
            v-if="tab.badge && tab.badge() > 0"
            class="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-market-orange px-1 text-[10px] font-semibold text-white"
          >
            {{ tab.badge() }}
          </span>
        </span>
        {{ tab.label }}
      </NuxtLink>
      <button type="button" class="seller-tab" :class="{ 'seller-tab--active': moreActive }" @click="showMore = true">
        <Icon name="heroicons:bars-3" class="h-6 w-6" />
        More
      </button>
    </nav>

    <!-- Phones: "More" sheet -->
    <UiSheet :open="showMore" title="More" @close="showMore = false">
      <div class="-mx-4 -mt-4">
        <div class="flex items-center gap-3 bg-farm-deep px-4 py-4">
          <AccountAvatar :name="shopName" :url="shop.shop_avatar_url" class="h-11 w-11 rounded-full bg-market-orange text-sm text-white" />
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-white">{{ shopName }}</p>
            <p class="truncate text-xs text-white/60">{{ user?.email }}</p>
          </div>
        </div>
        <ul class="divide-y divide-gray-100">
          <li v-for="item in moreLinks" :key="item.label">
            <NuxtLink
              :to="item.path"
              :target="item.external ? '_blank' : undefined"
              class="flex min-h-[52px] items-center gap-3 px-4 text-sm text-shop-ink"
              @click="showMore = false"
            >
              <Icon :name="item.icon" class="h-5 w-5 text-farm-leaf" />
              <span class="flex-1">{{ item.label }}</span>
              <Icon name="heroicons:chevron-right" class="h-4 w-4 text-gray-300" />
            </NuxtLink>
          </li>
          <li>
            <button type="button" class="flex min-h-[52px] w-full items-center gap-3 px-4 text-left text-sm text-red-600" @click="handleLogout">
              <Icon name="heroicons:arrow-left-on-rectangle" class="h-5 w-5" />
              Sign out
            </button>
          </li>
        </ul>
      </div>
    </UiSheet>

    <!-- Desktop account menu -->
    <div
      v-if="showProfileMenu"
      class="fixed right-8 top-16 z-[95] w-60 rounded-md border border-gray-100 bg-white py-1"
    >
      <div class="border-b border-gray-100 px-4 py-3">
        <p class="truncate text-sm font-medium text-shop-ink">{{ user?.full_name }}</p>
        <p class="truncate text-xs text-gray-400">{{ user?.email }}</p>
      </div>
      <NuxtLink
        to="/seller/settings"
        class="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:text-shop-ink"
        @click="showProfileMenu = false"
      >
        <Icon name="heroicons:cog-6-tooth" class="h-4 w-4 text-gray-400" />
        Shop settings
      </NuxtLink>
      <button
        type="button"
        class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-600 hover:text-red-600"
        @click="handleLogout"
      >
        <Icon name="heroicons:arrow-left-on-rectangle" class="h-4 w-4 text-gray-400" />
        Sign out
      </button>
    </div>
    <div v-if="showProfileMenu" class="fixed inset-0 z-[94]" @click="showProfileMenu = false" />

    <NotificationInbox
      :open="isNotificationModalOpen"
      :notifications="notifications"
      :unread-count="unreadCount"
      :pending="pending"
      empty-text="Order alerts will appear here."
      @close="isNotificationModalOpen = false"
      @select="openNotification"
      @read-all="markAllAsRead"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonContent } from '@ionic/vue'
import AppShell from '~/components/ui/AppShell.vue'
import type { MarketplaceNotification } from '~/composables/useNotificationEngine'

interface NavItem {
  label: string
  path: string
  icon: string
  iconActive: string
  badge?: () => number
}

const { user, logout } = useAuth()
const router = useRouter()
const route = useRoute()
const api = useApiFetch()

const showMore = ref(false)
const showProfileMenu = ref(false)
const isNotificationModalOpen = ref(false)
const pendingOrderCount = ref(0)
const shop = ref<{ shop_name?: string | null; shop_avatar_url?: string | null }>({})

const { notifications, unreadCount, pending, fetchNotifications, markAllAsRead } = useNotificationEngine()

const nav = {
  dashboard: { label: 'Dashboard', path: '/seller/dashboard', icon: 'heroicons:squares-2x2', iconActive: 'heroicons:squares-2x2-solid' },
  orders: { label: 'Orders', path: '/seller/orders', icon: 'heroicons:clipboard-document-list', iconActive: 'heroicons:clipboard-document-list-solid', badge: () => pendingOrderCount.value },
  reviews: { label: 'Reviews', path: '/seller/reviews', icon: 'heroicons:star', iconActive: 'heroicons:star-solid' },
  inventory: { label: 'Inventory', path: '/seller/inventory', icon: 'heroicons:archive-box', iconActive: 'heroicons:archive-box-solid' },
  profile: { label: 'Profile', path: '/seller/profile', icon: 'heroicons:user-circle', iconActive: 'heroicons:user-circle-solid' },
  settings: { label: 'Shop settings', path: '/seller/settings', icon: 'heroicons:cog-6-tooth', iconActive: 'heroicons:cog-6-tooth-solid' },
} satisfies Record<string, NavItem>

const navGroups: { label: string; items: NavItem[] }[] = [
  { label: 'Overview', items: [nav.dashboard] },
  { label: 'Sales', items: [nav.orders, nav.reviews] },
  { label: 'Products', items: [nav.inventory] },
  { label: 'Shop', items: [nav.profile, nav.settings] },
]

const tabs: NavItem[] = [
  { ...nav.dashboard, label: 'Home' },
  nav.orders,
  { ...nav.inventory, label: 'Products' },
  nav.reviews,
]

const moreLinks = computed(() => [
  { label: 'Profile', path: nav.profile.path, icon: nav.profile.icon, external: false },
  { label: 'Shop settings', path: nav.settings.path, icon: nav.settings.icon, external: false },
  ...(user.value?.id
    ? [{ label: 'View my shop', path: `/buyer/shop/${user.value.id}`, icon: 'heroicons:building-storefront', external: true }]
    : []),
])

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

const moreActive = computed(() => isActive(nav.profile.path) || isActive(nav.settings.path))

const currentTitle = computed(() => {
  for (const group of navGroups) {
    const item = group.items.find(i => isActive(i.path))
    if (item) return item.label
  }
  return 'Seller Centre'
})

const shopName = computed(() => shop.value.shop_name || user.value?.shop_name || user.value?.full_name || 'My shop')

async function loadShop() {
  try {
    const res = await api<{ seller: { shop_name?: string | null; shop_avatar_url?: string | null } }>('/api/seller/profile')
    shop.value = res.seller
  }
  catch { /* falls back to the user name */ }
}

async function loadPendingOrders() {
  try {
    const res = await api<{ orders: { seller_confirmed?: boolean }[] }>('/api/seller/orders')
    pendingOrderCount.value = (res.orders ?? []).filter(o => !o.seller_confirmed).length
  }
  catch {
    pendingOrderCount.value = 0
  }
}

const toggleNotificationModal = () => {
  isNotificationModalOpen.value = !isNotificationModalOpen.value
  if (isNotificationModalOpen.value) fetchNotifications()
}

async function markSingleAsRead(id: string) {
  await api(`/api/notifications/${id}`, { method: 'PATCH', body: { is_read: true } })
  await fetchNotifications()
}

// Seller notifications are about orders: open the Orders page.
async function openNotification(notification: MarketplaceNotification) {
  if (!notification.is_read) await markSingleAsRead(notification.id)
  if (notification.order_id) {
    isNotificationModalOpen.value = false
    await router.push('/seller/orders')
  }
}

async function handleLogout() {
  showProfileMenu.value = false
  showMore.value = false
  await logout()
  router.push('/')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') showProfileMenu.value = false
}

// Close menus after navigating; refresh the Orders badge on every page change.
watch(() => route.path, () => {
  showMore.value = false
  loadPendingOrders()
})

// Shop name/avatar can change on the settings page.
watch(() => [user.value?.shop_name, user.value?.shop_avatar_url], loadShop)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  fetchNotifications()
  loadShop()
  loadPendingOrders()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/* Phones: green header bar. Desktop: white bar next to the green sidebar. */
.seller-header {
  box-shadow: none;
}

.seller-header ion-toolbar {
  --background: #2F5D3A;
  --min-height: 56px;
  --padding-start: 0;
  --padding-end: 0;
  --border-width: 0;
}

@media (min-width: 768px) {
  .seller-header {
    border-bottom: 1px solid rgba(78, 139, 87, 0.15);
  }
  .seller-header ion-toolbar {
    --background: #ffffff;
  }
}

.seller-ion-content {
  --background: #EEF5EE;
}

.seller-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  background: #ffffff;
  border-top: 1px solid rgba(78, 139, 87, 0.15);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.seller-tab {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 56px;
  padding: 8px 4px;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 500;
}

.seller-tab--active {
  color: #2F5D3A;
  font-weight: 600;
}

/* Short orange bar above the active tab */
.seller-tab--active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 30%;
  right: 30%;
  height: 2px;
  background: #E67E22;
}
</style>
