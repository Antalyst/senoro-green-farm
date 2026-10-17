<template>
  <section
    class="relative pb-10 pt-6 md:pt-10 lg:pb-14"
    aria-roledescription="carousel"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <!-- Mint block behind the text column (reference design) -->
    <div class="absolute bottom-0 left-0 hidden h-[62%] w-[58%] rounded-lg bg-shop-mint lg:block" aria-hidden="true" />

    <div class="relative grid items-center gap-6 lg:grid-cols-[45%_55%] lg:gap-0">
      <!-- Text -->
      <div class="order-2 rounded-lg bg-shop-mint px-5 py-7 sm:px-8 lg:order-1 lg:bg-transparent lg:py-0 lg:pl-10 lg:pr-12">
        <Transition name="hero-text" mode="out-in">
          <div :key="index">
            <p v-if="current.kicker" class="text-xs font-medium uppercase tracking-[0.18em] text-farm-leaf">{{ current.kicker }}</p>
            <h1 class="mt-3 text-3xl font-bold leading-tight tracking-tight text-shop-ink sm:text-4xl md:text-5xl">
              {{ current.title }}
            </h1>
            <p class="mt-4 max-w-md text-sm leading-relaxed text-gray-600 md:text-base">{{ current.text }}</p>
            <button
              type="button"
              class="mt-7 inline-flex items-center gap-2 rounded bg-farm-leaf px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-farm-deep"
              @click="$emit('cta', current.ctaTarget)"
            >
              {{ current.ctaLabel }}
              <Icon name="heroicons:arrow-right" class="h-4 w-4" />
            </button>
          </div>
        </Transition>

        <!-- Slide numbers 01 02 03 -->
        <div v-if="slides.length > 1" class="mt-8 flex items-center justify-center gap-4 lg:justify-start">
          <button
            v-for="(slide, i) in slides"
            :key="slide.title"
            type="button"
            class="flex items-center gap-2 text-xs font-semibold tabular-nums transition-colors"
            :class="i === index ? 'text-farm-leaf' : 'text-gray-400 hover:text-gray-600'"
            :aria-label="`Show slide ${i + 1}`"
            :aria-current="i === index"
            @click="go(i)"
          >
            {{ String(i + 1).padStart(2, '0') }}
            <span
              class="h-px bg-farm-leaf transition-all duration-300"
              :class="i === index ? 'w-8' : 'w-0'"
            />
          </button>
        </div>
      </div>

      <!-- Image -->
      <div class="order-1 lg:order-2">
        <div class="relative h-60 overflow-hidden rounded-lg bg-shop-cream sm:h-80 lg:h-[440px]">
          <Transition name="hero-image">
            <img
              :key="index"
              :src="current.image"
              :alt="current.imageAlt"
              class="absolute inset-0 h-full w-full object-cover"
            >
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface HeroSlide {
  kicker?: string
  title: string
  text: string
  image: string
  imageAlt: string
  ctaLabel: string
  ctaTarget: string
}

const props = defineProps<{ slides: HeroSlide[] }>()
defineEmits<{ cta: [target: string] }>()

const index = ref(0)
const paused = ref(false)
const current = computed(() => props.slides[index.value] ?? props.slides[0]!)

function go(i: number) {
  index.value = (i + props.slides.length) % props.slides.length
}

// Auto-advance every 6 s; pause on hover and when the user prefers less motion.
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || props.slides.length < 2) return
  timer = setInterval(() => {
    if (!paused.value && !document.hidden) go(index.value + 1)
  }, 6000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.hero-text-enter-active,
.hero-text-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.hero-text-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.hero-text-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.hero-image-enter-active,
.hero-image-leave-active {
  transition: opacity 0.6s ease;
}
.hero-image-enter-from,
.hero-image-leave-to {
  opacity: 0;
}
</style>
