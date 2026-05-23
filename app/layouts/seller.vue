<template>
  <ion-page>
    <ion-header class="seller-header">
      <ion-toolbar>
        <div class="max-w-page mx-auto w-full px-4 md:px-8">
          <div class="flex items-center justify-between gap-4 py-2">
            <div class="flex items-center gap-3 min-w-0">
              <img src="/logo.png" alt="Senoro" class="w-7 h-7 object-cover flex-shrink-0">
              <span class="text-sm font-medium text-farm-dark tracking-tight hidden sm:inline">
                Seller center
              </span>
            </div>

            <!-- Desktop top navigation -->
            <nav class="hidden md:flex items-center gap-1 flex-1 justify-center">
              <NuxtLink
                v-for="tab in tabs"
                :key="tab.path"
                :to="tab.path"
                class="px-4 py-2 text-[11px] font-medium tracking-[0.1em] uppercase transition-colors"
                :class="isActive(tab.path)
                  ? 'text-farm-deep border-b-2 border-farm-deep'
                  : 'text-farm-dark/45 hover:text-farm-deep'"
              >
                {{ tab.label }}
              </NuxtLink>
            </nav>

            <div class="flex items-center gap-2 relative">
              <button
                type="button"
                class="flex items-center gap-2 py-1 text-farm-dark/70 hover:text-farm-dark"
                @click="showProfileMenu = !showProfileMenu"
              >
                <div class="w-8 h-8 border border-farm-deep flex items-center justify-center text-[10px] font-medium text-farm-deep">
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

    <ion-content class="seller-ion-content">
      <AppShell with-tab-bar>
        <slot />
      </AppShell>
    </ion-content>

    <!-- Bottom navigation (mobile + consistent app pattern) -->
    <nav class="seller-tab-bar">
      <div class="max-w-page mx-auto w-full flex">
        <button
          v-for="tab in tabs"
          :key="tab.path"
          type="button"
          class="seller-tab-btn"
          :class="{ 'seller-tab-btn--active': isActive(tab.path) }"
          @click="router.push(tab.path)"
        >
          <Icon
            :name="isActive(tab.path) ? tab.iconActive : tab.icon"
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
  router.push('/auth/login')
}
</script>

<style scoped>
.seller-header ion-toolbar {
  --background: #ffffff;
  --border-color: #EEF5EE;
  --min-height: 52px;
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
  background: #fff;
  border-top: 1px solid #EEF5EE;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.seller-tab-btn {
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

.seller-tab-btn--active {
  color: #2F5D3A;
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
