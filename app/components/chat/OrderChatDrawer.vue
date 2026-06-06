<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[999] flex justify-end overflow-hidden bg-black/55 backdrop-blur-sm"
    @click="emit('close')"
  >
    <div
      class="w-full h-full md:max-w-md bg-[#f4f7f5] shadow-2xl flex flex-col"
      @click.stop
    >
      <header class="p-5 bg-farm-dark border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div class="min-w-0">
          <p class="text-[10px] font-black uppercase tracking-[0.18em] text-[#f2994a]">Live order chat</p>
          <h2 class="mt-1 text-lg font-black tracking-tight text-white truncate">{{ label }}</h2>
          <p v-if="isChatLocked" class="text-xs text-white/60 mt-1">
            🔒 Chat locked — available during pickup or delivery only.
          </p>
        </div>
        <button
          type="button"
          class="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
          aria-label="Close chat"
          @click="emit('close')"
        >
          <Icon name="heroicons:x-mark" class="w-6 h-6" />
        </button>
      </header>

      <div
        ref="scrollBox"
        class="flex-1 overflow-y-auto p-4 space-y-3"
      >
        <div v-if="isPending" class="flex justify-center py-12">
          <div class="h-7 w-7 animate-spin rounded-full border-4 border-farm-leaf border-t-transparent" />
        </div>

        <p
          v-else-if="!messages.length"
          class="text-center text-xs font-medium text-farm-dark/45 py-12"
        >
          No messages yet. Coordinate pickup or drop-off here.
        </p>

        <div
          v-for="message in messages"
          :key="message.id"
          class="flex"
          :class="message.sender_id === currentUserId ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed"
            :class="message.sender_id === currentUserId
              ? 'bg-farm-dark text-white'
              : 'bg-white text-farm-dark border border-farm-light'"
          >
            <p>{{ message.message_text }}</p>
            <p class="mt-1 text-[10px] opacity-70">
              {{ formatTime(message.created_at) }}
            </p>
          </div>
        </div>
      </div>

      <form
        class="border-t border-farm-light p-3 flex gap-2 bg-white flex-shrink-0"
        @submit.prevent="emit('send')"
      >
        <input
          :value="textInput"
          type="text"
          maxlength="1000"
          :disabled="isChatLocked || isSending"
          :placeholder="isChatLocked ? 'Chat unavailable for this order' : 'Type a message…'"
          class="flex-1 border border-farm-light px-3 py-2.5 text-sm text-farm-dark placeholder:text-farm-dark/40 outline-none focus:border-farm-leaf disabled:bg-farm-light/30 disabled:cursor-not-allowed"
          @input="emit('update:textInput', ($event.target as HTMLInputElement).value)"
        >
        <button
          type="submit"
          class="px-4 py-2.5 bg-market-orange text-white text-xs font-black uppercase tracking-[0.12em] hover:bg-[#D35400] transition-colors disabled:opacity-50"
          :disabled="isChatLocked || isSending || !textInput.trim()"
        >
          {{ isSending ? 'Sending…' : 'Send' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { OrderMessage } from '~/composables/useOrderChat'

const props = defineProps<{
  open: boolean
  label: string
  messages: OrderMessage[]
  isPending: boolean
  isSending: boolean
  isChatLocked: boolean
  textInput: string
  currentUserId: string | null
  formatTime: (value: string) => string
}>()

const emit = defineEmits<{
  close: []
  send: []
  'update:textInput': [value: string]
}>()

const scrollBox = ref<HTMLElement | null>(null)

async function scrollToBottom() {
  await nextTick()
  if (scrollBox.value) {
    scrollBox.value.scrollTop = scrollBox.value.scrollHeight
  }
}

watch(() => props.messages, () => {
  if (props.open) scrollToBottom()
}, { deep: true })

watch(() => props.open, (isOpen) => {
  if (isOpen) scrollToBottom()
})

defineExpose({ scrollToBottom })
</script>
