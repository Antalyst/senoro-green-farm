<template>
  <Teleport to="body">
    <Transition name="inbox-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[99999] flex items-end bg-black/30 md:items-stretch md:justify-end"
        @click="emit('close')"
      >
        <!-- Phones: bottom sheet. Desktop (md+): side panel on the right. -->
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="inbox-title"
          class="flex max-h-[85vh] w-full flex-col rounded-t-lg bg-white md:h-full md:max-h-none md:w-[400px] md:rounded-none md:border-l md:border-gray-100"
          @click.stop
        >
          <!-- Grab handle (phones only) -->
          <div class="flex justify-center pt-2 md:hidden">
            <span class="h-1 w-10 rounded-full bg-gray-200" />
          </div>

          <header class="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 md:px-5 md:py-4">
            <div class="min-w-0">
              <h2 id="inbox-title" class="text-lg font-semibold text-shop-ink">Inbox</h2>
              <p class="text-xs text-gray-400">
                {{ unreadCount > 0 ? `${unreadCount} unread` : 'All caught up' }}
              </p>
            </div>
            <div class="flex flex-shrink-0 items-center gap-1">
              <button
                v-if="unreadCount > 0"
                type="button"
                class="min-h-[40px] rounded px-3 text-sm font-medium text-farm-leaf hover:text-farm-deep disabled:opacity-50"
                :disabled="pending"
                @click="emit('read-all')"
              >
                Mark all read
              </button>
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded text-gray-500 hover:text-shop-ink"
                aria-label="Close inbox"
                @click="emit('close')"
              >
                <Icon name="heroicons:x-mark" class="h-6 w-6" />
              </button>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
            <p v-if="pending && notifications.length === 0" class="px-4 py-16 text-center text-sm text-gray-400">
              Loading…
            </p>

            <div v-else-if="notifications.length === 0" class="px-4 py-16 text-center">
              <Icon name="heroicons:bell" class="mx-auto h-8 w-8 text-gray-300" />
              <p class="mt-3 text-sm font-medium text-shop-ink">No notifications yet</p>
              <p class="mt-1 text-xs text-gray-400">{{ emptyText }}</p>
            </div>

            <template v-else>
              <template v-for="group in groups" :key="group.label">
                <p v-if="group.items.length" class="bg-gray-50 px-4 py-2 text-xs text-gray-400 md:px-5">
                  {{ group.label }}
                </p>
                <ul class="divide-y divide-gray-100">
                  <li v-for="n in group.items" :key="n.id">
                    <button
                      type="button"
                      class="flex w-full gap-3 px-4 py-4 text-left active:bg-gray-50 md:px-5 md:hover:bg-gray-50"
                      @click="emit('select', n)"
                    >
                      <span
                        class="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                        :class="n.is_read ? 'bg-transparent' : 'bg-farm-leaf'"
                        :aria-label="n.is_read ? undefined : 'Unread'"
                      />
                      <span class="min-w-0 flex-1">
                        <span class="flex items-baseline justify-between gap-3">
                          <span
                            class="truncate text-sm"
                            :class="n.is_read ? 'text-gray-600' : 'font-semibold text-shop-ink'"
                          >
                            {{ n.title }}
                          </span>
                          <span class="flex-shrink-0 text-xs text-gray-400">{{ timeAgo(n.created_at) }}</span>
                        </span>
                        <span class="mt-0.5 block text-sm leading-snug text-gray-500 line-clamp-2">{{ n.message }}</span>
                      </span>
                    </button>
                  </li>
                </ul>
              </template>
            </template>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { MarketplaceNotification } from '~/composables/useNotificationEngine'

// One inbox for buyers, sellers and riders. The layout decides what tapping a row does.
const props = withDefaults(defineProps<{
  open: boolean
  notifications: MarketplaceNotification[]
  unreadCount: number
  pending?: boolean
  emptyText?: string
}>(), {
  pending: false,
  emptyText: 'Order updates will appear here.',
})

const emit = defineEmits<{
  'close': []
  'select': [notification: MarketplaceNotification]
  'read-all': []
}>()

const groups = computed(() => [
  { label: 'New', items: props.notifications.filter(n => !n.is_read) },
  { label: 'Earlier', items: props.notifications.filter(n => n.is_read) },
])

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'Now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

// Close with the Escape key on desktop.
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.inbox-fade-enter-active,
.inbox-fade-leave-active {
  transition: opacity 0.15s ease;
}
.inbox-fade-enter-from,
.inbox-fade-leave-to {
  opacity: 0;
}
</style>
