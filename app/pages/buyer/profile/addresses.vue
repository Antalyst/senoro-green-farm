<template>
  <PageContainer class="py-8 md:py-12">
    <div class="mx-auto max-w-4xl space-y-6">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <NuxtLink
            to="/buyer/profile"
            class="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition hover:text-farm-deep"
          >
            <Icon name="heroicons:chevron-left" class="h-3.5 w-3.5" />
            My account
          </NuxtLink>
          <h1 class="mt-2 text-2xl font-semibold tracking-tight text-farm-dark md:text-3xl">
            My Addresses
          </h1>
          <p class="mt-1 text-sm text-gray-500">Where should we deliver your orders?</p>
        </div>
        <button type="button" class="btn-primary self-start sm:self-auto" @click="openCreate">
          <Icon name="heroicons:plus" class="h-4 w-4" />
          Add new address
        </button>
      </header>

      <div
        v-if="showRequiredBanner"
        class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        <Icon name="heroicons:exclamation-triangle" class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
        <p>Add a delivery address before you can complete your purchase.</p>
      </div>

      <div
        v-if="notice"
        class="flex items-start gap-3 rounded-xl border border-farm-leaf/30 bg-farm-light px-4 py-3 text-sm text-farm-dark"
      >
        <Icon name="heroicons:information-circle" class="mt-0.5 h-5 w-5 flex-shrink-0 text-farm-leaf" />
        <p class="flex-1">{{ notice }}</p>
        <button type="button" class="text-gray-400 hover:text-gray-600" aria-label="Close" @click="notice = null">
          <Icon name="heroicons:x-mark" class="h-4 w-4" />
        </button>
      </div>

      <!-- Loading -->
      <div v-if="pending && !addresses.length" class="space-y-3">
        <div v-for="n in 2" :key="n" class="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
          <div class="h-4 w-48 rounded bg-gray-200" />
          <div class="mt-3 h-3 w-72 max-w-full rounded bg-gray-100" />
          <div class="mt-2 h-3 w-56 max-w-full rounded bg-gray-100" />
        </div>
      </div>

      <!-- Error -->
      <section v-else-if="fetchError" class="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        {{ fetchError }}
        <button type="button" class="mx-auto mt-3 block font-semibold underline" @click="refresh()">
          Try again
        </button>
      </section>

      <!-- Empty -->
      <section v-else-if="!addresses.length" class="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-farm-light text-farm-deep">
          <Icon name="heroicons:map-pin" class="h-7 w-7" />
        </span>
        <p class="mt-4 text-base font-semibold text-farm-dark">No addresses yet</p>
        <p class="mt-1 text-sm text-gray-500">Add your delivery address and pin it on the map so riders can find you.</p>
        <button type="button" class="btn-primary mx-auto mt-5" @click="openCreate">
          <Icon name="heroicons:plus" class="h-4 w-4" />
          Add your first address
        </button>
      </section>

      <!-- List -->
      <ul v-else class="space-y-3">
        <li
          v-for="addr in addresses"
          :key="addr.id"
          class="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          :class="addr.is_default ? 'border-market-orange/40' : 'border-gray-200'"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p class="font-semibold text-farm-dark">{{ addr.full_name }}</p>
                <span class="h-4 w-px bg-gray-300" />
                <p class="text-sm text-gray-500 tabular-nums">{{ addr.phone_number }}</p>
              </div>
              <p class="mt-2 text-sm leading-relaxed text-gray-700">{{ addr.detailed_address }}</p>
              <p class="text-sm text-gray-500">Brgy. {{ addr.barangay }}, {{ addr.city }}</p>

              <div class="mt-3 flex flex-wrap gap-2">
                <span
                  v-if="addr.is_default"
                  class="rounded border border-market-orange px-2 py-0.5 text-[11px] font-semibold text-market-orange"
                >
                  Default
                </span>
                <span
                  v-if="hasCoordinates(addr)"
                  class="inline-flex items-center gap-1 rounded bg-farm-light px-2 py-0.5 text-[11px] font-semibold text-farm-deep"
                >
                  <Icon name="heroicons:map-pin-solid" class="h-3 w-3" />
                  Pinned on map
                </span>
                <button
                  v-else
                  type="button"
                  class="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500 transition hover:bg-amber-50 hover:text-amber-700"
                  @click="openEdit(addr)"
                >
                  <Icon name="heroicons:map-pin" class="h-3 w-3" />
                  No map pin · Add pin
                </button>
              </div>
            </div>

            <div class="flex flex-shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end">
              <div class="flex items-center gap-4 text-sm font-medium">
                <button type="button" class="text-farm-deep hover:underline" @click="openEdit(addr)">Edit</button>
                <button
                  type="button"
                  class="text-gray-500 hover:text-red-600"
                  :disabled="busyId === addr.id"
                  @click="removeAddress(addr.id)"
                >
                  Delete
                </button>
              </div>
              <button
                type="button"
                class="rounded-lg border px-3 py-1.5 text-xs font-medium transition"
                :class="addr.is_default
                  ? 'cursor-default border-gray-200 text-gray-300'
                  : 'border-gray-300 text-gray-700 hover:border-farm-deep hover:text-farm-deep'"
                :disabled="addr.is_default || busyId === addr.id"
                @click="setDefault(addr.id)"
              >
                Set as default
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Address form: bottom sheet on phones, dialog on desktop -->
    <!-- Teleported to <body> so the layout's sticky header and bottom nav cannot cover it -->
    <ClientOnly>
      <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showModal" class="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4">
          <div class="absolute inset-0 bg-black/50" @click="closeModal" />
          <form
            class="sheet-panel relative z-10 flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl"
            @submit.prevent="saveAddress"
          >
            <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 class="text-lg font-semibold text-farm-dark">{{ editingId ? 'Edit address' : 'New address' }}</h2>
              <button
                type="button"
                class="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
                @click="closeModal"
              >
                <Icon name="heroicons:x-mark" class="h-5 w-5" />
              </button>
            </div>

            <div class="flex-1 space-y-7 overflow-y-auto px-5 py-5">
              <!-- Contact -->
              <section class="space-y-3">
                <h3 class="section-title">Contact</h3>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label class="field">
                    <span class="field-label">Full name</span>
                    <input v-model="form.full_name" required autocomplete="name" class="field-input" placeholder="Juan Dela Cruz">
                  </label>
                  <label class="field">
                    <span class="field-label">Phone number</span>
                    <input
                      v-model="form.phone_number"
                      required
                      type="tel"
                      inputmode="tel"
                      autocomplete="tel"
                      pattern="(\+63|0)9\d{9}"
                      title="Use a PH mobile number, e.g. 09171234567 or +639171234567"
                      class="field-input"
                      placeholder="09XX XXX XXXX"
                    >
                  </label>
                </div>
              </section>

              <!-- Address -->
              <section class="space-y-3">
                <h3 class="section-title">Address</h3>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label class="field">
                    <span class="field-label">City / Municipality</span>
                    <select
                      v-model="form.city"
                      required
                      class="field-input"
                      :disabled="citiesLoading"
                      @change="onCityChange"
                    >
                      <option value="" disabled>{{ citiesLoading ? 'Loading cities…' : 'Select city' }}</option>
                      <option v-for="city in cityOptions" :key="city" :value="city">{{ city }}</option>
                    </select>
                  </label>
                  <label class="field">
                    <span class="field-label">Barangay</span>
                    <select
                      v-model="form.barangay"
                      required
                      class="field-input"
                      :disabled="!form.city || barangaysLoading"
                    >
                      <option value="" disabled>{{ barangaysLoading ? 'Loading barangays…' : 'Select barangay' }}</option>
                      <option v-for="brgy in barangays" :key="brgy" :value="brgy">{{ brgy }}</option>
                    </select>
                  </label>
                </div>
                <p v-if="locationError" class="text-xs text-red-600">
                  {{ locationError }}
                  <button type="button" class="ml-1 font-semibold underline" @click="retryLocations">Retry</button>
                </p>
                <label class="field">
                  <span class="field-label">Street name, building, house no.</span>
                  <textarea
                    v-model="form.detailed_address"
                    required
                    rows="2"
                    class="field-input resize-none"
                    placeholder="e.g. 123 Gonzaga St., blue gate near the chapel"
                  />
                </label>
              </section>

              <!-- Map pin -->
              <section class="space-y-3">
                <div>
                  <h3 class="section-title">Pin your location</h3>
                  <p class="mt-1 text-xs text-gray-500">
                    Drag the map until the pin is on your door. Riders use this pin to find you.
                  </p>
                </div>
                <AddressLocationPicker v-model="pin" @resolved="onPinResolved" />
                <p v-if="pinNotice" class="flex items-start gap-1.5 text-xs text-amber-700">
                  <Icon name="heroicons:exclamation-triangle" class="mt-px h-4 w-4 flex-shrink-0" />
                  {{ pinNotice }}
                </p>
                <p v-else-if="autoFilled" class="flex items-start gap-1.5 text-xs text-farm-leaf">
                  <Icon name="heroicons:sparkles" class="mt-px h-4 w-4 flex-shrink-0" />
                  City and barangay were filled from your pin. Please check they are correct.
                </p>
              </section>

              <!-- Default switch -->
              <label class="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3">
                <span>
                  <span class="block text-sm font-medium text-farm-dark">Set as default address</span>
                  <span class="block text-xs text-gray-500">Used automatically at checkout</span>
                </span>
                <span class="relative inline-flex flex-shrink-0 items-center">
                  <input v-model="form.is_default" type="checkbox" class="peer sr-only">
                  <span class="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-farm-deep peer-focus-visible:ring-2 peer-focus-visible:ring-farm-deep/30" />
                  <span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                </span>
              </label>
            </div>

            <div class="flex flex-col-reverse gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
              <p v-if="formError" class="text-xs text-red-600 sm:mr-auto">{{ formError }}</p>
              <button type="button" class="btn-ghost" @click="closeModal">Cancel</button>
              <button type="submit" :disabled="saving" class="btn-primary justify-center">
                <Icon v-if="saving" name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
                {{ saving ? 'Saving…' : 'Save address' }}
              </button>
            </div>
          </form>
        </div>
      </Transition>
      </Teleport>
    </ClientOnly>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '~/components/ui/PageContainer.vue'
