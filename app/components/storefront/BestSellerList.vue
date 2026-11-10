<template>
  <aside class="rounded-lg bg-farm-deep p-5 text-white">
    <h3 class="font-display text-2xl font-bold">{{ title }}</h3>
    <p class="mt-0.5 text-[13px] text-white/75">{{ caption }}</p>

    <ul class="mt-4 divide-y divide-white/15">
      <li v-for="product in products" :key="product.id" class="flex gap-3 py-3 first:pt-0 last:pb-0">
        <NuxtLink :to="`/buyer/product/${product.id}`" class="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded bg-white">
          <img
            :src="product.image_url || fallbackProductImage(product.category)"
            :alt="product.name"
            loading="lazy"
            class="h-full w-full object-cover"
          >
        </NuxtLink>
        <div class="min-w-0 flex-1">
          <NuxtLink :to="`/buyer/product/${product.id}`" class="block truncate text-sm font-semibold hover:text-farm-yellow">
            {{ product.name }}
          </NuxtLink>
          <p class="text-[13px] font-semibold tabular-nums text-farm-yellow">{{ formatPeso(product.price) }}</p>
          <UiStarRating v-if="product.review_count" :value="product.average_rating ?? 0" class="mt-0.5" />
          <button
            type="button"
            class="mt-2 block min-h-[32px] rounded bg-market-orange px-3 text-xs font-bold text-farm-dark transition-colors hover:bg-farm-yellow disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/70"
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
