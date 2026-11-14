<template>
  <div v-if="urls?.length" class="flex flex-wrap gap-2">
    <button
      v-for="(url, i) in urls"
      :key="url"
      type="button"
      class="h-16 w-16 overflow-hidden rounded border border-gray-200 bg-gray-50 md:h-20 md:w-20"
      :aria-label="`Open photo ${i + 1} of ${urls.length}`"
      @click="openIndex = i"
    >
      <img :src="url" alt="" loading="lazy" class="h-full w-full object-cover">
    </button>

    <!-- Full-size view -->
    <Teleport to="body">
      <div
        v-if="openIndex !== null"
        class="fixed inset-0 z-[99995] flex flex-col bg-black/90"
        role="dialog"
        aria-modal="true"
        aria-label="Review photo"
        @click="openIndex = null"
      >
        <div class="flex items-center justify-between px-4 py-3 text-white">
          <span class="text-sm">{{ openIndex + 1 }} / {{ urls.length }}</span>
          <button type="button" class="flex h-10 w-10 items-center justify-center" aria-label="Close" @click="openIndex = null">
            <Icon name="heroicons:x-mark" class="h-7 w-7" />
          </button>
        </div>
        <div class="flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
          <img :src="urls[openIndex]" alt="Review photo" class="max-h-full max-w-full object-contain" @click.stop>
        </div>
        <div v-if="urls.length > 1" class="flex justify-center gap-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]" @click.stop>
          <button type="button" class="nav-btn" aria-label="Previous photo" @click="step(-1)">
            <Icon name="heroicons:chevron-left" class="h-6 w-6" />
          </button>
          <button type="button" class="nav-btn" aria-label="Next photo" @click="step(1)">
            <Icon name="heroicons:chevron-right" class="h-6 w-6" />
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
// Review photos: small thumbnails, tap one to see it full size.
const props = defineProps<{ urls?: string[] | null }>()

const openIndex = ref<number | null>(null)

function step(delta: number) {
  const count = props.urls?.length ?? 0
  if (!count || openIndex.value === null) return
  openIndex.value = (openIndex.value + delta + count) % count
}
</script>

<style scoped>
.nav-btn {
  @apply flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white;
}
</style>
