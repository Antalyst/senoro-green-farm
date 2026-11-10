<template>
  <section data-scene class="relative overflow-hidden bg-farm-light pt-14 md:pt-20">
    <div class="home-wrap relative z-10 text-center">
      <StorefrontHomeHeading label="Support local" title="Grown in Negros. Delivered to your door." />
      <button
        data-reveal
        type="button"
        class="mt-7 inline-flex min-h-[48px] items-center gap-2 rounded bg-market-orange px-7 text-sm font-bold text-farm-dark transition-colors hover:bg-farm-yellow"
        @click="$emit('cta', 'products')"
      >
        Go To Shop
        <Icon name="heroicons:arrow-right" class="h-4 w-4" />
      </button>
    </div>

    <svg
      viewBox="0 0 1440 420"
      preserveAspectRatio="xMidYMax slice"
      class="-mt-4 block h-[260px] w-full overflow-visible md:-mt-16 md:h-[420px]"
      aria-hidden="true"
    >
      <circle data-parallax="-46" cx="955" cy="196" r="84" fill="#F2B233" />

      <g data-parallax="34">
        <path d="M430 440 690 150q16-17 32-6l18 12 20-12q16-9 32 6l290 290z" fill="#9CBFA3" />
        <path d="m740 156 20-12q16-9 32 6l290 290H740z" fill="#86AD8F" />
      </g>

      <path data-parallax="22" d="M0 300c180-90 320-90 500-30s300 50 470-20 330-70 470 0v190H0z" fill="#4E8B57" />

      <g data-parallax="12">
        <path d="M0 350c220-70 420-70 640-20s480 40 800-40v150H0z" fill="#2F5D3A" />
        <g stroke="#6E9F45" stroke-width="6" stroke-linecap="round">
          <path d="M90 372l36-52M150 366l36-52M210 360l36-52M270 356l36-52M330 352l36-52" />
          <path d="M1040 356l-36-52M1100 346l-36-52M1160 336l-36-52M1220 326l-36-52M1280 316l-36-52" />
        </g>

        <!-- Nipa hut -->
        <path d="M566 328v-44h92v44z" fill="#D9A866" />
        <path d="m546 288 66-54 66 54z" fill="#A96F35" />
        <path d="M600 328v-28h24v28z" fill="#1A3521" />

        <!-- Coconut trees -->
        <path d="M396 338c8-38 8-74 2-112h10c8 38 8 74 2 112z" fill="#1A3521" />
        <path d="M403 226c-30-26-62-22-84-2 30-6 58-2 84 2zM403 226c30-26 62-22 84-2-30-6-58-2-84 2zM403 226c-22-34-50-42-78-32 28 2 54 14 78 32zM403 226c22-34 50-42 78-32-28 2-54 14-78 32z" fill="#4E8B57" />
        <path d="M842 334c8-34 8-66 2-98h9c8 32 8 64 2 98z" fill="#1A3521" />
        <path d="M848 236c-26-22-54-20-74-2 26-6 50-2 74 2zM848 236c26-22 54-20 74-2-26-6-50-2-74 2zM848 236c-20-30-44-36-68-28 24 2 48 12 68 28zM848 236c20-30 44-36 68-28-24 2-48 12-68 28z" fill="#6E9F45" />
      </g>

      <!-- Same colour as the footer, so the hill runs straight into it -->
      <path d="M0 392c260-44 500-44 760-14s460 22 680-20v62H0z" fill="#E4F1EA" />
    </svg>
  </section>
</template>

<script setup lang="ts">
defineEmits<{ cta: [target: string] }>()
</script>
