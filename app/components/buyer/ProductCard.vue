<template>
  <article class="group flex flex-col">
    <div class="relative overflow-hidden rounded-md bg-shop-cream">
      <NuxtLink :to="`/buyer/product/${product.id}`" class="block aspect-square" :aria-label="product.name">
        <img
          :src="product.image_url || fallbackProductImage(product.category)"
          :alt="product.name"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        >
      </NuxtLink>

      <span
        v-if="soldOut"
        class="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60 text-xs font-semibold uppercase tracking-[0.2em] text-gray-600"
      >
        Sold out
      </span>
      <span
        v-else-if="lowStock"
        class="pointer-events-none absolute left-2 top-2 rounded bg-market-orange px-2 py-0.5 text-[10px] font-semibold text-white"
      >
        Only {{ product.stock }} left
      </span>

      <!-- Desktop: actions slide up on hover -->
      <div
        v-if="!soldOut"
        class="absolute inset-x-0 bottom-3 hidden translate-y-2 justify-center gap-2 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 lg:flex"
      >
        <button
          type="button"
          class="card-action"
          title="Add to cart"
          aria-label="Add to cart"
          @click.stop="$emit('add-to-cart', product)"
        >
          <Icon name="heroicons:shopping-cart" class="h-[18px] w-[18px]" />
        </button>
        <NuxtLink :to="`/buyer/product/${product.id}`" class="card-action" title="View product" aria-label="View product">
          <Icon name="heroicons:eye" class="h-[18px] w-[18px]" />
        </NuxtLink>
        <button
          type="button"
          class="card-action"
          title="Buy now"
          aria-label="Buy now"
          @click.stop="$emit('buy-now', product)"
        >
          <Icon name="heroicons:bolt" class="h-[18px] w-[18px]" />
        </button>
      </div>

      <!-- Phones/tablets: always-visible cart button -->
      <button
        v-if="!soldOut"
        type="button"
        class="card-action absolute bottom-2 right-2 lg:hidden"
        aria-label="Add to cart"
        @click.stop="$emit('add-to-cart', product)"
      >
        <Icon name="heroicons:shopping-cart" class="h-[18px] w-[18px]" />
      </button>
    </div>

    <div class="flex flex-1 flex-col pt-3">
      <NuxtLink
        v-if="product.users?.id"
        :to="`/buyer/shop/${product.users.id}`"
        class="truncate text-[11px] text-gray-400 transition-colors hover:text-farm-leaf"
      >
        {{ product.users?.shop_name || product.users?.full_name || 'Local seller' }}
      </NuxtLink>
      <NuxtLink :to="`/buyer/product/${product.id}`">
        <h3 class="mt-0.5 truncate text-sm font-medium text-shop-ink transition-colors group-hover:text-farm-leaf">
          {{ product.name }}
        </h3>
      </NuxtLink>
      <div class="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <p class="text-sm font-semibold text-farm-leaf tabular-nums">
          {{ formatPeso(product.price) }}
          <span v-if="product.unit_type" class="text-[11px] font-normal text-gray-400">/ {{ product.unit_type }}</span>
        </p>
        <UiStarRating
          v-if="product.review_count"
          :value="product.average_rating ?? 0"
          :count="product.review_count"
        />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
export interface BuyerProduct {
  id: string
  name: string
  price: string | number
  stock: number
  category: string
  category_id?: string | null
  image_url?: string | null
  unit_type?: string | null
  average_rating?: number
  review_count?: number
  users?: {
    id?: string
    full_name?: string
    shop_name?: string | null
    shop_avatar_url?: string | null
    shop_banner_url?: string | null
  }
}

const props = defineProps<{
  product: BuyerProduct
}>()

defineEmits<{
  'add-to-cart': [product: BuyerProduct]
  'buy-now': [product: BuyerProduct]
}>()

const soldOut = computed(() => Number(props.product.stock) <= 0)
const lowStock = computed(() => Number(props.product.stock) > 0 && Number(props.product.stock) <= 5)
</script>

<style scoped>
.card-action {
  @apply flex h-10 w-10 items-center justify-center rounded-full bg-white text-shop-ink shadow-md ring-1 ring-black/5 transition hover:bg-farm-leaf hover:text-white;
}
</style>
