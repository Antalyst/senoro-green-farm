<template>
  <ul class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
    <li
      v-for="item in items"
      :key="item.label"
      data-reveal
      class="flex flex-col items-center rounded-lg bg-white px-3 py-6 text-center md:py-8"
    >
      <span class="flex h-20 w-20 items-center justify-center rounded-full bg-farm-light md:h-24 md:w-24">
        <img :src="item.icon" alt="" loading="lazy" class="h-12 w-12 md:h-14 md:w-14">
      </span>
      <p class="font-display mt-4 text-lg font-bold text-shop-ink md:text-xl">{{ item.label }}</p>
      <p class="mt-1 text-[13px] leading-snug text-gray-600 md:text-sm">{{ item.caption }}</p>
    </li>
  </ul>
</template>

<script setup lang="ts">
// Only real promises of this system (see docs/design-storefront-redesign.md §4.4).
const items = [
  { icon: '/images/home/scooter.svg', label: 'Local delivery', caption: 'Fee based on distance' },
  { icon: '/images/home/basket.svg', label: 'Farm fresh', caption: 'Straight from local farmers' },
  { icon: '/images/home/cash.svg', label: 'Cash on delivery', caption: 'Pay when it arrives' },
  { icon: '/images/home/chat.svg', label: 'Chat with rider', caption: 'Message your rider live' },
]
</script>
