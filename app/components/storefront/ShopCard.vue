<template>
  <NuxtLink
    :to="`/buyer/shop/${shop.id}`"
    class="group flex flex-col overflow-hidden rounded-lg bg-white ring-1 ring-gray-100 transition hover:shadow-md"
  >
    <div class="relative h-36 bg-shop-cream">
      <img :src="shop.banner" :alt="shop.shop_name" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105">
      <span class="absolute -bottom-6 left-4 h-12 w-12 overflow-hidden rounded-full bg-white ring-4 ring-white">
        <img v-if="shop.avatar" :src="shop.avatar" alt="" class="h-full w-full object-cover">
        <span v-else class="flex h-full w-full items-center justify-center bg-farm-leaf text-sm font-semibold text-white">
          {{ shop.shop_name.charAt(0).toUpperCase() }}
        </span>
      </span>
    </div>
    <div class="flex flex-1 flex-col px-4 pb-4 pt-8">
      <p class="truncate text-sm font-semibold text-shop-ink">{{ shop.shop_name }}</p>
      <p class="text-xs text-gray-400">
        {{ shop.product_count }} {{ shop.product_count === 1 ? 'product' : 'products' }}
        <template v-if="shop.categories.length"> · {{ shop.categories.slice(0, 2).join(', ') }}</template>
      </p>
      <span class="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-farm-leaf">
        Visit shop
        <Icon name="heroicons:arrow-right" class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
export interface ShopSummary {
  id: string
  shop_name: string
  banner: string
  avatar?: string | null
  product_count: number
  categories: string[]
}

defineProps<{ shop: ShopSummary }>()
</script>
