<template>
  <span class="inline-flex items-center gap-1" :aria-label="`${value.toFixed(1)} out of 5 stars`">
    <span class="flex">
      <Icon
        v-for="n in 5"
        :key="n"
        name="heroicons:star-solid"
        :class="[sizeClass, n <= Math.round(value) ? 'text-amber-400' : 'text-gray-200']"
      />
    </span>
    <span v-if="count !== undefined" class="text-[11px] text-gray-400">({{ count }})</span>
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  value: number
  count?: number
  size?: 'sm' | 'md'
}>(), { size: 'sm' })

const sizeClass = computed(() => (props.size === 'md' ? 'h-4 w-4' : 'h-3 w-3'))
</script>
