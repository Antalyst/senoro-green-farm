import gsap from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(MotionPathPlugin, ScrollTrigger, SplitText)

export { gsap, ScrollTrigger, SplitText }

export const NO_REDUCED_MOTION = '(prefers-reduced-motion: no-preference)'

// Pages scroll inside ion-content (not the window), so ScrollTrigger must watch that element.
export async function pageScroller(el: Element): Promise<HTMLElement | undefined> {
  const content = el.closest('ion-content') as (Element & { getScrollElement: () => Promise<HTMLElement> }) | null
  if (!content) return undefined
  await customElements.whenDefined('ion-content')
  return content.getScrollElement()
}
