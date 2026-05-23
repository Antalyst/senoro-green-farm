<template>
  <ion-page>
    <ion-header class="admin-header">
      <ion-toolbar>
        <div class="max-w-page mx-auto w-full px-4 md:px-8 flex items-center justify-between py-2">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 border border-farm-light flex items-center justify-center">
              <Icon name="heroicons:shield-check" class="w-4 h-4 text-farm-deep stroke-[1.5]" />
            </div>
            <span class="text-sm font-medium text-farm-dark tracking-tight">Administration</span>
          </div>

          <div class="relative">
            <button
              type="button"
              class="flex items-center gap-2 py-1.5 text-farm-dark/70 hover:text-farm-dark transition-colors"
              @click="showProfileMenu = !showProfileMenu"
            >
              <div class="w-7 h-7 border border-farm-deep flex items-center justify-center text-[10px] font-medium text-farm-deep">
                {{ userInitial }}
              </div>
              <span class="text-xs font-medium max-w-[120px] truncate hidden sm:inline">{{ user?.full_name }}</span>
              <Icon name="heroicons:chevron-down" class="w-3 h-3" />
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

    <ion-content class="admin-ion-content">
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
  user.value?.full_name?.charAt(0).toUpperCase() ?? 'A',
)

async function handleLogout() {
  showProfileMenu.value = false
  await logout()
  router.push('/auth/login')
}
</script>

<style scoped>
.admin-header ion-toolbar {
  --background: #ffffff;
  --border-color: #EEF5EE;
  --min-height: 52px;
}

.admin-ion-content {
  --background: #EEF5EE;
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
