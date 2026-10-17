<template>
  <!-- Left photo panel shared by the auth pages (desktop only) -->
  <aside class="relative hidden overflow-hidden rounded-2xl lg:flex lg:flex-col">
    <img
      :src="image"
      alt=""
      class="absolute inset-0 h-full w-full object-cover"
    >
    <div class="absolute inset-0 bg-gradient-to-t from-farm-dark/90 via-farm-dark/40 to-farm-dark/10" />

    <div class="relative flex h-full flex-col justify-between p-10 text-white">
      <NuxtLink to="/" class="flex items-center gap-2.5 self-start rounded-full bg-white/10 py-1.5 pl-1.5 pr-4 ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/20">
        <img src="/logo2.png" alt="" class="h-8 w-8 rounded-full object-contain">
        <span class="text-sm font-semibold">NFWM</span>
      </NuxtLink>

      <div>
        <h2 class="max-w-md text-4xl font-bold leading-tight tracking-tight">{{ title }}</h2>
        <p class="mt-4 max-w-md text-base leading-relaxed text-white/80">{{ text }}</p>

        <ul class="mt-8 grid max-w-md grid-cols-2 gap-3">
          <li
            v-for="point in points"
            :key="point.label"
            class="flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5 text-sm ring-1 ring-white/15 backdrop-blur-sm"
          >
            <Icon :name="point.icon" class="h-5 w-5 flex-shrink-0 text-shop-mint" />
            {{ point.label }}
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  text?: string
  image?: string
}>(), {
  title: 'Fresh from the farm, straight to your table',
  text: 'Buy vegetables, fruits and local food from Negros farmers and market vendors.',
  image: '/images/campaign/fresh-produce-basket.png',
})

// Same true promises as the storefront service strip.
const points = [
  { icon: 'heroicons:truck', label: 'Local delivery' },
  { icon: 'heroicons:sparkles', label: 'Farm fresh' },
  { icon: 'heroicons:banknotes', label: 'Cash on delivery' },
  { icon: 'heroicons:chat-bubble-left-right', label: 'Chat with rider' },
]
</script>
