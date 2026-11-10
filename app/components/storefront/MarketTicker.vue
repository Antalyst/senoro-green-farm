<template>
  <div class="overflow-hidden bg-market-orange py-3 md:py-4" aria-hidden="true">
    <div data-ticker class="flex w-max items-center">
      <template v-for="n in 4" :key="n">
        <template v-for="word in words" :key="`${n}-${word.text}`">
          <span class="font-display whitespace-nowrap text-xl font-bold text-farm-dark md:text-3xl">{{ word.text }}</span>
          <img :src="word.icon" alt="" class="mx-4 h-7 w-7 flex-shrink-0 md:mx-7 md:h-10 md:w-10">
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const words = [
  { text: 'Fresh vegetables', icon: '/images/home/pechay.svg' },
  { text: 'Local fruits', icon: '/images/home/mango.svg' },
  { text: 'Street food', icon: '/images/home/tomato.svg' },
  { text: 'Kakanin', icon: '/images/home/calamansi.svg' },
  { text: 'Straight from Negros farms', icon: '/images/home/carrot.svg' },
]
</script>
