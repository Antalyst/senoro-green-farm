<template>
  <section
    ref="root"
    class="relative overflow-hidden bg-farm-deep text-white"
    aria-roledescription="carousel"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
    @focusin="onFocusIn"
    @focusout="focused = false"
  >
    <div data-awning class="home-awning relative z-20" aria-hidden="true" />

    <div class="home-wrap relative grid items-center gap-10 pb-14 pt-8 lg:grid-cols-[1.08fr_1fr] lg:gap-8 lg:pb-20 lg:pt-8">
      <!-- Text -->
      <div class="relative z-10">
        <Transition mode="out-in" :css="false" @enter="textEnter" @leave="textLeave">
          <div :key="index" class="min-h-[17.5rem] sm:min-h-[19rem] lg:min-h-[23rem]">
            <p v-if="current.kicker" data-fade class="inline-block rounded bg-farm-yellow px-2.5 py-1 text-xs font-semibold text-farm-dark">
              {{ current.kicker }}
            </p>
            <h1 class="font-display mt-4 text-[2.6rem] font-bold leading-[1.02] sm:text-6xl lg:text-[4.4rem]">
              {{ current.title }}
            </h1>
            <p data-fade class="mt-5 max-w-md text-[0.95rem] leading-relaxed text-white/85 md:text-lg">{{ current.text }}</p>
            <button
              data-fade
              type="button"
              class="mt-7 inline-flex min-h-[48px] items-center gap-2 rounded bg-market-orange px-7 text-sm font-bold text-farm-dark transition-colors hover:bg-farm-yellow"
              @click="$emit('cta', current.ctaTarget)"
            >
              {{ current.ctaLabel }}
              <Icon name="heroicons:arrow-right" class="h-4 w-4" />
            </button>
          </div>
        </Transition>

        <!-- Slide numbers 01 02 03 -->
        <div v-if="slides.length > 1" data-hero-numbers class="mt-6 flex items-center gap-2">
          <button
            v-for="(slide, i) in slides"
            :key="slide.title"
            type="button"
            class="flex min-h-[44px] items-center gap-2 px-1 text-sm font-semibold tabular-nums transition-colors"
            :class="i === index ? 'text-white' : 'text-white/60 hover:text-white'"
            :aria-label="`Show slide ${i + 1}`"
            :aria-current="i === index"
            @click="go(i)"
          >
            {{ String(i + 1).padStart(2, '0') }}
            <span class="block h-0.5 overflow-hidden bg-white/25 transition-[width] duration-300" :class="i === index ? 'w-12' : 'w-0'">
              <span v-if="i === index" class="hero-bar block h-full origin-left bg-market-orange" />
            </span>
          </button>
        </div>
      </div>

      <!-- Market stall arch -->
      <div class="relative mx-auto w-full max-w-[270px] sm:max-w-[340px] lg:max-w-[430px]">
        <div data-sun class="absolute -right-8 -top-5 aspect-square w-[78%] rounded-full bg-market-orange lg:-right-14" aria-hidden="true" />
        <div data-arch class="relative aspect-[4/5] overflow-hidden rounded-t-full bg-shop-cream">
          <Transition :css="false" @enter="imageEnter" @leave="imageLeave">
            <img
              :key="index"
              :src="current.image"
              :alt="current.imageAlt"
              class="absolute inset-0 h-full w-full object-cover"
            >
          </Transition>
        </div>

        <div
          v-for="item in produce"
          :key="item.src"
          :data-float="item.speed"
          class="pointer-events-none absolute"
          :class="item.place"
          aria-hidden="true"
        >
          <img data-produce :src="item.src" alt="" class="h-full w-full">
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { gsap, NO_REDUCED_MOTION, pageScroller, SplitText } from '~/utils/gsap'

export interface HeroSlide {
  kicker?: string
  title: string
  text: string
  image: string
  imageAlt: string
  ctaLabel: string
  ctaTarget: string
}

const SLIDE_SECONDS = 6

const produce = [
  { src: '/images/home/tomato.svg', place: '-left-7 top-[34%] h-20 w-20 lg:-left-16 lg:h-28 lg:w-28', speed: 70 },
  { src: '/images/home/pechay.svg', place: '-left-3 bottom-[3%] h-20 w-20 lg:-left-20 lg:h-32 lg:w-32', speed: 36 },
  { src: '/images/home/eggplant.svg', place: '-right-6 top-[40%] h-20 w-20 lg:-right-16 lg:h-28 lg:w-28', speed: 90 },
  { src: '/images/home/mango.svg', place: '-right-3 -bottom-2 h-20 w-20 lg:-right-10 lg:h-28 lg:w-28', speed: 50 },
  { src: '/images/home/calamansi.svg', place: 'left-[6%] top-[7%] h-12 w-12 lg:h-16 lg:w-16', speed: 120 },
]

