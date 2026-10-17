<template>
  <div
    class="flex flex-col gap-3"
    :class="align === 'center' ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'"
  >
    <div>
      <p v-if="label" class="text-xs text-gray-400">{{ label }}</p>
      <h2 class="mt-1 text-2xl font-semibold tracking-tight text-shop-ink md:text-3xl">{{ title }}</h2>
      <p v-if="caption" class="mt-1.5 text-sm text-gray-500">{{ caption }}</p>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  label?: string
  caption?: string
  align?: 'center' | 'left'
}>(), { align: 'center' })
</script>