import type { PinLocation, ResolvedPlace } from '~/components/address/LocationPicker.vue'

definePageMeta({ layout: 'buyer' })

interface Place {
  code: string
  name: string
}

interface AddressRow {
  id: string
  full_name: string
  phone_number: string
  city: string
  barangay: string
  detailed_address: string
  is_default: boolean
  latitude?: number | null
  longitude?: number | null
}

const route = useRoute()
const api = useApiFetch()

// ?redirect=/buyer/checkout?... (only buyer pages, never an outside link)
const returnTo = computed(() => {
  const r = route.query.redirect
  const path = Array.isArray(r) ? r[0] : r
  return typeof path === 'string' && path.startsWith('/buyer/') ? path : null
})

const fetchError = ref<string | null>(null)

const { data, pending, refresh } = await useAsyncData(
  'buyer:addresses',
  async () => {
    fetchError.value = null
    try {
      return await api<{ addresses: AddressRow[] }>('/api/buyer/addresses')
    }
    catch (err: unknown) {
      const e = err as { data?: { statusMessage?: string } }
      fetchError.value = e.data?.statusMessage ?? 'Failed to load addresses'
      return { addresses: [] as AddressRow[] }
    }
  },
  { server: false },
)

const addresses = computed(() => data.value?.addresses ?? [])

