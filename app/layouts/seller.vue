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

            <div class="flex items-center gap-2 relative">
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
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonContent } from '@ionic/vue'
import AppShell from '~/components/ui/AppShell.vue'

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
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

async function handleLogout() {
  showProfileMenu.value = false
  await logout()
  router.push('/')
}
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
