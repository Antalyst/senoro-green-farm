<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[1000] flex flex-col"
        :class="manualOnly ? 'bg-white text-shop-ink' : 'bg-black text-white'"
      >
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full"
            :class="manualOnly ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'"
            aria-label="Close"
            @click="$emit('close')"
          >
            <Icon name="heroicons:x-mark" class="h-6 w-6" />
          </button>
          <div class="min-w-0">
            <p class="truncate text-base font-semibold">{{ title }}</p>
            <p class="truncate text-xs" :class="manualOnly ? 'text-gray-500' : 'text-white/60'">{{ subtitle }}</p>
          </div>
        </div>

        <!-- Code only (no camera): for damaged receipts or a broken camera -->
        <form
          v-if="manualOnly"
          class="flex flex-1 flex-col items-center justify-center px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          @submit.prevent="submitManual"
        >
          <span class="flex h-16 w-16 items-center justify-center rounded-full bg-shop-mint text-farm-leaf">
            <Icon name="heroicons:key" class="h-8 w-8" />
          </span>
          <p class="mt-4 max-w-xs text-center text-sm text-gray-500">{{ hint }}</p>
          <input
            ref="codeInput"
            :value="manualCode"
            type="text"
            inputmode="text"
            autocapitalize="characters"
            autocomplete="off"
            spellcheck="false"
            maxlength="9"
            placeholder="ABCD-2345"
            aria-label="8-character code"
            class="mt-6 w-full max-w-xs rounded-2xl border-2 border-gray-200 px-4 py-4 text-center font-mono text-3xl font-bold uppercase tracking-[0.2em] outline-none placeholder:text-gray-300 focus:border-farm-leaf"
            @input="onCodeInput"
          >
          <p
            v-if="error"
            role="alert"
            class="mt-4 flex w-full max-w-xs items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            <Icon name="heroicons:exclamation-circle" class="mt-0.5 h-5 w-5 flex-shrink-0" />
            {{ error }}
          </p>
          <button
            type="submit"
            class="mt-6 flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-farm-leaf text-base font-semibold text-white shadow-sm disabled:opacity-40"
            :disabled="busy || codeLength !== 8"
          >
            <Icon :name="busy ? 'heroicons:arrow-path' : 'heroicons:check-circle'" class="h-5 w-5" :class="busy ? 'animate-spin' : ''" />
            {{ busy ? 'Checking…' : 'Confirm code' }}
          </button>
        </form>

        <!-- Camera -->
        <div v-if="!manualOnly" class="relative flex-1 overflow-hidden">
          <video ref="videoEl" class="absolute inset-0 h-full w-full object-cover" playsinline muted />

          <!-- Frame -->
          <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div class="relative h-64 w-64 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
              <span class="corner left-0 top-0 rounded-tl-3xl border-l-4 border-t-4" />
              <span class="corner right-0 top-0 rounded-tr-3xl border-r-4 border-t-4" />
              <span class="corner bottom-0 left-0 rounded-bl-3xl border-b-4 border-l-4" />
              <span class="corner bottom-0 right-0 rounded-br-3xl border-b-4 border-r-4" />
              <span v-if="!busy && !cameraError" class="scan-line" />
            </div>
          </div>

          <div v-if="busy" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
            <Icon name="heroicons:arrow-path" class="h-8 w-8 animate-spin" />
            <p class="text-sm">Checking code…</p>
          </div>

          <div v-if="cameraError" class="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <Icon name="heroicons:video-camera-slash" class="h-10 w-10 text-white/60" />
            <p class="mt-3 text-sm text-white/80">{{ cameraError }}</p>
            <p class="mt-1 text-xs text-white/50">You can type the code below instead.</p>
          </div>
        </div>

        <!-- Result / manual entry -->
        <div v-if="!manualOnly" class="space-y-3 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-shop-ink">
          <p
            v-if="error"
            role="alert"
            class="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            <Icon name="heroicons:exclamation-circle" class="mt-0.5 h-5 w-5 flex-shrink-0" />
            {{ error }}
          </p>
          <p v-else class="text-center text-sm text-gray-500">{{ hint }}</p>

          <form class="flex gap-2" @submit.prevent="submitManual">
            <input
              :value="manualCode"
              type="text"
              inputmode="text"
              autocapitalize="characters"
              autocomplete="off"
              maxlength="9"
              placeholder="Or type code: ABCD-2345"
              class="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm uppercase tracking-widest outline-none placeholder:normal-case placeholder:tracking-normal focus:border-farm-leaf focus:ring-2 focus:ring-farm-leaf/20"
              @input="onCodeInput"
            >
            <button
              type="submit"
              class="rounded-xl bg-farm-leaf px-5 text-sm font-semibold text-white disabled:opacity-50"
              :disabled="busy || codeLength !== 8"
            >
              Confirm
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type QrScanner from 'qr-scanner'

const props = defineProps<{
  open: boolean
  title: string
  subtitle?: string
  hint: string
  busy?: boolean
  error?: string | null
  /** Type the code only (no camera) — for a damaged receipt or a broken camera. */
  manualOnly?: boolean
}>()

const emit = defineEmits<{
  close: []
  detected: [text: string]
  manual: [code: string]
}>()

const videoEl = ref<HTMLVideoElement | null>(null)
const cameraError = ref<string | null>(null)
const manualCode = ref('')
let scanner: QrScanner | null = null
let lastText = ''
let lastAt = 0

async function start() {
  cameraError.value = null
  manualCode.value = ''
  await nextTick()
  if (!videoEl.value) return
  try {
    const { default: QrScannerLib } = await import('qr-scanner')
    scanner = new QrScannerLib(
      videoEl.value,
      (result) => {
        // Ignore the same code repeating while the camera keeps seeing it.
        const now = Date.now()
        if (props.busy || (result.data === lastText && now - lastAt < 2500)) return
        lastText = result.data
        lastAt = now
        emit('detected', result.data)
      },
      { preferredCamera: 'environment', returnDetailedScanResult: true, maxScansPerSecond: 5 },
    )
    await scanner.start()
  }
  catch (err) {
    const name = (err as { name?: string })?.name ?? String(err)
    cameraError.value = /NotAllowed|Permission/i.test(name)
      ? 'Camera access is blocked. Allow the camera for this app in your phone settings.'
      : 'Could not open the camera on this device.'
  }
}

function stop() {
  scanner?.stop()
  scanner?.destroy()
  scanner = null
}

const codeInput = ref<HTMLInputElement | null>(null)
const codeLength = computed(() => manualCode.value.replace(/[^A-Z0-9]/g, '').length)

// Keep typed codes in the printed format: uppercase, "ABCD-2345".
function onCodeInput(e: Event) {
  const input = e.target as HTMLInputElement
  const clean = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  manualCode.value = clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean
  input.value = manualCode.value
}

function submitManual() {
  if (codeLength.value === 8) emit('manual', manualCode.value)
}

watch(() => props.open, async (isOpen) => {
  if (!isOpen) {
    stop()
    return
  }
  manualCode.value = ''
  if (props.manualOnly) {
    await nextTick()
    codeInput.value?.focus()
  }
  else {
    start()
  }
})

onBeforeUnmount(stop)
</script>

<style scoped>
.corner {
  @apply absolute h-10 w-10 border-white;
}
.scan-line {
  @apply absolute inset-x-4 h-0.5 rounded-full bg-farm-leaf shadow-[0_0_12px_2px_rgba(78,139,87,0.8)];
  animation: scan 2s ease-in-out infinite;
}
@keyframes scan {
  0%, 100% { top: 12%; }
  50% { top: 86%; }
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
