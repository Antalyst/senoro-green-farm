<template>
  <div class="space-y-3">
    <div class="relative isolate overflow-hidden rounded-xl border border-gray-200 bg-farm-light/60">
      <div ref="mapEl" class="h-64 w-full sm:h-72" />

      <!-- Loading state until Leaflet is ready -->
      <div
        v-if="!ready"
        class="absolute inset-0 z-[600] flex flex-col items-center justify-center gap-2 bg-farm-light/80 text-xs text-gray-500"
      >
        <Icon name="heroicons:map" class="h-7 w-7 animate-pulse text-farm-leaf" />
        Loading map…
      </div>

      <!-- Fixed center pin: the map moves under it -->
      <div class="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full">
        <div
          class="transition-transform duration-150 ease-out"
          :class="[moving ? '-translate-y-2.5' : '', hasPin ? '' : 'opacity-70']"
        >
          <svg width="38" height="48" viewBox="0 0 38 48" class="drop-shadow-lg" aria-hidden="true">
            <path
              d="M19 0C8.5 0 0 8.3 0 18.6 0 32.5 19 48 19 48s19-15.5 19-29.4C38 8.3 29.5 0 19 0z"
              fill="#E67E22"
            />
            <circle cx="19" cy="18.5" r="7.5" fill="#fff" />
            <circle cx="19" cy="18.5" r="3.5" fill="#2F5D3A" />
          </svg>
        </div>
      </div>
      <span
        class="pointer-events-none absolute left-1/2 top-1/2 z-[499] h-1.5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/35 transition-transform"
        :class="moving ? 'scale-75' : ''"
      />

      <div
        v-if="ready && locked"
        class="pointer-events-none absolute left-3 top-3 z-[500] inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-farm-deep shadow ring-1 ring-black/5"
      >
        <Icon name="heroicons:lock-closed" class="h-3.5 w-3.5" />
        Saved pin
      </div>

      <div
        v-if="ready && !hasPin && !locked"
        class="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2 whitespace-nowrap rounded-full bg-farm-dark/85 px-3 py-1.5 text-[11px] font-medium text-white shadow"
      >
        Move the map to place the pin
      </div>

      <button
        v-if="!locked"
        type="button"
        class="absolute bottom-7 right-3 z-[500] inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-farm-deep shadow-md ring-1 ring-black/5 transition hover:bg-farm-light disabled:opacity-60"
        :disabled="!ready || locating"
        @click="locateMe"
      >
        <Icon
          :name="locating ? 'heroicons:arrow-path' : 'heroicons:viewfinder-circle'"
          class="h-4 w-4"
          :class="locating ? 'animate-spin' : ''"
        />
        {{ locating ? 'Locating…' : 'Use my location' }}
      </button>
    </div>

    <!-- What the pin points to -->
    <div class="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-3">
      <span
        class="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
        :class="hasPin ? 'bg-market-orange/10 text-market-orange' : 'bg-gray-200 text-gray-500'"
      >
        <Icon name="heroicons:map-pin-solid" class="h-4 w-4" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-semibold text-farm-dark">{{ statusTitle }}</p>
        <p class="mt-0.5 text-xs leading-relaxed text-gray-500">{{ statusText }}</p>
        <p v-if="hasPin && resolved && !resolved.inPhilippines" class="mt-1 text-xs text-red-600">
          This pin is outside the Philippines.
        </p>
        <p v-if="hasPin && accuracy && accuracy > 100" class="mt-1 text-xs text-amber-700">
          Your GPS is not very accurate right now (±{{ accuracy }} m). Drag the map to fix the pin.
        </p>
      </div>
      <button
        v-if="hasPin && !locked"
        type="button"
        class="flex-shrink-0 text-[11px] font-medium text-gray-400 hover:text-red-600"
        @click="clearPin"
      >
        Remove
      </button>
    </div>

    <p v-if="error" class="flex items-start gap-1.5 text-xs text-red-600">
      <Icon name="heroicons:exclamation-circle" class="mt-px h-4 w-4 flex-shrink-0" />
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import type { Circle, CircleMarker, Map as LeafletMap } from 'leaflet'

export interface PinLocation {
  latitude: number
  longitude: number
}

export interface ResolvedPlace {
  label: string
  road: string
  city: string
  barangayCandidates: string[]
  postcode: string
  inPhilippines: boolean
}

// locked: show the pin but ignore drags/zooms so a saved pin can't move by accident.
const props = defineProps<{ modelValue: PinLocation | null; locked?: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: PinLocation | null]
  'resolved': [place: ResolvedPlace]
}>()

// Bacolod City, where the market is.
const DEFAULT_CENTER: [number, number] = [10.5378, 122.8356]

const api = useApiFetch()
const mapEl = ref<HTMLElement | null>(null)
const ready = ref(false)
const moving = ref(false)
const locating = ref(false)
const resolving = ref(false)
const resolved = ref<ResolvedPlace | null>(null)
const accuracy = ref<number | null>(null)
const error = ref<string | null>(null)

const hasPin = computed(() => !!props.modelValue)

const statusTitle = computed(() => {
  if (!hasPin.value) return 'No pin yet'
  if (resolving.value) return 'Finding address…'
  return 'Pinned location'
})

const statusText = computed(() => {
  if (!hasPin.value) return 'Move the map or tap "Use my location" so the rider can find your exact spot.'
  if (resolving.value) return 'Looking up the address for this pin.'
  if (resolved.value?.label) return resolved.value.label
  const p = props.modelValue!
  return `${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`
})

