<template>
  <section class="section overflow-hidden bg-farm-deep">
    <div class="home-wrap" data-journey>
      <StorefrontHomeHeading tone="light" label="How it works" title="From the farm to your door" />

      <!-- Wide screens: the rider follows the road as you scroll -->
      <svg viewBox="0 0 1136 190" class="mt-6 hidden w-full md:block" aria-hidden="true">
        <path data-road :d="ROAD" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 16" />
        <path data-road-fill :d="ROAD" fill="none" stroke="#E67E22" stroke-width="6" stroke-linecap="round" />
        <image data-rider href="/images/home/scooter.svg" x="0" y="50" width="104" height="88" />
      </svg>

      <!-- Phones: the rider follows a line down the steps -->
      <div class="relative mt-10 md:mt-2">
        <div class="absolute bottom-8 left-8 top-8 w-1 -translate-x-1/2 bg-white/20 md:hidden" aria-hidden="true">
          <div data-line-fill class="h-full w-full bg-market-orange" />
          <img data-rider-m src="/images/home/scooter.svg" alt="" class="absolute -left-[22px] top-0 z-10 h-10 w-12 max-w-none">
        </div>

        <ol class="relative grid gap-9 md:grid-cols-4 md:gap-6">
          <li v-for="(step, i) in steps" :key="step.title" data-reveal class="flex items-start gap-4 md:flex-col md:items-center md:text-center">
            <span class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-shop-cream md:h-24 md:w-24">
              <img :src="step.icon" alt="" loading="lazy" class="h-10 w-10 md:h-14 md:w-14">
            </span>
            <div class="min-w-0 pt-1 md:pt-0">
              <p class="text-xs font-semibold text-farm-yellow">Step {{ i + 1 }}</p>
              <h3 class="font-display mt-0.5 text-xl font-bold text-white md:text-2xl">{{ step.title }}</h3>
              <p class="mt-1 text-sm leading-relaxed text-white/80">{{ step.text }}</p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const ROAD = 'M12 128 C 150 34, 270 34, 396 104 S 640 176, 770 96 S 1010 36, 1124 118'

const steps = [
  { icon: '/images/home/basket.svg', title: 'Pick your produce', text: 'Browse local shops and fill your cart.' },
  { icon: '/images/home/crate.svg', title: 'The shop packs it', text: 'Sellers confirm and prepare your order.' },
  { icon: '/images/home/scooter.svg', title: 'A rider brings it', text: 'Track your order and message your rider.' },
  { icon: '/images/home/home.svg', title: 'Enjoy and review', text: 'Show your QR to the rider, then rate your order.' },
]
</script>

<style scoped>
.section {
  padding-block: 3.5rem;
}

@media (min-width: 768px) {
  .section {
    padding-block: 5.5rem;
  }
}
</style>
