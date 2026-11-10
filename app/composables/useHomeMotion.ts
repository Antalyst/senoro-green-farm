import type { Ref } from 'vue'
import { gsap, NO_REDUCED_MOTION, pageScroller, ScrollTrigger, SplitText } from '~/utils/gsap'

const CLEAR = 'transform,opacity,visibility'

/**
 * Scroll animation for the home page. Nothing is hidden until JS runs, and everything is skipped
 * when the visitor asks for reduced motion. Markers used in the templates:
 *   data-reveal         fades up when scrolled to
 *   data-split          heading whose lines slide up
 *   data-parallax="40"  drifts by that many px while its data-scene is on screen
 *   data-ticker         band that slides sideways with the scroll
 *   data-journey + data-road, data-road-fill, data-rider, data-line-fill, data-rider-m
 */
export function useHomeMotion(root: Ref<HTMLElement | null>, ready: Ref<boolean>) {
  let mm: gsap.MatchMedia | undefined
  let observer: ResizeObserver | undefined
  let refreshTimer: ReturnType<typeof setTimeout> | undefined
  let buildId = 0
  let motionOn = false
  let seenCards = new WeakSet<Element>()

  function teardown() {
    observer?.disconnect()
    observer = undefined
    clearTimeout(refreshTimer)
    mm?.revert()
    mm = undefined
    motionOn = false
  }

  function reveals(el: HTMLElement, scroller: HTMLElement) {
    const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', el)
    items.forEach(item => seenCards.add(item))
    gsap.set(items, { autoAlpha: 0, y: 26 })
    ScrollTrigger.batch(items, {
      scroller,
      start: 'top 92%',
      once: true,
      interval: 0.08,
      batchMax: 8,
      onEnter: batch => gsap.to(batch, {
        autoAlpha: 1, y: 0, duration: 0.65, ease: 'power3.out', stagger: 0.07, overwrite: true, clearProps: CLEAR,
      }),
    })
  }

  function headings(el: HTMLElement, scroller: HTMLElement) {
    gsap.utils.toArray<HTMLElement>('[data-split]', el).forEach((heading) => {
      gsap.set(heading, { autoAlpha: 0 })
      ScrollTrigger.create({
        trigger: heading,
        scroller,
        start: 'top 90%',
        once: true,
        onEnter() {
          const split = SplitText.create(heading, { type: 'lines', mask: 'lines' })
          gsap.set(heading, { autoAlpha: 1 })
          gsap.from(split.lines, {
            yPercent: 105,
            duration: 0.75,
            ease: 'power3.out',
            stagger: 0.08,
            onComplete: () => split.revert(),
          })
        },
      })
    })
  }

  function drift(el: HTMLElement, scroller: HTMLElement, wide: boolean) {
    gsap.utils.toArray<HTMLElement>('[data-parallax]', el).forEach((item) => {
      const amount = Number(item.dataset.parallax) * (wide ? 1 : 0.5)
      gsap.fromTo(item, { y: amount }, {
        y: -amount,
        ease: 'none',
        scrollTrigger: { trigger: item.closest('[data-scene]') ?? item, scroller, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
      })
    })

    gsap.utils.toArray<HTMLElement>('[data-ticker]', el).forEach((band) => {
      gsap.to(band, {
        xPercent: -22,
        ease: 'none',
        scrollTrigger: { trigger: band, scroller, start: 'top bottom', end: '+=1800', scrub: 0.5 },
      })
    })
  }

  function journey(el: HTMLElement, scroller: HTMLElement, wide: boolean) {
    const section = el.querySelector<HTMLElement>('[data-journey]')
    if (!section) return
    const scrollTrigger = { trigger: section, scroller, start: 'top 70%', end: 'bottom 75%', scrub: 0.6, invalidateOnRefresh: true }

    if (wide) {
      const road = section.querySelector<SVGPathElement>('[data-road]')
      const fill = section.querySelector<SVGPathElement>('[data-road-fill]')
      const rider = section.querySelector<SVGImageElement>('[data-rider]')
      if (!road || !fill || !rider) return
      const length = road.getTotalLength()
      gsap.set(fill, { strokeDasharray: length })
      gsap.timeline({ scrollTrigger })
        .fromTo(fill, { strokeDashoffset: length }, { strokeDashoffset: 0, ease: 'none' }, 0)
        .fromTo(rider, { motionPath: { path: road, align: road, alignOrigin: [0.5, 0.92], start: 0, end: 0 } }, {
          motionPath: { path: road, align: road, alignOrigin: [0.5, 0.92], start: 0, end: 1 },
          ease: 'none',
        }, 0)
      return
    }

    const line = section.querySelector<HTMLElement>('[data-line-fill]')
    const rider = section.querySelector<HTMLElement>('[data-rider-m]')
    if (!line || !rider) return
    gsap.timeline({ scrollTrigger })
      .fromTo(line, { scaleY: 0 }, { scaleY: 1, ease: 'none', transformOrigin: 'top' }, 0)
      .fromTo(rider, { y: 0 }, { y: () => (line.parentElement?.offsetHeight ?? 0) - rider.offsetHeight, ease: 'none' }, 0)
  }

  async function build() {
    const id = ++buildId
    await nextTick()
    const el = root.value
    if (!el) return
    const scroller = await pageScroller(el)
    if (id !== buildId || !scroller) return

    teardown()
    seenCards = new WeakSet()
    mm = gsap.matchMedia(el)
    mm.add({ motion: NO_REDUCED_MOTION, wide: '(min-width: 768px)', phone: '(max-width: 767.98px)' }, (context) => {
      if (!context.conditions?.motion) return
      motionOn = true
      const wide = !!context.conditions.wide
      reveals(el, scroller)
      headings(el, scroller)
      drift(el, scroller, wide)
      journey(el, scroller, wide)
    })

    // Sizes change as images and sections arrive, so re-measure the trigger positions.
    let lastHeight = el.offsetHeight
    observer = new ResizeObserver(() => {
      if (Math.abs(el.offsetHeight - lastHeight) < 2) return
      lastHeight = el.offsetHeight
      clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 200)
    })
    observer.observe(el)
  }

  /** Fades in product cards added after the page was built (category filter, "show all"). */
  function animateNewCards() {
    if (!motionOn || !root.value) return
    const grid = root.value.querySelector('[data-product-grid]')
    if (!grid) return
    const cards = [...grid.children].filter(card => !seenCards.has(card))
    if (!cards.length) return
    cards.forEach(card => seenCards.add(card))
    gsap.fromTo(cards, { autoAlpha: 0, y: 16 }, {
      autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.03, clearProps: CLEAR,
    })
  }

  watch(ready, (isReady) => {
    if (isReady) {
      build()
      return
    }
    buildId++
    teardown()
  }, { immediate: true })

  onBeforeUnmount(() => {
    buildId++
    teardown()
  })

  return { animateNewCards }
}
