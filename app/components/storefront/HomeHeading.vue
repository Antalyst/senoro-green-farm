<template>
  <div
    class="flex flex-col gap-4"
    :class="align === 'center' ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'"
  >
    <div class="min-w-0">
      <p
        v-if="label"
        class="flex items-center gap-2 text-sm font-semibold"
        :class="[tone === 'light' ? 'text-farm-yellow' : 'text-farm-deep', align === 'center' ? 'justify-center' : '']"
      >
        <span class="h-0.5 w-6 bg-market-orange" aria-hidden="true" />
        {{ label }}
      </p>
      <h2
        data-split
        class="font-display mt-2 text-[2.1rem] font-bold leading-[1.06] md:text-5xl"
        :class="tone === 'light' ? 'text-white' : 'text-shop-ink'"
      >
        {{ title }}
      </h2>
      <p v-if="caption" class="mt-2 text-sm md:text-base" :class="tone === 'light' ? 'text-white/80' : 'text-gray-600'">{{ caption }}</p>
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
  tone?: 'dark' | 'light'
}>(), { align: 'center', tone: 'dark' })
</script>
