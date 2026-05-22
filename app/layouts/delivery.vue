<template>
  <ion-page>
    <ion-header :translucent="false">
      <ion-toolbar>
        <ion-buttons slot="start">
          <div class="flex items-center gap-2 pl-2">
            <div class="w-7 h-7 rounded-lg bg-farm-yellow flex items-center justify-center">
              <Icon name="heroicons:truck-solid" class="w-4 h-4 text-farm-deep" />
            </div>
            <div>
              <p class="text-white font-bold text-sm leading-tight">Delivery</p>
              <p class="text-white/60 text-[10px]">senoro green farm</p>
            </div>
          </div>
        </ion-buttons>

        <ion-buttons slot="end">
          <div class="flex items-center gap-2 pr-3">
            <!-- Online status indicator -->
            <div class="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
              <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span class="text-white/80 text-xs font-medium">Online</span>
            </div>
            <button
              class="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-full"
              @click="showProfileMenu = !showProfileMenu"
            >
              <div class="w-6 h-6 rounded-full bg-farm-yellow flex items-center justify-center">
                <span class="text-farm-deep text-xs font-bold">{{ userInitial }}</span>
              </div>
              <span class="text-white text-sm font-medium max-w-[80px] truncate">{{ user?.full_name }}</span>
            </button>
          </div>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- Profile dropdown -->
    <Transition name="fade-down">
      <div
        v-if="showProfileMenu"
        class="absolute right-4 top-16 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-56"
        style="z-index:9999"
      >
        <div class="px-4 py-3 border-b border-gray-100">
          <p class="font-semibold text-gray-900 text-sm">{{ user?.full_name }}</p>
          <p class="text-xs text-gray-500 truncate">{{ user?.email }}</p>
          <span class="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wide">
            delivery rider
          </span>
        </div>
        <button
          class="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 text-red-600 transition-colors text-sm font-medium"
          @click="handleLogout"
        >
          <Icon name="heroicons:arrow-right-on-rectangle" class="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </Transition>
    <div v-if="showProfileMenu" class="fixed inset-0 z-40" @click="showProfileMenu = false" />

    <ion-content class="ion-padding-bottom">
      <slot />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonButtons, IonContent } from '@ionic/vue'

const { user, logout } = useAuth()
const router = useRouter()
const showProfileMenu = ref(false)

const userInitial = computed(() =>
  user.value?.full_name?.charAt(0).toUpperCase() ?? 'D',
)

async function handleLogout() {
  showProfileMenu.value = false
  await logout()
  router.push('/auth/login')
}
</script>

<style scoped>
.fade-down-enter-active,
.fade-down-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-down-enter-from,
.fade-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
