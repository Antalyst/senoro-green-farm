<template>
  <Transition name="buyer-toast">
    <div
      v-if="show"
      class="fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md px-4 py-3 border flex items-center gap-3 text-sm font-medium"
      :class="type === 'success'
        ? 'bg-white border-farm-leaf text-farm-dark'
        : 'bg-white border-red-300 text-red-800'"
    >
      <Icon
        :name="type === 'success' ? 'heroicons:check' : 'heroicons:exclamation-triangle'"
        class="w-4 h-4 flex-shrink-0"
        :class="type === 'success' ? 'text-farm-leaf' : 'text-red-500'"
      />
      <span class="flex-1">{{ message }}</span>
      <button type="button" class="text-farm-dark/40 hover:text-farm-dark" @click="$emit('close')">
        <Icon name="heroicons:x-mark" class="w-4 h-4" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  message: string
  type: 'success' | 'error'
}>()

defineEmits<{ close: [] }>()
</script>

<style scoped>
.buyer-toast-enter-active,
.buyer-toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.buyer-toast-enter-from,
.buyer-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
