<template>
  <NuxtLink :to="tile.to" class="group relative block overflow-hidden rounded-lg bg-shop-cream">
    <img
      :src="tile.image"
      :alt="tile.title"
      loading="lazy"
      class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
    >
    <div class="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-md bg-white p-4 sm:bottom-5 sm:left-5 sm:min-w-[260px] sm:p-5">
      <p v-if="tile.label" class="text-xs font-semibold text-farm-leaf">{{ tile.label }}</p>
      <p class="font-display mt-0.5 font-bold text-shop-ink" :class="large ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'">{{ tile.title }}</p>
      <p class="mt-1 text-sm text-gray-600">{{ tile.caption }}</p>
      <span class="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-farm-deep group-hover:text-market-orange">
        Visit shop
        <Icon name="heroicons:arrow-right" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
export interface PromoTileData {
  label?: string
  title: string
  caption: string
  image: string
  to: string
}

defineProps<{ tile: PromoTileData; large?: boolean }>()
</script>
