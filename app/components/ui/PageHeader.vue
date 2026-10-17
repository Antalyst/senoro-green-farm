<template>
  <header class="flex flex-col gap-4 border-b border-farm-leaf/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p v-if="label" class="text-xs font-medium text-market-orange">{{ label }}</p>
      <h1 class="mt-1 text-2xl font-semibold text-farm-deep">{{ title }}</h1>
      <p v-if="caption" class="mt-1 text-sm text-gray-500">{{ caption }}</p>
    </div>
    <div v-if="$slots.default" class="flex flex-wrap items-center gap-2">
      <slot />
    </div>
  </header>
</template>

<script setup lang="ts">
// Title row shared by admin and seller pages.
defineProps<{
  title: string
  label?: string
  caption?: string
}>()
</script>
