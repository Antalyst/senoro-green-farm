<template>
  <footer class="bg-shop-mint">
    <div class="mx-auto grid max-w-page grid-cols-2 gap-8 px-4 py-12 md:px-8 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr]">
      <div class="col-span-2 lg:col-span-1">
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="/logo2.png" alt="" class="h-9 w-9 object-contain">
          <span class="text-lg font-bold text-shop-ink">NFWM</span>
        </NuxtLink>
        <p class="mt-3 max-w-xs text-sm leading-relaxed text-gray-600">
          Negros Farmers Weekend Market — the local farmers' market of Negros, online.
        </p>
      </div>

      <div v-for="col in columns" :key="col.title">
        <p class="text-sm font-semibold text-shop-ink">{{ col.title }}</p>
        <ul class="mt-3 space-y-2">
          <li v-for="link in col.links" :key="link.label">
            <NuxtLink :to="link.to" class="text-sm text-gray-600 transition-colors hover:text-farm-leaf">{{ link.label }}</NuxtLink>
          </li>
        </ul>
      </div>

      <div class="col-span-2 sm:col-span-1">
        <p class="text-sm font-semibold text-shop-ink">Contact</p>
        <ul class="mt-3 space-y-2 text-sm text-gray-600">
          <li class="flex items-start gap-2">
            <Icon name="heroicons:map-pin" class="mt-0.5 h-4 w-4 flex-shrink-0 text-farm-leaf" />
            Bago City, Negros Occidental
          </li>
        </ul>
      </div>
    </div>

    <div class="border-t border-black/5">
      <div class="mx-auto flex max-w-page flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-gray-500 sm:flex-row md:px-8">
        <p>© {{ year }} NFWM. All rights reserved.</p>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium text-shop-ink ring-1 ring-black/5">
          <Icon name="heroicons:banknotes" class="h-4 w-4 text-farm-leaf" />
          Cash on delivery
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()

const columns = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', to: '/#products' },
      { label: 'Categories', to: '/#categories' },
      { label: 'Local shops', to: '/#shops' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'My orders', to: '/buyer/orders' },
      { label: 'Addresses', to: '/buyer/profile/addresses' },
      { label: 'Cart', to: '/buyer/cart' },
    ],
  },
  {
    title: 'Sell with us',
    links: [
      { label: 'Become a seller', to: '/auth/register?role=seller' },
      { label: 'Become a rider', to: '/auth/register?role=delivery' },
    ],
  },
]
</script>
