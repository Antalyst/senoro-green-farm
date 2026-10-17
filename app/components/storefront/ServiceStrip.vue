<template>
  <ul class="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
    <li v-for="item in items" :key="item.label" class="flex flex-col items-center text-center">
      <span class="flex h-14 w-14 items-center justify-center rounded-full bg-shop-mint text-farm-leaf">
        <Icon :name="item.icon" class="h-7 w-7" />
      </span>
      <p class="mt-3 text-sm font-semibold text-shop-ink">{{ item.label }}</p>
      <p class="mt-0.5 text-xs text-gray-500">{{ item.caption }}</p>
    </li>
  </ul>
</template>

<script setup lang="ts">
// Only real promises of this system (see docs/design-storefront-redesign.md §4.4).
const items = [
  { icon: 'heroicons:truck', label: 'Local delivery', caption: 'Fee based on distance' },
  { icon: 'heroicons:sparkles', label: 'Farm fresh', caption: 'Straight from local farmers' },
  { icon: 'heroicons:banknotes', label: 'Cash on delivery', caption: 'Pay when it arrives' },
  { icon: 'heroicons:chat-bubble-left-right', label: 'Chat with rider', caption: 'Message your rider live' },
]
</script>
