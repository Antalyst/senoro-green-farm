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
            <span class="hidden lg:block text-lg font-black text-market-orange tracking-tight">Negros Farmers Weekend Market</span>
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

          <div class="flex items-center gap-4 ml-4">
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

            <button
              type="button"
              class="relative p-2 text-gray-700 hover:text-green-700 transition-colors z-[99] flex items-center justify-center cursor-pointer min-w-[40px] min-h-[40px] bg-transparent border-0 animate-none"
              @click.stop="toggleNotificationModal"
              aria-label="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 pointer-events-none">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span
                v-if="unreadCount > 0"
                class="absolute top-1 right-1 bg-[#f2994a] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center pointer-events-none"
              >
                {{ unreadCount }}
              </span>
            </button>

            <!-- Profile Avatar -->
            <NuxtLink
  to="/buyer/profile"
  class="hidden md:flex h-9 ml-2 border-2 border-farm-dark bg-farm-light items-center justify-center text-farm-dark hover:border-market-orange hover:text-market-orange transition-colors flex-shrink-0 overflow-hidden"
  :class="user ? 'w-9 h-9 rounded-full' : 'px-4 rounded-lg'"
  title="Your Profile"
>
  <span class="text-sm font-black uppercase">
    {{ user?.full_name?.charAt(0) || 'Sign In' }}
  </span>
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

    <!-- Global Layered Notification Modal (z-[99999]) -->
    <div
      v-if="isNotificationModalOpen"
      class="fixed inset-0 z-[99999] flex justify-end overflow-hidden bg-black/55 backdrop-blur-sm transition-opacity duration-300"
      @click="isNotificationModalOpen = false"
    >
      <div
        class="w-full max-w-md bg-[#f4f7f5] h-full shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="p-6 bg-white border-b border-[#2d5a27]/10 flex items-center justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-[#f2994a]">Buyer notifications</p>
            <h2 class="mt-1 text-xl font-black tracking-tight text-[#1a2e22] flex items-center gap-2">
              Inbox
              <span
                v-if="unreadCount > 0"
                class="px-2 py-0.5 rounded-full bg-[#f2994a] text-white text-[11px] font-extrabold animate-pulse"
              >
                {{ unreadCount }} new
              </span>
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="unreadCount > 0"
              type="button"
              class="text-xs font-black uppercase tracking-[0.12em] text-[#2d5a27] hover:text-[#1e3c1a] hover:underline transition-colors px-2 py-1"
              :disabled="pending"
              @click="markAllAsRead"
            >
              Mark all as read
            </button>
            <button
              type="button"
              class="p-2 text-[#1a2e22]/50 hover:text-[#1a2e22] hover:bg-[#1a2e22]/5 rounded-full transition-colors flex items-center justify-center"
              aria-label="Close panel"
              @click="isNotificationModalOpen = false"
            >
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>
        </div>

        <!-- Modal Content / List -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <div v-if="pending && notifications.length === 0" class="flex flex-col items-center justify-center h-64 gap-4">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-[#2d5a27] border-t-transparent" />
            <p class="text-sm font-bold text-[#1a2e22]/50">Fetching notifications...</p>
          </div>

          <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center h-64 p-6 border-2 border-dashed border-[#1a2e22]/15 bg-white rounded-xl">
            <Icon name="heroicons:bell" class="w-12 h-12 text-[#1a2e22]/30 mb-3" />
            <p class="text-sm font-bold text-[#1a2e22]/60">You are all caught up!</p>
            <p class="text-xs text-[#1a2e22]/40 mt-1">Order updates will appear here.</p>
          </div>

          <div v-else class="space-y-3">
            <article
              v-for="notification in notifications"
              :key="notification.id"
              class="border bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition duration-200 border-[#1a2e22]/5 relative overflow-hidden cursor-pointer"
              :class="notification.is_read ? 'opacity-85' : 'ring-1 ring-[#f2994a]/25'"
              @click="handleNotificationAction(notification)"
            >
              <div
                v-if="!notification.is_read"
                class="absolute left-0 top-0 bottom-0 w-1 bg-[#f2994a]"
              />

              <div class="flex w-full gap-3 text-left">
                <span
                  class="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  :class="notification.is_read ? 'bg-[#1a2e22]/15' : 'bg-[#f2994a] animate-pulse'"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <span class="block text-sm font-black text-[#1a2e22]">{{ notification.title }}</span>
                  </div>
                  <p class="mt-1.5 text-xs leading-relaxed text-[#1a2e22]/70">{{ notification.message }}</p>
                  <div class="mt-3 flex items-center justify-between">
                    <span class="block text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#1a2e22]/40">
                      {{ formatDate(notification.created_at) }}
                    </span>
                    <button
                      v-if="!notification.is_read"
                      type="button"
                      class="text-[10px] font-black uppercase tracking-[0.1em] text-[#2d5a27] hover:underline"
                      @click.stop="markSingleAsRead(notification.id)"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>

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
  await $fetch(`/api/notifications/${id}`, {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
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
  { label: 'Orders', path: '/buyer/orders', icon: 'heroicons:clipboard-document-list', iconActive: 'heroicons:clipboard-document-list-solid' },
  { label: 'Cart', path: '/buyer/cart', icon: 'heroicons:shopping-bag', iconActive: 'heroicons:shopping-cart-solid' },
  { label: 'Profile', path: '/buyer/profile', icon: 'heroicons:user', iconActive: 'heroicons:user-solid' },
]

const desktopTabs = tabs.filter(t => ['/', '/buyer/orders'].includes(t.path))

onMounted(() => {
  searchQuery.value = (route.query.search as string) || ''
  layoutReady.value = true
  refreshCartCount()
  fetchNotifications()
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
