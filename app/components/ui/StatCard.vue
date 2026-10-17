<template>
  <div
    class="rounded-md border p-4 md:p-5"
    :class="tone === 'primary' ? 'border-farm-deep bg-farm-deep text-white' : 'border-farm-leaf/15 bg-white'"
  >
    <div class="flex items-start justify-between gap-2">
      <p class="text-sm" :class="tone === 'primary' ? 'text-white/75' : 'text-gray-500'">{{ label }}</p>
      <span
        v-if="icon"
        class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded"
        :class="iconClass"
      >
        <Icon :name="icon" class="h-4 w-4" />
      </span>
    </div>
    <p class="mt-1 truncate text-xl font-semibold tabular-nums md:text-2xl" :class="valueClass">{{ value }}</p>
    <p v-if="caption" class="mt-0.5 text-xs" :class="tone === 'primary' ? 'text-white/60' : 'text-gray-400'">{{ caption }}</p>
  </div>
</template>

<script setup lang="ts">
// Number tile shared by admin and seller pages.
// primary = solid green (the headline number), accent = orange (needs attention).
const props = withDefaults(defineProps<{
  label: string
  value: string | number
  caption?: string
  icon?: string
  tone?: 'default' | 'primary' | 'accent'
}>(), { tone: 'default' })

const iconClass = computed(() => {
  if (props.tone === 'primary') return 'bg-white/15 text-white'
  if (props.tone === 'accent') return 'bg-market-orange/10 text-market-orange'
  return 'bg-shop-mint text-farm-leaf'
})

const valueClass = computed(() => {
  if (props.tone === 'primary') return 'text-white'
  if (props.tone === 'accent') return 'text-market-orange'
  return 'text-farm-deep'
})
</script>
