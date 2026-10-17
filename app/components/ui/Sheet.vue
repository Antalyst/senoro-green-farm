<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[99990] flex items-end bg-black/30 md:items-center md:justify-center md:p-6"
        @click="emit('close')"
      >
        <!-- Phones: bottom sheet. Desktop (md+): centered dialog. -->
        <section
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          class="flex max-h-[90vh] w-full flex-col rounded-t-lg bg-white md:max-w-lg md:rounded-md md:border md:border-gray-100"
          @click.stop
        >
          <div class="flex justify-center pt-2 md:hidden">
            <span class="h-1 w-10 rounded-full bg-gray-200" />
          </div>

          <header class="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 md:px-5 md:py-4">
            <div class="min-w-0">
              <h2 class="truncate text-lg font-semibold text-shop-ink">{{ title }}</h2>
              <p v-if="caption" class="text-xs text-gray-400">{{ caption }}</p>
            </div>
            <button
              type="button"
              class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded text-gray-500 hover:text-shop-ink"
              aria-label="Close"
              @click="emit('close')"
            >
              <Icon name="heroicons:x-mark" class="h-6 w-6" />
            </button>
          </header>

          <div class="flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-5">
            <slot />
          </div>

          <footer
            v-if="$slots.footer"
            class="border-t border-gray-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-5"
          >
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// Shared pop-up for forms: bottom sheet on phones, centered dialog on desktop.
const props = defineProps<{
  open: boolean
  title: string
  caption?: string
}>()

const emit = defineEmits<{ close: [] }>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.15s ease;
}
.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}
</style>
