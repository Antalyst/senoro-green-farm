<template>
  <ion-page>
    <ion-header class="buyer-header">
      <ion-toolbar>
        <div class="mx-auto flex h-16 w-full max-w-page items-center gap-3 px-4 md:gap-6 md:px-8">
          <button
            v-if="isSubPage"
            type="button"
            class="-ml-1 flex-shrink-0 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-shop-ink"
            aria-label="Go back"
            @click="router.back()"
          >
            <Icon name="heroicons:arrow-left" class="h-5 w-5" />
          </button>
          <NuxtLink v-else to="/" class="flex flex-shrink-0 items-center gap-2">
            <img src="/logo2.png" class="h-9 w-9 object-contain" alt="NFWM">
            <span class="hidden text-lg font-bold tracking-tight text-shop-ink sm:block">NFWM</span>
          </NuxtLink>

          <!-- Desktop navigation -->
          <nav class="hidden items-center gap-7 lg:flex" aria-label="Main">
            <template v-for="link in navLinks" :key="link.label">
              <NuxtLink
                v-if="link.to"
                :to="link.to"
                class="nav-link"
                :class="isNavActive(link.to) ? 'nav-link--active' : ''"
              >
                {{ link.label }}
              </NuxtLink>
              <button v-else type="button" class="nav-link" @click="goToSection(link.section!)">
                {{ link.label }}
              </button>
            </template>
          </nav>

          <div v-if="showSearch" class="flex min-w-0 flex-1 justify-end">
            <label class="flex w-full min-w-0 items-center gap-2 rounded-full bg-gray-100 px-4 py-2 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-farm-leaf/30 md:max-w-xs">
              <Icon name="heroicons:magnifying-glass" class="h-4 w-4 flex-shrink-0 text-gray-400" />
              <input
                v-model="searchQuery"
                type="search"
                placeholder="Search fresh produce…"
                aria-label="Search products"
                class="min-w-0 flex-1 bg-transparent text-sm text-shop-ink outline-none placeholder:text-gray-400"
              >
            </label>
          </div>
          <!-- Page title on phones; on desktop the nav is shown instead (element stays as spacer) -->
          <h1 v-else class="min-w-0 flex-1 truncate text-sm font-semibold text-shop-ink">
            <span class="lg:hidden">{{ headerTitle }}</span>
          </h1>

          <div class="flex flex-shrink-0 items-center gap-1">
            <button
              v-if="route.path !== '/buyer/cart' && route.path !== '/buyer/checkout'"
              type="button"
              class="icon-btn"
              aria-label="Cart"
              @click="router.push('/buyer/cart')"
            >
              <Icon name="heroicons:shopping-cart" class="h-6 w-6" />
              <span v-if="cartCount > 0" class="badge">{{ cartCount }}</span>
            </button>

            <button
              v-if="user"
              type="button"
              class="icon-btn"
              aria-label="Notifications"
              @click.stop="toggleNotificationModal"
            >
              <Icon name="heroicons:bell" class="h-6 w-6" />
              <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
            </button>

            <NuxtLink
              v-if="user"
              to="/buyer/profile"
              class="ml-1 hidden h-9 w-9 items-center justify-center rounded-full bg-farm-leaf text-sm font-semibold text-white transition hover:bg-farm-deep md:flex"
              title="Your profile"
            >
              <AccountAvatar :name="user.full_name" :url="user.avatar_url" class="h-full w-full rounded-full" />
            </NuxtLink>
            <NuxtLink
              v-else
              to="/auth/login"
              class="ml-1 hidden rounded bg-farm-leaf px-4 py-2 text-sm font-semibold text-white transition hover:bg-farm-deep md:block"
            >
              Sign in
            </NuxtLink>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="buyer-ion-content">
      <!-- Page loader -->
      <div v-if="isLoading" class="absolute left-0 right-0 top-0 z-50 h-0.5 animate-pulse bg-farm-leaf" />
      <AppShell :with-tab-bar="!showFooter">
        <slot />
      </AppShell>
      <div v-if="showFooter" class="pb-20 md:pb-0 bg-shop-mint">
        <StorefrontSiteFooter />
      </div>
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
            <span v-if="currentPath === tab.path || (tab.path !== '/' && currentPath.startsWith(tab.path))" class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-farm-leaf"></span>
          </div>
          <span class="mt-1">{{ tab.label }}</span>
        </button>
      </div>
    </nav>

    <NotificationInbox
      :open="isNotificationModalOpen"
      :notifications="notifications"
      :unread-count="unreadCount"
      :pending="pending"
      empty-text="Order updates will appear here."
      @close="isNotificationModalOpen = false"
      @select="handleNotificationAction"
      @read-all="markAllAsRead"
    />

    <OrderChatDrawer
      :open="isChatModalOpen"
      :label="chatLabel"
      :messages="messages"
      :is-pending="isPending"
      :is-sending="isSending"
      :is-chat-locked="isChatLocked"
      :text-input="textInput"
      :current-user-id="computedUserId"
      :format-time="formatTime"
      @close="closeChatModal"
      @send="handleSend"
      @update:text-input="textInput = $event"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonPage, IonHeader, IonToolbar, IonContent } from '@ionic/vue'
