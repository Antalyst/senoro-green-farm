<template>
  <ion-page>
    <ion-header class="seller-header sticky top-0 z-50 bg-farm-dark backdrop-blur-md shadow-sm">
      <ion-toolbar class="bg-transparent text-white">
        <div class="max-w-page mx-auto w-full px-4 md:px-8">
          <div class="flex items-center justify-between gap-4 py-2">
            <div class="flex items-center gap-3 min-w-0">
              <img src="/logo2.png" alt="Senoro" class="w-7 h-7 object-contain flex-shrink-0">
              <span class="text-sm font-medium text-white tracking-tight hidden sm:inline">
                Seller center
              </span>
            </div>

            <!-- Desktop & Mobile top navigation -->
            <nav class="flex items-center gap-1 flex-1 justify-start md:justify-center overflow-x-auto no-scrollbar mask-edges px-2">
              <NuxtLink
                v-for="tab in tabs"
                :key="tab.path"
                :to="tab.path"
                class="px-2 py-1.5 text-xs font-bold tracking-[0.15em] uppercase transition-colors"
                :class="isActive(tab.path)
                  ? 'text-market-orange border-b-2 border-market-orange'
                  : 'text-white hover:text-market-orange'"
              >
                {{ tab.label }}
              </NuxtLink>
            </nav>

            <div class="flex items-center gap-4 relative">
              <button
                type="button"
                class="relative p-2 text-white/80 hover:text-white transition-colors z-[99] flex items-center justify-center cursor-pointer min-w-[40px] min-h-[40px] bg-transparent border-0"
                @click.stop="toggleNotificationModal"
                aria-label="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 pointer-events-none">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <span
                  v-if="unreadCount > 0"
                  class="absolute top-1 right-1 bg-[#f2994a] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center pointer-events-none"
                >
                  {{ unreadCount }}
                </span>
              </button>

              <button
                type="button"
                class="flex items-center gap-2 py-1 text-white/80 hover:text-white"
                @click="showProfileMenu = !showProfileMenu"
              >
                <div class="w-8 h-8 border border-market-orange flex items-center justify-center text-[10px] font-medium text-market-orange">
                  {{ userInitial }}
                </div>
                <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5 hidden sm:block" />
              </button>
            </div>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <Transition name="fade-down">
      <div
        v-if="showProfileMenu"
        class="fixed right-4 md:right-[max(1rem,calc((100vw-1200px)/2+2rem))] top-14 z-[60] bg-white border border-farm-light py-2 w-56 shadow-sm"
      >
        <div class="px-4 py-3 border-b border-farm-light">
          <p class="text-sm font-medium text-farm-dark truncate">{{ user?.full_name }}</p>
          <p class="text-[11px] text-farm-dark/45 truncate">{{ user?.email }}</p>
        </div>
        <button
          type="button"
          class="w-full px-4 py-3 text-left text-xs font-medium tracking-wide uppercase text-farm-dark/60 hover:bg-farm-light hover:text-red-700 transition-colors"
          @click="handleLogout"
        >
          Sign out
        </button>
      </div>
    </Transition>
    <div v-if="showProfileMenu" class="fixed inset-0 z-50" @click="showProfileMenu = false" />

    <ion-content class="seller-ion-content bg-white">
      <AppShell with-tab-bar>
        <slot />
      </AppShell>
    </ion-content>

    <!-- Bottom navigation (mobile + consistent app pattern) -->
    <nav class="seller-tab-bar md:hidden">
      <div class="max-w-page mx-auto w-full flex">
        <button
          v-for="tab in tabs"
          :key="tab.path"
          type="button"
          class="seller-tab-btn"
          :class="{ 'seller-tab-btn--active': isActive(tab.path) }"
          @click="router.push(tab.path)"
        >
          <div class="relative">
            <Icon
              :name="isActive(tab.path) ? tab.iconActive : tab.icon"
              class="w-5 h-5 stroke-[1.5]"
            />
            <span v-if="isActive(tab.path)" class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-market-orange"></span>
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
        class="w-full max-w-md bg-[#f4f7f5] h-full shadow-2xl flex flex-col"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="p-6 bg-farm-dark border-b border-white/10 flex items-center justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-[#f2994a]">Seller notifications</p>
            <h2 class="mt-1 text-xl font-black tracking-tight text-white flex items-center gap-2">
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
              class="text-xs font-black uppercase tracking-[0.12em] text-white/70 hover:text-white hover:underline transition-colors px-2 py-1"
              :disabled="pending"
              @click="markAllAsRead"
            >
              Mark all as read
            </button>
            <button
              type="button"
              class="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
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
            <p class="text-sm font-bold text-[#1a2e22]/60">No notifications yet.</p>
            <p class="text-xs text-[#1a2e22]/40 mt-1">Order alerts will appear here.</p>
          </div>

          <div v-else class="space-y-3">
            <article
              v-for="notification in notifications"
              :key="notification.id"
              class="border bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition duration-200 border-[#1a2e22]/5 relative overflow-hidden"
              :class="notification.is_read ? 'opacity-85' : 'ring-1 ring-[#f2994a]/25'"
            >
              <div
                v-if="!notification.is_read"
                class="absolute left-0 top-0 bottom-0 w-1 bg-[#f2994a]"
              />
              <div class="flex w-full gap-3">
                <span
                  class="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  :class="notification.is_read ? 'bg-[#1a2e22]/15' : 'bg-[#f2994a] animate-pulse'"
                />
                <div class="min-w-0 flex-1">
                  <span class="block text-sm font-black text-[#1a2e22]">{{ notification.title }}</span>
                  <p class="mt-1.5 text-xs leading-relaxed text-[#1a2e22]/70">{{ notification.message }}</p>
                  <div class="mt-3 flex items-center justify-between">
                    <span class="block text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#1a2e22]/40">
                      {{ formatDate(notification.created_at) }}
                    </span>
                    <button
                      v-if="!notification.is_read"
                      type="button"
                      class="text-[10px] font-black uppercase tracking-[0.1em] text-[#2d5a27] hover:underline"
                      @click="markSingleAsRead(notification.id)"
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
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonPage, IonHeader, IonToolbar, IonContent } from '@ionic/vue'
import AppShell from '~/components/ui/AppShell.vue'

