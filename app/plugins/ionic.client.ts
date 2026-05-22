import { IonicVue } from '@ionic/vue'
import { defineCustomElements } from '@ionic/pwa-elements/loader'

export default defineNuxtPlugin((nuxtApp) => {
  // Install Ionic Vue — client-only to avoid SSR issues
  nuxtApp.vueApp.use(IonicVue, {
    mode: 'md', // Material Design mode — consistent cross-platform look
    animated: true,
    rippleEffect: true,
  })

  // Register Ionic web components (camera, toast, modals, etc.)
  // Required for custom elements to work in Capacitor webview
  if (typeof window !== 'undefined') {
    defineCustomElements(window).catch(() => {
      // Silently ignore if PWA elements not available
    })
  }
})