const showRequiredBanner = computed(() => route.query.required === '1')

const showModal = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const busyId = ref<string | null>(null)
const formError = ref<string | null>(null)
const notice = ref<string | null>(null)

const DEFAULT_CITY = 'Bago City'

const form = ref({
  full_name: '',
  phone_number: '',
  city: '',
  barangay: '',
  detailed_address: '',
  is_default: false,
})

const pin = ref<PinLocation | null>(null)
const pinNotice = ref<string | null>(null)
const autoFilled = ref(false)

function hasCoordinates(addr: AddressRow) {
  return addr.latitude != null && addr.longitude != null
}

// City and barangay lists come from the PSGC API (proxied by /api/locations).
const cities = ref<Place[]>([])
const barangays = ref<string[]>([])
const citiesLoading = ref(false)
const barangaysLoading = ref(false)
const locationError = ref<string | null>(null)

// Keep an old saved city selectable even if it is outside the API list.
const cityOptions = computed(() => {
  const names = cities.value.map(c => c.name)
  if (form.value.city && !names.includes(form.value.city)) names.unshift(form.value.city)
  return names
})

async function loadCities() {
  if (cities.value.length) return
  citiesLoading.value = true
  locationError.value = null
  try {
    const res = await api<{ cities: Place[] }>('/api/locations/cities')
    cities.value = res.cities ?? []
  }
  catch {
    locationError.value = 'Could not load cities. Check your connection.'
  }
  finally {
    citiesLoading.value = false
  }
}