const props = defineProps<{ slides: HeroSlide[] }>()
defineEmits<{ cta: [target: string] }>()

const root = ref<HTMLElement | null>(null)
const index = ref(0)
const hovering = ref(false)
const focused = ref(false)
const current = computed(() => props.slides[index.value] ?? props.slides[0]!)

let reduceMotion = false
let timer: gsap.core.Tween | undefined
let mm: gsap.MatchMedia | undefined
let scrollMotionId = 0

function go(i: number) {
  index.value = (i + props.slides.length) % props.slides.length
}

function onFocusIn(event: FocusEvent) {
  focused.value = (event.target as HTMLElement).matches(':focus-visible')
}

// Auto-advance; the bar on the active number shows the time left.
function startTimer() {
  timer?.kill()
  if (reduceMotion || props.slides.length < 2 || !root.value) return
  const progress = { value: 0 }
  timer = gsap.to(progress, {
    value: 1,
    duration: SLIDE_SECONDS,
    ease: 'none',
    paused: hovering.value || focused.value,
    onUpdate: () => root.value?.style.setProperty('--hero-progress', String(progress.value)),
    onComplete: () => go(index.value + 1),
  })
}

watch(index, startTimer)
watch([hovering, focused], ([isHovering, isFocused]) => {
  if (isHovering || isFocused) timer?.pause()
  else timer?.resume()
})

// ---------- Slide change ----------

function textEnter(el: Element, done: () => void) {
  if (reduceMotion) return done()
  const split = SplitText.create(el.querySelector('h1'), { type: 'lines', mask: 'lines' })
  gsap.timeline({ onComplete() { split.revert(); done() } })
    .from(split.lines, { yPercent: 105, duration: 0.6, ease: 'power3.out', stagger: 0.07 })
    .from(el.querySelectorAll('[data-fade]'), { autoAlpha: 0, y: 12, duration: 0.4, ease: 'power2.out', stagger: 0.06, clearProps: 'all' }, 0.2)
}

function textLeave(el: Element, done: () => void) {
  if (reduceMotion) return done()
  gsap.to(el, { autoAlpha: 0, y: -10, duration: 0.2, ease: 'power1.in', onComplete: done })
}

function imageEnter(el: Element, done: () => void) {
  if (reduceMotion) return done()
  gsap.fromTo(el, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power2.out', onComplete: done })
}

function imageLeave(el: Element, done: () => void) {
  if (reduceMotion) return done()
  gsap.to(el, { autoAlpha: 0, duration: 0.5, ease: 'power1.inOut', onComplete: done })
}

// ---------- First load + scroll drift ----------

function playIntro() {
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('[data-awning]', { scaleY: 0, transformOrigin: 'top', duration: 0.6, ease: 'power2.out' })
    .from('h1', { y: 44, autoAlpha: 0, duration: 0.8 }, 0.15)
    .from('[data-fade], [data-hero-numbers]', { y: 16, autoAlpha: 0, duration: 0.55, stagger: 0.08 }, 0.35)
    .from('[data-arch]', { yPercent: 12, autoAlpha: 0, duration: 0.95 }, 0.2)
    .from('[data-sun]', { yPercent: 45, autoAlpha: 0, duration: 1.1 }, 0.3)
    .from('[data-produce]', { scale: 0, rotation: -35, duration: 0.65, stagger: 0.08, ease: 'back.out(1.8)' }, 0.65)
}

async function addScrollDrift(el: HTMLElement, id: number) {
  const scroller = await pageScroller(el)
  if (id !== scrollMotionId || !scroller || !mm) return
  mm.add(NO_REDUCED_MOTION, () => {
    const scrollTrigger = { trigger: el, scroller, start: 'top top', end: 'bottom top', scrub: 0.5 }
    gsap.utils.toArray<HTMLElement>('[data-float]', el).forEach((item) => {
      gsap.to(item, { y: -Number(item.dataset.float), ease: 'none', scrollTrigger })
    })
    gsap.to('[data-sun]', { yPercent: 18, ease: 'none', scrollTrigger })
  })
}

onMounted(() => {
  const el = root.value
  if (!el) return
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  mm = gsap.matchMedia(el)
  mm.add(NO_REDUCED_MOTION, playIntro)
  addScrollDrift(el, ++scrollMotionId)
  startTimer()
})

onBeforeUnmount(() => {
  scrollMotionId++
  timer?.kill()
  mm?.revert()
})
</script>

<style scoped>
.hero-bar {
  transform: scaleX(var(--hero-progress, 1));
}
</style>
