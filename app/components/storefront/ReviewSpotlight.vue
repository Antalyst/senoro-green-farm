<template>
  <div data-reveal class="grid items-center gap-8 md:grid-cols-[1.2fr_1fr] md:gap-14">
    <div class="text-center md:text-left">
      <UiStarRating :value="review.rating" size="md" />
      <blockquote class="font-display mt-4 text-2xl font-semibold leading-snug text-shop-ink md:text-4xl">
        “{{ review.comment }}”
      </blockquote>
      <p class="mt-5 text-base font-semibold text-shop-ink">{{ review.buyer_name }}</p>
      <NuxtLink :to="`/buyer/product/${review.product.id}`" class="text-sm font-medium text-farm-deep underline-offset-4 hover:underline">
        on {{ review.product.name }}
      </NuxtLink>
    </div>
    <NuxtLink :to="`/buyer/product/${review.product.id}`" class="mx-auto block aspect-[4/5] w-full max-w-[320px] overflow-hidden rounded-t-full bg-white">
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
