<template>
  <NuxtLink :to="tile.to" class="group relative block overflow-hidden rounded-lg bg-shop-cream">
    <img
      :src="tile.image"
      :alt="tile.title"
      loading="lazy"
      class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
    >
    <!-- Soft gradient so white text stays readable on any photo -->
    <div class="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
    <div class="relative flex h-full flex-col justify-end p-5 text-white sm:p-6">
      <p v-if="tile.label" class="text-[11px] font-medium uppercase tracking-[0.18em] text-white/75">{{ tile.label }}</p>
      <p class="mt-1 font-semibold" :class="large ? 'text-2xl sm:text-3xl' : 'text-xl'">{{ tile.title }}</p>
      <p class="mt-1 text-sm text-white/80">{{ tile.caption }}</p>
      <span class="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 group-hover:underline">
        Visit shop
        <Icon name="heroicons:arrow-right" class="h-4 w-4" />
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
