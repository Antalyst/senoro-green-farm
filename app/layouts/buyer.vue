<template>
  <ion-page>
    <!-- Minimal Shopee-style header with search -->
    <ion-header :translucent="false">
      <ion-toolbar>
        <div class="flex items-center gap-3 px-3 py-1">
          <!-- Logo mark -->
          <img src="/logo.png" class="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="Senoro" />

          <!-- Search bar -->
          <div class="flex-1 flex items-center bg-white/15 rounded-full px-3 py-1.5 gap-2">
            <Icon name="heroicons:magnifying-glass" class="w-4 h-4 text-white/70 flex-shrink-0" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search fresh produce..."
              class="bg-transparent text-white placeholder-white/50 text-sm flex-1 outline-none min-w-0"
            />
          </div>

          <!-- Cart icon -->
          <button class="relative p-1.5 flex-shrink-0">
            <Icon name="heroicons:shopping-cart" class="w-5 h-5 text-white" />
            <span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-farm-yellow rounded-full text-farm-deep text-[9px] font-bold flex items-center justify-center">
              {{ cartCount }}
            </span>
          </button>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <slot />
    </ion-content>

    <!-- Bottom Tab Bar -->
    <ion-tab-bar slot="bottom">
      <ion-tab-button
        v-for="tab in tabs"
        :key="tab.path"
        :selected="currentPath.startsWith(tab.path)"
        @click="router.push(tab.path)"
      >
        <Icon
          :name="currentPath.startsWith(tab.path) ? tab.iconActive : tab.icon"
          class="w-6 h-6 mb-0.5"
        />
        <ion-label>{{ tab.label }}</ion-label>
      </ion-tab-button>
    </ion-tab-bar>

    <!-- Profile slide-over -->
    <Transition name="fade-up">
      <div
        v-if="showProfile"
        class="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-50 p-6 pb-safe"
        style="z-index:9999"
      >
        <div class="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
        <div class="flex items-center gap-4 mb-6">
          <div class="w-14 h-14 rounded-full bg-farm-gradient flex items-center justify-center">
            <span class="text-white text-xl font-bold">{{ userInitial }}</span>
          </div>
          <div>
            <p class="font-bold text-gray-900 text-base">{{ user?.full_name }}</p>
            <p class="text-sm text-gray-500">{{ user?.email }}</p>
            <span class="inline-block mt-1 px-2 py-0.5 rounded-full bg-farm-light text-farm-deep text-xs font-semibold uppercase">buyer</span>
          </div>
        </div>
        <button
          class="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-red-50 text-red-600 font-semibold"
          @click="handleLogout"
        >
          <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5" />
          Sign Out
        </button>
        <button class="w-full py-3 mt-2 text-gray-400 text-sm" @click="showProfile = false">
          Cancel
        </button>
      </div>
    </Transition>
    <div v-if="showProfile" class="fixed inset-0 bg-black/40 z-40" @click="showProfile = false" />
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonContent,
  IonTabBar, IonTabButton, IonLabel,
} from '@ionic/vue'

const { user, logout } = useAuth()
const router = useRouter()
const route = useRoute()
const searchQuery = ref('')
const showProfile = ref(false)
const cartCount = ref(3)

const currentPath = computed(() => route.path)

const tabs = [
  { label: 'Home', path: '/buyer/dashboard', icon: 'heroicons:home', iconActive: 'heroicons:home-solid' },
  { label: 'Categories', path: '/buyer/categories', icon: 'heroicons:squares-2x2', iconActive: 'heroicons:squares-2x2-solid' },
  { label: 'Orders', path: '/buyer/orders', icon: 'heroicons:clipboard-document-list', iconActive: 'heroicons:clipboard-document-list-solid' },
  { label: 'Profile', path: '/buyer/profile', icon: 'heroicons:user', iconActive: 'heroicons:user-solid' },
]

const userInitial = computed(() =>
  user.value?.full_name?.charAt(0).toUpperCase() ?? 'B',
)

// Open profile when tapping the profile tab
watch(currentPath, (p) => {
  if (p === '/buyer/profile') {
    showProfile.value = true
  }
})

async function handleLogout() {
  showProfile.value = false
  await logout()
  router.push('/auth/login')
}
</script>

<style scoped>
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
.pb-safe {
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
}
</style>
