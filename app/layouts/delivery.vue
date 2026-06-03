<template>
  <ion-page>
    <ion-header class="delivery-header sticky top-0 z-50 bg-farm-dark backdrop-blur-md shadow-sm">
      <ion-toolbar class="bg-transparent text-white">
        <div class="max-w-page mx-auto w-full px-4 md:px-8 flex items-center justify-between py-2">
          <div class="flex items-center gap-2">
            <img src="/logo2.png" alt="Senoro Delivery" class="w-7 h-7 object-contain flex-shrink-0">
            <span class="text-sm font-medium text-white tracking-tight hidden sm:inline">Delivery</span>
          </div>

          <div class="flex items-center gap-3 relative">
            <div class="hidden sm:flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-farm-leaf">
              <span class="w-1.5 h-1.5 rounded-full bg-farm-leaf" />
              Online
            </div>
            <button
              type="button"
              class="flex items-center gap-2 py-1 text-white/70 hover:text-white"
              @click="showProfileMenu = !showProfileMenu"
            >
              <div class="w-8 h-8 border border-white/20 flex items-center justify-center text-[10px] font-medium text-white">
                {{ userInitial }}
              </div>
              <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5 hidden sm:block" />
            </button>
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
          <p class="text-sm font-medium text-farm-dark">{{ user?.full_name }}</p>
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

    <ion-content class="delivery-ion-content bg-white">
      <AppShell>
        <slot />
      </AppShell>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonContent } from '@ionic/vue'
import AppShell from '~/components/ui/AppShell.vue'

const { user, logout } = useAuth()
const router = useRouter()
const showProfileMenu = ref(false)

const userInitial = computed(() =>
  user.value?.full_name?.charAt(0).toUpperCase() ?? 'D',
)

async function handleLogout() {
  showProfileMenu.value = false
  await logout()
  router.push('/')
}
</script>

<style scoped>
.delivery-header ion-toolbar {
  --background: transparent;
  --min-height: 52px;
}

.delivery-ion-content {
  --background: #ffffff;
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