async function loadBarangays(cityName: string, keepBarangay = '') {
  barangays.value = []
  const city = cities.value.find(c => c.name === cityName)
  if (!city) {
    // Unknown city (old data): keep the saved barangay as the only choice.
    barangays.value = keepBarangay ? [keepBarangay] : []
    form.value.barangay = keepBarangay
    return
  }

  barangaysLoading.value = true
  locationError.value = null
  try {
    const res = await api<{ barangays: Place[] }>(`/api/locations/barangays/${city.code}`)
    if (form.value.city !== cityName) return // user picked another city meanwhile
    barangays.value = (res.barangays ?? []).map(b => b.name)
    form.value.barangay = barangays.value.includes(keepBarangay) ? keepBarangay : ''
  }
  catch {
    locationError.value = 'Could not load barangays. Check your connection.'
  }
  finally {
    barangaysLoading.value = false
  }
}

async function retryLocations() {
  await loadCities()
  if (form.value.city) await loadBarangays(form.value.city, form.value.barangay)
}

function onCityChange() {
  form.value.barangay = ''
  autoFilled.value = false
  loadBarangays(form.value.city)
}

// "City of Bago", "Bago City" and "Bago" all compare equal; same for "Barangay 6 (Pob.)" and "Barangay 6".
function normalizePlace(name: string) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .trim()
    .replace(/^city of\s+/, '')
    .replace(/\s+city$/, '')
    .replace(/^(barangay|brgy\.?)\s+/, '')
    .replace(/[^a-z0-9]/g, '')
}

// Fill city/barangay/street from the pin, like Shopee does.
async function onPinResolved(place: ResolvedPlace) {
  pinNotice.value = null
  if (!place.inPhilippines) return

  await loadCities()
  const city = cities.value.find(c => normalizePlace(c.name) === normalizePlace(place.city))
  if (!city) {
    pinNotice.value = `This pin is in ${place.city || 'an area'} outside our delivery area (Negros Occidental).`
    return
  }

  if (form.value.city !== city.name) {
    form.value.city = city.name
    await loadBarangays(city.name)
  }

  const candidates = place.barangayCandidates.map(normalizePlace)
  const match = barangays.value.find(b => candidates.includes(normalizePlace(b)))
  if (match) form.value.barangay = match

  if (!form.value.detailed_address.trim() && place.road) {
    form.value.detailed_address = place.road
  }
  autoFilled.value = true
}

