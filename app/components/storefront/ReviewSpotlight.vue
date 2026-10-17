<template>
  <div class="grid overflow-hidden rounded-lg bg-white ring-1 ring-gray-100 md:grid-cols-2">
    <div class="flex flex-col items-center justify-center px-6 py-10 text-center md:px-12">
      <p class="text-xs uppercase tracking-[0.18em] text-gray-400">What buyers say</p>
      <UiStarRating :value="review.rating" size="md" class="mt-4" />
      <blockquote class="mt-4 text-lg leading-relaxed text-shop-ink md:text-xl">
        “{{ review.comment }}”
      </blockquote>
      <p class="mt-5 text-sm font-semibold text-shop-ink">{{ review.buyer_name }}</p>
      <NuxtLink :to="`/buyer/product/${review.product.id}`" class="text-xs text-farm-leaf hover:underline">
        on {{ review.product.name }}
      </NuxtLink>
    </div>
    <NuxtLink :to="`/buyer/product/${review.product.id}`" class="block h-56 bg-shop-cream md:h-auto md:min-h-[300px]">
      <img
        :src="review.product.image_url || fallbackProductImage(review.product.category)"
        :alt="review.product.name"
        loading="lazy"
        class="h-full w-full object-cover"
      >
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
export interface FeaturedReview {
  id: string
  rating: number
  comment: string
  buyer_name: string
  product: { id: string; name: string; image_url?: string | null; category?: string | null }
}

defineProps<{ review: FeaturedReview }>()
</script>