let L: typeof import('leaflet') | null = null
let map: LeafletMap | null = null
let accuracyCircle: Circle | null = null
let youAreHere: CircleMarker | null = null
let resolveTimer: ReturnType<typeof setTimeout> | undefined
let resolveSeq = 0
let flying = false
let syncing = false

watch(() => props.locked, (locked) => {
  if (!map) return
  if (locked) map.dragging.disable()
  else map.dragging.enable()
})

// Follow pins set from outside (saved pin loading after mount, or Cancel restoring it).
watch(() => props.modelValue, (pin) => {
  if (!map || !pin || flying) return
  const c = map.getCenter()
  if (Math.abs(c.lat - pin.latitude) < 1e-6 && Math.abs(c.lng - pin.longitude) < 1e-6) return
  syncing = true
  map.setView([pin.latitude, pin.longitude], Math.max(map.getZoom(), 17), { animate: false })
  resolveAddress(pin.latitude, pin.longitude, false)
})

onMounted(async () => {
  L = (await import('leaflet')).default
  if (!mapEl.value) return

  const start: [number, number] = props.modelValue
    ? [props.modelValue.latitude, props.modelValue.longitude]
    : DEFAULT_CENTER

  map = L.map(mapEl.value, {
    center: start,
    zoom: props.modelValue ? 17 : 14,
    zoomControl: false,
    // Zoom around the center so the pin stays on the same spot.
    scrollWheelZoom: 'center',
    doubleClickZoom: 'center',
    touchZoom: 'center',
  })
  L.control.zoom({ position: 'topright' }).addTo(map)
  map.attributionControl.setPrefix(false)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(map)

  if (props.locked) map.dragging.disable()

  map.on('dragstart zoomstart', () => { if (!props.locked) moving.value = true })
  map.on('dragend', () => { if (!props.locked) commitCenter() })
  // Only user zooms re-commit the pin (not map setup or the "my location" fly animation).
  map.on('zoomend', () => { if (ready.value && !flying && !syncing && !props.locked && hasPin.value) commitCenter() })
  map.on('moveend', () => {
    moving.value = false
    flying = false
    syncing = false
  })

  ready.value = true
  // The modal may still be animating; recalculate the map size after it settles.
  setTimeout(() => map?.invalidateSize(), 250)

  if (props.modelValue) resolveAddress(props.modelValue.latitude, props.modelValue.longitude, false)
})

onBeforeUnmount(() => {
  clearTimeout(resolveTimer)
  map?.remove()
  map = null
})

function commitCenter() {
  if (!map) return
  const c = map.getCenter()
  setPin(c.lat, c.lng)
}

function setPin(latitude: number, longitude: number) {
  emit('update:modelValue', { latitude, longitude })
  clearTimeout(resolveTimer)
  // Wait until the user stops moving the map (also respects Nominatim's rate limit).
  resolveTimer = setTimeout(() => resolveAddress(latitude, longitude, true), 700)
}

async function resolveAddress(lat: number, lng: number, notifyParent: boolean) {
  const seq = ++resolveSeq
  resolving.value = true
  try {
    const place = await api<ResolvedPlace>('/api/locations/reverse', { query: { lat, lng } })
    if (seq !== resolveSeq) return
    resolved.value = place
    if (notifyParent) emit('resolved', place)
  }
  catch {
    if (seq === resolveSeq) resolved.value = null
  }
  finally {
    if (seq === resolveSeq) resolving.value = false
  }
}

function locateMe() {
  error.value = null
  if (!navigator.geolocation) {
    error.value = 'This device does not support location. Move the map to set your pin.'
    return
  }

  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locating.value = false
      if (!map || !L) return
      const { latitude, longitude, accuracy: acc } = pos.coords
      accuracy.value = Math.round(acc)

      accuracyCircle?.remove()
      youAreHere?.remove()
      accuracyCircle = L.circle([latitude, longitude], {
        radius: acc,
        color: '#2F5D3A',
        weight: 1,
        fillColor: '#4E8B57',
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(map)
      youAreHere = L.circleMarker([latitude, longitude], {
        radius: 6,
        color: '#fff',
        weight: 2,
        fillColor: '#2563eb',
        fillOpacity: 1,
        interactive: false,
      }).addTo(map)

      flying = true
      map.flyTo([latitude, longitude], 18, { duration: 0.8 })
      setPin(latitude, longitude)
    },
    (err) => {
      locating.value = false
      if (err.code === err.PERMISSION_DENIED) {
        error.value = 'Location access is blocked. Allow location for this site in your browser or phone settings, or move the map to set your pin.'
      }
      else if (err.code === err.TIMEOUT) {
        error.value = 'Finding your location took too long. Try again outdoors, or move the map to set your pin.'
      }
      else {
        error.value = 'Could not get your location. Move the map to set your pin.'
      }
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  )
}

function clearPin() {
  clearTimeout(resolveTimer)
  resolveSeq++
  resolving.value = false
  resolved.value = null
  accuracy.value = null
  accuracyCircle?.remove()
  youAreHere?.remove()
  emit('update:modelValue', null)
}
</script>

<style scoped>
:deep(.leaflet-control-attribution) {
  font-size: 9px;
}
:deep(.leaflet-control-zoom) {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
</style>
