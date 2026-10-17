<template>
  <aside class="rounded-lg bg-shop-cream p-5">
    <h3 class="text-lg font-semibold text-shop-ink">{{ title }}</h3>
    <p class="text-xs text-gray-500">{{ caption }}</p>

    <ul class="mt-4 divide-y divide-black/5">
      <li v-for="product in products" :key="product.id" class="flex gap-3 py-3 first:pt-0 last:pb-0">
        <NuxtLink :to="`/buyer/product/${product.id}`" class="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-white">
          <img
            :src="product.image_url || fallbackProductImage(product.category)"
            :alt="product.name"
            loading="lazy"
            class="h-full w-full object-cover"
          >
        </NuxtLink>
        <div class="min-w-0 flex-1">
          <NuxtLink :to="`/buyer/product/${product.id}`" class="block truncate text-sm font-medium text-shop-ink hover:text-farm-leaf">
            {{ product.name }}
          </NuxtLink>
          <p class="text-xs font-semibold text-farm-leaf tabular-nums">{{ formatPeso(product.price) }}</p>
          <UiStarRating v-if="product.review_count" :value="product.average_rating ?? 0" class="mt-0.5" />
          <button
            type="button"
            class="mt-1.5 rounded border border-farm-leaf px-2.5 py-1 text-[11px] font-semibold text-farm-leaf transition hover:bg-farm-leaf hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
            :disabled="Number(product.stock) <= 0"
            @click="$emit('add-to-cart', product)"
          >
            {{ Number(product.stock) <= 0 ? 'Sold out' : 'Add to cart' }}
          </button>
        </div>
      </li>
    </ul>
  </aside>
</template>

<script setup lang="ts">
import type { BuyerProduct } from '~/components/buyer/ProductCard.vue'

withDefaults(defineProps<{
  products: BuyerProduct[]
  title?: string
  caption?: string
}>(), { title: 'Top Products', caption: 'Most ordered by buyers' })

defineEmits<{ 'add-to-cart': [product: BuyerProduct] }>()
</script>
