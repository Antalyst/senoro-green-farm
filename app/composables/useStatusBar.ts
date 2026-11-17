import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'

// Colour of the phone's status-bar icons (clock, battery) in the Android / iOS app.
// The app draws behind the status bar, so the icons must contrast with our header:
//   'dark'  icons → white headers (buyer, rider, sign-in, chat)
//   'light' icons → green or black screens (seller, admin, photo viewer, QR scanner)
// In a normal browser this does nothing.

type Icons = 'dark' | 'light'

let pageIcons: Icons = 'dark'
const overlays: { icons: Icons }[] = []

function apply() {
  if (!import.meta.client) return
  try {
    if (!Capacitor.isNativePlatform()) return
  }
  catch {
    return
  }
  const icons = overlays.at(-1)?.icons ?? pageIcons
  SystemBars.setStyle({ style: icons === 'dark' ? SystemBarsStyle.Light : SystemBarsStyle.Dark }).catch(() => {})
}

/** For layouts: the icon colour that fits this layout's header. */
export function usePageStatusBar(icons: Icons) {
  onMounted(() => {
    pageIcons = icons
    apply()
  })
}

/** For full-screen panels: use these icons while the panel is open, then go back. */
export function useOverlayStatusBar(isOpen: () => boolean, icons: Icons) {
  let entry: { icons: Icons } | null = null

  function release() {
    if (!entry) return
    const i = overlays.indexOf(entry)
    if (i >= 0) overlays.splice(i, 1)
    entry = null
    apply()
  }

  watch(isOpen, (open) => {
    if (open && !entry) {
      entry = { icons }
      overlays.push(entry)
      apply()
    }
    else if (!open) {
      release()
    }
  }, { immediate: true })

  onBeforeUnmount(release)
}
