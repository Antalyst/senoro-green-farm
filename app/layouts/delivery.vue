<template>
  <ion-page>
    <ion-header class="delivery-header">
      <ion-toolbar>
        <div class="mx-auto flex h-14 w-full max-w-3xl items-center gap-3 px-4">
          <img src="/logo2.png" alt="NFWM" class="h-8 w-8 flex-shrink-0 object-contain">
          <div class="min-w-0 flex-1 leading-tight">
            <p class="text-sm font-semibold text-shop-ink">NFWM Rider</p>
            <p class="truncate text-[11px] text-gray-500">{{ user?.full_name }}</p>
          </div>

          <button
            type="button"
            class="icon-btn"
            aria-label="Notifications"
            @click.stop="toggleNotificationModal"
          >
            <Icon name="heroicons:bell" class="h-6 w-6" />
            <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
          </button>

          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full bg-farm-leaf text-sm font-semibold text-white"
            aria-label="Account menu"
            @click="showProfileMenu = !showProfileMenu"
          >
            <AccountAvatar :name="user?.full_name" :url="user?.avatar_url" fallback="D" class="h-full w-full rounded-full" />
          </button>
        </div>
      </ion-toolbar>
    </ion-header>

    <Transition name="fade-down">
      <div
        v-if="showProfileMenu"
        class="fixed right-4 top-14 z-[60] w-60 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
      >
        <div class="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <AccountAvatarUpload avatar-class="h-12 w-12 rounded-full bg-farm-leaf text-lg text-white" />
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-shop-ink">{{ user?.full_name }}</p>
            <p class="truncate text-xs text-gray-500">{{ user?.email }}</p>
          </div>
        </div>
        <button
          type="button"
          class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
          @click="handleLogout"
        >
          <Icon name="heroicons:arrow-left-on-rectangle" class="h-4 w-4" />
          Sign out
        </button>
      </div>
    </Transition>
    <div v-if="showProfileMenu" class="fixed inset-0 z-50" @click="showProfileMenu = false" />

    <ion-content class="delivery-ion-content">
      <slot />
    </ion-content>

    <NotificationInbox
      :open="isNotificationModalOpen"
      :notifications="notifications"
      :unread-count="unreadCount"
      :pending="pending"
      empty-text="Job and order alerts will appear here."
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
    await openChatModal(notification.order_id, null, 'Buyer chat')
  }
  else if (notification.order_id) {
    // Job alerts open the pickup queue; the dashboard refreshes when this query changes.
    isNotificationModalOpen.value = false
    await router.push({ path: '/delivery/dashboard', query: { tab: 'pickup', at: String(Date.now()) } })
  }
}

const { user, logout } = useAuth()
const router = useRouter()
const showProfileMenu = ref(false)


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
.delivery-header {
  border-bottom: 1px solid #f3f4f6;
  box-shadow: none;
}
.delivery-header ion-toolbar {
  --background: #ffffff;
  --min-height: 56px;
  --padding-start: 0;
  --padding-end: 0;
  --border-width: 0;
}
.delivery-ion-content {
  --background: #f6f7f6;
}
.icon-btn {
  @apply relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100;
}
.badge {
  @apply absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-market-orange px-1 text-[10px] font-bold text-white ring-2 ring-white;
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