import AppShell from '~/components/ui/AppShell.vue'
import OrderChatDrawer from '~/components/chat/OrderChatDrawer.vue'

const {
  isChatModalOpen,
  chatLabel,
  textInput,
  computedUserId,
  messages,
  isPending,
  isSending,
  isChatLocked,
  openChatModal,
  closeChatModal,
  handleSend,
  formatTime,
} = useLayoutChatDrawer()

const isNotificationModalOpen = ref(false)
const { notifications, unreadCount, pending, fetchNotifications, markAllAsRead } = useNotificationEngine()

// Toggle modal visibility and refresh notifications array
const toggleNotificationModal = () => {
  isNotificationModalOpen.value = !isNotificationModalOpen.value
  if (isNotificationModalOpen.value) {
    fetchNotifications()
  }
}

const markSingleAsRead = async (id: string) => {
  await useApiFetch()(`/api/notifications/${id}`, {
    method: 'PATCH',
    body: { is_read: true },
  })
  await fetchNotifications()
}

const handleNotificationAction = async (notification: MarketplaceNotification) => {
  if (!notification.is_read) {
    await markSingleAsRead(notification.id)
  }

  const isChatAlert = notification.title.includes('Message')
  if (isChatAlert && notification.order_id) {
    isNotificationModalOpen.value = false
    await openChatModal(notification.order_id, null, 'Rider chat')
  }
}

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
    return subPageTitle.value || 'NFWM'
  }
  if (currentPath.value === '/buyer/cart') return 'Cart'
  if (currentPath.value === '/buyer/profile') return 'Profile'
  return ''
})

const showSearch = computed(() => {
  return currentPath.value === '/' || currentPath.value === '/buyer/categories'
})

// Storefront pages get the footer; account/checkout pages stay focused.
const showFooter = computed(() =>
  currentPath.value === '/'
  || currentPath.value === '/buyer/categories'
  || currentPath.value.startsWith('/buyer/shop/')
  || currentPath.value.startsWith('/buyer/product/'),
)

const navLinks: { label: string; to?: string; section?: string }[] = [
  { label: 'Home', to: '/' },
  { label: 'Shop', section: 'products' },
  { label: 'Categories', section: 'categories' },
  { label: 'Local shops', section: 'shops' },
  { label: 'My Orders', to: '/buyer/orders' },
]

function isNavActive(to: string) {
  return to === '/' ? currentPath.value === '/' : currentPath.value.startsWith(to)
}

// Sections live on the home page. ion-content scrolls (not the window), so scroll the element directly.
function goToSection(id: string) {
  if (currentPath.value === '/') {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  router.push({ path: '/', hash: `#${id}` })
}

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
  { label: 'Orders', path: '/buyer/orders', icon: 'heroicons:clipboard-document-list', iconActive: 'heroicons:clipboard-document-list-solid' },
  { label: 'Cart', path: '/buyer/cart', icon: 'heroicons:shopping-bag', iconActive: 'heroicons:shopping-cart-solid' },
  { label: 'Profile', path: '/buyer/profile', icon: 'heroicons:user', iconActive: 'heroicons:user-solid' },
]

const desktopTabs = tabs.filter(t => ['/', '/buyer/orders'].includes(t.path))

// Cart and notifications need a login; guests browsing the storefront skip them (no 401s).
function loadAccountBadges() {
  if (!user.value) {
    cartCount.value = 0
    return
  }
  refreshCartCount()
  fetchNotifications()
}

watch(() => user.value?.id, loadAccountBadges)

onMounted(() => {
  searchQuery.value = (route.query.search as string) || ''
  layoutReady.value = true
  loadAccountBadges()
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
.buyer-header {
  border-bottom: 1px solid #f3f4f6;
  box-shadow: none;
}

.buyer-header ion-toolbar {
  --background: #ffffff;
  --min-height: 64px;
  --padding-start: 0;
  --padding-end: 0;
  --border-width: 0;
}

.buyer-ion-content {
  --background: #ffffff;
}

.nav-link {
  @apply relative py-1 text-sm font-medium text-gray-600 transition-colors hover:text-farm-leaf;
}
.nav-link--active {
  @apply text-farm-leaf;
}
.nav-link--active::after {
  content: '';
  @apply absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-farm-leaf;
}

.icon-btn {
  @apply relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-shop-ink;
}
.badge {
  @apply absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-market-orange px-1 text-[10px] font-bold text-white ring-2 ring-white;
}

.buyer-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: #ffffff;
  border-top: 1px solid #f3f4f6;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.04);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.buyer-tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 10px 4px 12px;
  color: #9ca3af;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.buyer-tab-btn--active {
  color: #4E8B57;
}
</style>