function resetPinState() {
  pinNotice.value = null
  autoFilled.value = false
  formError.value = null
}

async function openCreate() {
  editingId.value = null
  form.value = {
    full_name: '',
    phone_number: '',
    city: '',
    barangay: '',
    detailed_address: '',
    is_default: addresses.value.length === 0,
  }
  pin.value = null
  barangays.value = []
  resetPinState()
  showModal.value = true

  await loadCities()
  if (!form.value.city && cities.value.some(c => c.name === DEFAULT_CITY)) {
    form.value.city = DEFAULT_CITY
    await loadBarangays(DEFAULT_CITY)
  }
}

async function openEdit(addr: AddressRow) {
  editingId.value = addr.id
  form.value = {
    full_name: addr.full_name,
    phone_number: addr.phone_number,
    city: addr.city,
    barangay: addr.barangay,
    detailed_address: addr.detailed_address,
    is_default: addr.is_default,
  }
  pin.value = hasCoordinates(addr)
    ? { latitude: Number(addr.latitude), longitude: Number(addr.longitude) }
    : null
  barangays.value = [addr.barangay]
  resetPinState()
  showModal.value = true

  await loadCities()
  await loadBarangays(addr.city, addr.barangay)
}

function closeModal() {
  showModal.value = false
}

async function saveAddress() {
  saving.value = true
  formError.value = null
  const body = {
    ...form.value,
    latitude: pin.value?.latitude ?? null,
    longitude: pin.value?.longitude ?? null,
  }
  try {
    const res = editingId.value
      ? await api<{ coordinates_saved?: boolean }>(`/api/buyer/addresses/${editingId.value}`, { method: 'PUT', body })
      : await api<{ coordinates_saved?: boolean }>('/api/buyer/addresses', { method: 'POST', body })

    notice.value = pin.value && res.coordinates_saved === false
      ? 'Address saved, but the map pin was not saved because the database is not updated yet (migration 009).'
      : null
    const wasNew = !editingId.value
    closeModal()
    await refresh()
    // Came from checkout's "Add address": go back there with the new address.
    if (wasNew && returnTo.value) await navigateTo(returnTo.value)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    formError.value = e.data?.statusMessage || 'Failed to save address. Please try again.'
  }
  finally {
    saving.value = false
  }
}

async function setDefault(id: string) {
  busyId.value = id
  try {
    await api(`/api/buyer/addresses/${id}/default`, { method: 'PUT' })
    await refresh()
  }
  finally {
    busyId.value = null
  }
}

async function removeAddress(id: string) {
  if (!confirm('Delete this address?')) return
  busyId.value = id
  try {
    await api(`/api/buyer/addresses/${id}`, { method: 'DELETE' })
    await refresh()
  }
  finally {
    busyId.value = null
  }
}

// Lock page scroll and allow Esc to close while the form is open.
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showModal.value) closeModal()
}

watch(showModal, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  refresh()
  // Opened from checkout to add an address: show the form right away.
  if (returnTo.value) openCreate()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

useHead({ title: 'My Addresses — NFWM' })
</script>

<style scoped>
.section-title {
  @apply text-xs font-semibold uppercase tracking-wider text-gray-400;
}

.field {
  @apply block space-y-1.5;
}

.field-label {
  @apply block text-xs font-medium text-gray-600;
}

.field-input {
  @apply block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-farm-dark outline-none transition placeholder:text-gray-400 focus:border-farm-deep focus:ring-2 focus:ring-farm-deep/15 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400;
}

.btn-primary {
  @apply inline-flex items-center gap-2 rounded-lg bg-farm-deep px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-farm-leaf disabled:cursor-not-allowed disabled:opacity-60;
}

.btn-ghost {
  @apply rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-enter-active .sheet-panel,
.sheet-leave-active .sheet-panel {
  transition: transform 0.25s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel {
  transform: translateY(24px);
}
</style>
