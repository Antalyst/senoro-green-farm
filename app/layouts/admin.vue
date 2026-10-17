<template>
  <ion-page>
    <ion-header class="admin-header">
      <ion-toolbar>
        <div class="mx-auto flex h-16 w-full max-w-page items-center gap-3 px-4 md:gap-6 md:px-8">
          <NuxtLink to="/admin/dashboard" class="flex flex-shrink-0 items-center gap-2">
            <img src="/logo2.png" alt="NFWM" class="h-9 w-9 object-contain">
            <span class="hidden text-lg font-bold tracking-tight text-white sm:block">NFWM</span>
            <span class="rounded bg-market-orange px-1.5 py-0.5 text-[11px] font-semibold text-white">Admin</span>
          </NuxtLink>

          <nav class="hidden items-center gap-7 md:flex" aria-label="Admin">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="nav-link"
              :class="route.path === link.to ? 'nav-link--active' : ''"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>

          <div class="ml-auto flex flex-shrink-0 items-center">
            <button
              type="button"
              class="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              @click="showProfileMenu = !showProfileMenu"
            >
              <AccountAvatar :name="user?.full_name" :url="user?.avatar_url" fallback="A" class="h-9 w-9 rounded-full bg-market-orange text-sm text-white" />
              <span class="hidden max-w-[140px] truncate text-sm font-medium sm:inline">{{ user?.full_name }}</span>
              <Icon name="heroicons:chevron-down" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Phones: the links scroll sideways under the bar -->
        <nav class="admin-tabs flex gap-6 overflow-x-auto border-t border-white/10 px-4 pt-2 md:hidden" aria-label="Admin">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="ui-tab"
            :class="route.path === link.to ? 'ui-tab--active' : ''"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </ion-toolbar>
    </ion-header>

    <Transition name="fade-down">
      <div
        v-if="showProfileMenu"
        class="fixed right-4 md:right-[max(1rem,calc((100vw-1200px)/2+2rem))] top-16 z-[60] w-60 rounded-md border border-farm-leaf/15 bg-white py-2"
      >
        <div class="flex items-center gap-3 border-b border-farm-leaf/15 bg-shop-mint px-4 py-3">
          <AccountAvatarUpload avatar-class="w-12 h-12 rounded-full bg-farm-leaf text-lg text-white" />
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-shop-ink">{{ user?.full_name }}</p>
            <p class="truncate text-xs text-gray-400">{{ user?.email }}</p>
          </div>
        </div>
        <button
          type="button"
          class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-600"
          @click="handleLogout"
        >
          <Icon name="heroicons:arrow-right-on-rectangle" class="h-4 w-4" />
          Sign out
        </button>
      </div>
    </Transition>
    <div v-if="showProfileMenu" class="fixed inset-0 z-50" @click="showProfileMenu = false" />

    <ion-content class="admin-ion-content">
      <AppShell tinted>
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
const route = useRoute()
const showProfileMenu = ref(false)

const navLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/approvals', label: 'Approvals' },
  { to: '/admin/delivery', label: 'Delivery Fee' },
]

async function handleLogout() {
  showProfileMenu.value = false
  await logout()
  router.push('/')
}
</script>

<style scoped>
/* Green header bar, light green page. */
.admin-header {
  box-shadow: none;
}

.admin-header ion-toolbar {
  --background: #2F5D3A;
  --min-height: 64px;
  --padding-start: 0;
  --padding-end: 0;
  --border-width: 0;
}

.admin-ion-content {
  --background: #EEF5EE;
}

.nav-link {
  @apply relative py-1 text-sm font-medium text-white/70 transition-colors hover:text-white;
}
.nav-link--active {
  @apply text-white;
}
.nav-link--active::after {
  content: '';
  @apply absolute -bottom-1.5 left-0 right-0 h-0.5 bg-market-orange;
}

/* Phone tabs sit on the green bar */
.admin-tabs .ui-tab {
  color: rgba(255, 255, 255, 0.7);
}
.admin-tabs .ui-tab--active {
  color: #ffffff;
  border-color: #E67E22;
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