const isNotificationModalOpen = ref(false)
const { notifications, unreadCount, pending, fetchNotifications, markAllAsRead } = useNotificationEngine()

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

const { user, logout } = useAuth()
const router = useRouter()
const route = useRoute()
const showProfileMenu = ref(false)

const userInitial = computed(() =>
  user.value?.full_name?.charAt(0).toUpperCase() ?? 'S',
)

const tabs = [
  { label: 'Home', path: '/seller/dashboard', icon: 'heroicons:home', iconActive: 'heroicons:home-solid' },
  { label: 'Orders', path: '/seller/orders', icon: 'heroicons:clipboard-document-list', iconActive: 'heroicons:clipboard-document-list-solid' },
  { label: 'Stock', path: '/seller/inventory', icon: 'heroicons:archive-box', iconActive: 'heroicons:archive-box-solid' },
  { label: 'Reviews', path: '/seller/reviews', icon: 'heroicons:chat-bubble-left-right', iconActive: 'heroicons:chat-bubble-left-right-solid' },
  { label: 'Profile', path: '/seller/profile', icon: 'heroicons:user', iconActive: 'heroicons:user-solid' },
  { label: 'Settings', path: '/seller/settings', icon: 'heroicons:cog-6-tooth', iconActive: 'heroicons:cog-6-tooth-solid' },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

async function handleLogout() {
  showProfileMenu.value = false
  await logout()
  router.push('/')
}

onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped>
.seller-header ion-toolbar {
  --background: transparent;
  --min-height: 52px;
}

.seller-ion-content {
  --background: #ffffff;
}

.seller-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: #1A3521;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.seller-tab-btn {
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

.seller-tab-btn--active {
  color: #E67E22;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.fade-down-enter-active,
.fade-down-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-down-enter-from,
.fade-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
