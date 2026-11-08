<template>
  <div class="mx-auto w-full max-w-2xl py-6 md:py-8">
    <form class="space-y-5 md:space-y-6" @submit.prevent="saveProfile">
      <!-- Banner + photo -->
      <section class="ui-card overflow-hidden">
        <div class="relative h-32 bg-shop-cream md:h-40">
          <img v-if="form.shop_banner_url" :src="form.shop_banner_url" alt="Shop banner" class="h-full w-full object-cover">
          <p v-else class="flex h-full items-center justify-center text-sm text-gray-400">No banner yet</p>
          <p v-if="uploadingBanner" class="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-gray-600">Uploading…</p>
        </div>

        <div class="flex items-center gap-4 p-4 md:p-5">
          <div class="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-shop-mint">
            <img v-if="form.shop_avatar_url" :src="form.shop_avatar_url" alt="Shop photo" class="h-full w-full object-cover">
            <span v-else class="flex h-full w-full items-center justify-center text-lg font-semibold uppercase text-farm-deep">{{ fallbackInitials }}</span>
            <span v-if="uploadingAvatar" class="absolute inset-0 flex items-center justify-center bg-white/80 text-[10px] text-gray-600">…</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="ui-btn-outline" :disabled="uploadingAvatar" @click="triggerFileInput('avatar')">
              {{ form.shop_avatar_url ? 'Change photo' : 'Add photo' }}
            </button>
            <button type="button" class="ui-btn-outline" :disabled="uploadingBanner" @click="triggerFileInput('banner')">
              {{ form.shop_banner_url ? 'Change banner' : 'Add banner' }}
            </button>
          </div>
        </div>
        <p class="-mt-2 px-4 pb-4 text-xs text-gray-400 md:px-5">Banner works best at 1200 × 400 pixels.</p>
      </section>

      <!-- Details -->
      <section class="ui-card space-y-4 p-4 md:p-5">
        <h2 class="text-base font-semibold text-farm-deep">Details</h2>
        <div>
          <label for="shop-name" class="ui-label">Shop name</label>
          <input id="shop-name" v-model="form.shop_name" type="text" required placeholder="Your shop name" class="ui-input">
        </div>
        <div>
          <label for="owner" class="ui-label">Registered owner</label>
          <input id="owner" v-model="form.full_name" type="text" disabled class="ui-input cursor-not-allowed bg-gray-50 text-gray-500">
        </div>
      </section>

      <div class="flex justify-end">
        <button type="submit" class="ui-btn-accent w-full sm:w-auto" :disabled="saving || uploadingAvatar || uploadingBanner">
          {{ saving ? 'Saving…' : 'Save shop details' }}
        </button>
      </div>
    </form>

    <!-- Pickup location: saved on its own and locked until the seller taps Edit -->
    <section class="ui-card mt-5 space-y-4 p-4 md:mt-6 md:p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-farm-deep">Pickup location</h2>
          <p class="mt-0.5 text-xs text-gray-400">
            Pin where riders collect orders. Riders only see it when your shop has an order to pick up.
          </p>
        </div>
        <button
          v-if="locationSupported && !editingLocation"
          type="button"
          class="ui-btn-outline flex-shrink-0"
          @click="editingLocation = true"
        >
          Edit pin
        </button>
      </div>

      <p v-if="!locationSupported" class="rounded bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
        Shop location is not available yet. The database needs an update (migration 010). Your other settings still save normally.
      </p>

      <template v-else>
        <AddressLocationPicker v-model="pin" :locked="!editingLocation" @resolved="onPinResolved" />
        <div>
          <label for="shop-address" class="ui-label">Pickup address or landmark</label>
          <textarea
            id="shop-address"
            v-model="form.shop_address"
            rows="2"
            maxlength="300"
            :disabled="!editingLocation"
            placeholder="e.g. Stall 12, Bago Public Market, near the fish section"
            class="ui-input resize-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
          />
          <p class="mt-1.5 text-xs text-gray-400">Stall number, building or a nearby landmark helps riders find you.</p>
        </div>

        <div v-if="editingLocation" class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            v-if="savedLocation.pin"
            type="button"
            class="ui-btn-outline w-full sm:w-auto"
            :disabled="savingLocation"
            @click="cancelLocationEdit"
          >
            Cancel
          </button>
          <button
            type="button"
            class="ui-btn-accent w-full sm:w-auto"
            :disabled="savingLocation || !pin"
            @click="saveLocation"
          >
            {{ savingLocation ? 'Saving…' : 'Save location' }}
          </button>
        </div>
      </template>
    </section>

    <!-- Payment account: lets buyers pay this shop online (GCash / Maya / bank QR) -->
    <section class="ui-card mt-5 space-y-4 p-4 md:mt-6 md:p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-farm-deep">Payment account</h2>
          <p class="mt-0.5 text-xs text-gray-400">
            With an account, buyers can pay you online and send the receipt in chat. Without one, your shop takes cash on delivery only.
          </p>
        </div>
        <span
          class="flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          :class="payoutSaved ? 'bg-farm-light text-farm-deep' : 'bg-gray-100 text-gray-600'"
        >
          {{ payoutSaved ? 'Online payment on' : 'COD only' }}
        </span>
      </div>

      <p v-if="!payoutSupported" class="rounded bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
        Online payment is not available yet. The database needs an update (migration 017).
      </p>

      <form v-else class="space-y-4" @submit.prevent="savePayout">
        <div>
          <p class="ui-label">Type</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="option in payoutOptions"
              :key="option.value"
              type="button"
              class="rounded-lg border px-2 py-2.5 text-sm font-semibold"
              :class="payout.payout_method === option.value ? 'border-farm-leaf bg-farm-light text-farm-deep' : 'border-gray-200 text-gray-600'"
              @click="payout.payout_method = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <template v-if="payout.payout_method">
          <div v-if="payout.payout_method === 'bank'">
            <label for="payout-bank" class="ui-label">Bank name</label>
            <input id="payout-bank" v-model="payout.payout_bank_name" type="text" maxlength="60" placeholder="e.g. BDO, BPI, Landbank" class="ui-input">
          </div>
          <div>
            <label for="payout-name" class="ui-label">Account name</label>
            <input id="payout-name" v-model="payout.payout_account_name" type="text" maxlength="60" placeholder="Name shown in the app, e.g. Juan D." class="ui-input">
            <p class="mt-1.5 text-xs text-gray-400">Buyers check this name after scanning, so it must match your account.</p>
          </div>
          <div>
            <label for="payout-number" class="ui-label">{{ payout.payout_method === 'bank' ? 'Account number' : 'Mobile number' }}</label>
            <input
              id="payout-number"
              v-model="payout.payout_account_number"
              type="text"
              inputmode="numeric"
              :maxlength="payout.payout_method === 'bank' ? 20 : 13"
              :placeholder="payout.payout_method === 'bank' ? '10 to 16 digits' : '09XXXXXXXXX'"
              class="ui-input font-mono"
            >
          </div>
          <div>
            <p class="ui-label">QR code {{ payout.payout_method === 'bank' ? '(optional)' : '' }}</p>
            <div class="flex items-center gap-3">
              <div class="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <img v-if="payout.payout_qr_url" :src="payout.payout_qr_url" alt="Payment QR code" class="h-full w-full object-contain">
                <Icon v-else name="heroicons:qr-code" class="h-8 w-8 text-gray-300" />
              </div>
              <div class="space-y-1.5">
                <button type="button" class="ui-btn-outline" :disabled="uploadingQr" @click="qrInput?.click()">
                  {{ uploadingQr ? 'Uploading…' : payout.payout_qr_url ? 'Change QR' : 'Upload QR' }}
                </button>
                <p class="text-xs text-gray-400">Screenshot of the QR from your {{ payoutLabel(payout.payout_method) }} app.</p>
              </div>
            </div>
          </div>

          <p v-if="payoutError" class="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{{ payoutError }}</p>

          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              v-if="payoutSaved"
              type="button"
              class="ui-btn-outline w-full text-red-600 sm:w-auto"
              :disabled="savingPayout"
              @click="removePayout"
            >
              Remove account
            </button>
            <button type="submit" class="ui-btn-accent w-full sm:w-auto" :disabled="savingPayout || uploadingQr">
              {{ savingPayout ? 'Saving…' : 'Save payment account' }}
            </button>
          </div>
        </template>
      </form>
    </section>

    <input ref="qrInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="uploadQr">
    <input ref="avatarInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="handleImageUpload($event, 'avatar')">
    <input ref="bannerInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="handleImageUpload($event, 'banner')">

    <BuyerToast :show="toast.show" :message="toast.message" :type="toast.type" @close="toast.show = false" />
  </div>
</template>

<script setup lang="ts">
import type { AuthUser } from '~/composables/useAuth'
import type { PinLocation, ResolvedPlace } from '~/components/address/LocationPicker.vue'

interface SellerProfile {
  shop_name?: string | null
  shop_avatar_url?: string | null
  shop_banner_url?: string | null
  full_name?: string | null
  shop_latitude?: number | null
  shop_longitude?: number | null
  shop_address?: string | null
}

interface PayoutForm {
  payout_method: 'gcash' | 'maya' | 'bank' | null
  payout_account_name: string
  payout_account_number: string
  payout_bank_name: string
  payout_qr_url: string
}

definePageMeta({ layout: 'seller' })

const userState = useState<AuthUser | null>('auth:user')
const api = useApiFetch()

const avatarInput = ref<HTMLInputElement | null>(null)
const bannerInput = ref<HTMLInputElement | null>(null)

const uploadingAvatar = ref(false)
const uploadingBanner = ref(false)
const saving = ref(false)

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

const form = ref({
  shop_name: '',
  shop_avatar_url: '',
  shop_banner_url: '',
  full_name: '',
  shop_address: '',
})

const pin = ref<PinLocation | null>(null)
const locationSupported = ref(true)
// Last saved pin/address, so Cancel can restore them. A saved pin starts locked.
const savedLocation = ref<{ pin: PinLocation | null; address: string }>({ pin: null, address: '' })
const editingLocation = ref(false)
const savingLocation = ref(false)

// Payment account (migration 017)
const payoutOptions = [
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
  { value: 'bank', label: 'Bank' },
] as const
const emptyPayout = (): PayoutForm => ({ payout_method: null, payout_account_name: '', payout_account_number: '', payout_bank_name: '', payout_qr_url: '' })
const payout = ref<PayoutForm>(emptyPayout())
const payoutSupported = ref(true)
const payoutSaved = ref(false)
const savingPayout = ref(false)
const uploadingQr = ref(false)
const payoutError = ref<string | null>(null)
const qrInput = ref<HTMLInputElement | null>(null)

function fillPayout(p: Partial<Record<keyof PayoutForm, string | null>> | null | undefined) {
  payout.value = {
    payout_method: (p?.payout_method as PayoutForm['payout_method']) ?? null,
    payout_account_name: p?.payout_account_name ?? '',
    payout_account_number: p?.payout_account_number ?? '',
    payout_bank_name: p?.payout_bank_name ?? '',
    payout_qr_url: p?.payout_qr_url ?? '',
  }
  payoutSaved.value = !!p?.payout_method
}

/** Same rules as the server (server/utils/payments.ts), so mistakes show before saving. */
function checkPayout(p: PayoutForm): string | null {
  const name = p.payout_account_name.trim()
  const number = p.payout_account_number.replace(/[\s-]/g, '')
  if (!p.payout_method) return 'Choose GCash, Maya or Bank.'
  if (name.length < 2) return 'Enter the account name.'
  if (p.payout_method === 'bank') {
    if (p.payout_bank_name.trim().length < 2) return 'Enter the bank name.'
    if (!/^\d{10,16}$/.test(number)) return 'Bank account number must be 10 to 16 digits.'
    return null
  }
  if (!/^09\d{9}$/.test(number)) return 'Mobile number must be 11 digits starting with 09.'
  if (!p.payout_qr_url) return 'Upload your QR code so buyers can scan it.'
  return null
}

async function uploadQr(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  uploadingQr.value = true
  payoutError.value = null
  try {
    const formData = new FormData()
    formData.append('image', file)
    const response = await api<{ url: string }>('/api/products/upload', { method: 'POST', body: formData })
    payout.value.payout_qr_url = response.url
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    payoutError.value = e.data?.statusMessage || 'Failed to upload the QR image.'
  }
  finally {
    uploadingQr.value = false
  }
}

async function savePayout() {
  payoutError.value = checkPayout(payout.value)
  if (payoutError.value) return
  savingPayout.value = true
  try {
    const res = await api<{ payout: PayoutForm }>('/api/seller/profile/payout', { method: 'PUT', body: payout.value })
    fillPayout(res.payout)
    triggerToast('Payment account saved. Buyers can now pay you online.')
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    payoutError.value = e.data?.statusMessage || 'Failed to save payment account.'
  }
  finally {
    savingPayout.value = false
  }
}

async function removePayout() {
  savingPayout.value = true
  payoutError.value = null
  try {
    await api('/api/seller/profile/payout', { method: 'PUT', body: { payout_method: null } })
    fillPayout(null)
    triggerToast('Payment account removed. Your shop now takes cash on delivery only.')
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    payoutError.value = e.data?.statusMessage || 'Failed to remove payment account.'
  }
  finally {
    savingPayout.value = false
  }
}

const fallbackInitials = computed(() => {
  const name = form.value.shop_name || form.value.full_name || 'Shop'
  return name.substring(0, 2)
})

// Load the saved profile from the server. The login token does not carry avatar/banner,
// so filling the form from it alone would save blanks over the real images.
onMounted(async () => {
  if (userState.value) {
    form.value.shop_name = userState.value.shop_name || ''
    form.value.full_name = userState.value.full_name || ''
  }
  try {
    const res = await api<{ seller: SellerProfile; location_supported?: boolean; payout?: any; payout_supported?: boolean }>('/api/seller/profile')
    const s = res.seller
    form.value.shop_name = s.shop_name || form.value.shop_name
    form.value.full_name = s.full_name || form.value.full_name
    form.value.shop_avatar_url = s.shop_avatar_url || ''
    form.value.shop_banner_url = s.shop_banner_url || ''
    form.value.shop_address = s.shop_address || ''
    pin.value = s.shop_latitude != null && s.shop_longitude != null
      ? { latitude: Number(s.shop_latitude), longitude: Number(s.shop_longitude) }
      : null
    locationSupported.value = res.location_supported !== false
    savedLocation.value = { pin: pin.value, address: form.value.shop_address }
    editingLocation.value = !pin.value
    payoutSupported.value = res.payout_supported !== false
    fillPayout(res.payout)
  }
  catch {
    triggerToast('Could not load your shop profile. Refresh the page before saving.', 'error')
  }
})

// Suggest a pickup address from the pin when the field is empty.
function onPinResolved(place: ResolvedPlace) {
  if (form.value.shop_address.trim()) return
  const parts = [place.road, place.barangayCandidates[0], place.city].filter(Boolean)
  form.value.shop_address = [...new Set(parts)].join(', ')
}

function triggerFileInput(type: 'avatar' | 'banner') {
  if (type === 'avatar') avatarInput.value?.click()
  if (type === 'banner') bannerInput.value?.click()
}

async function handleImageUpload(event: Event, type: 'avatar' | 'banner') {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (type === 'avatar') uploadingAvatar.value = true
  if (type === 'banner') uploadingBanner.value = true

  try {
    const formData = new FormData()
    formData.append('image', file)

    // Route through the secure backend endpoint to use the configured IMGBB_API_KEY in .env
    const response = await api<{ url: string }>('/api/products/upload', {
      method: 'POST',
      body: formData,
    })

    if (response?.url) {
      if (type === 'avatar') form.value.shop_avatar_url = response.url
      if (type === 'banner') form.value.shop_banner_url = response.url
      triggerToast(`${type === 'avatar' ? 'Photo' : 'Banner'} uploaded. Press Save changes to keep it.`)
    }
    else {
      throw new Error('Upload failed')
    }
  }
  catch (error) {
    console.error('ImgBB Upload Error:', error)
    triggerToast(`Failed to upload ${type === 'avatar' ? 'photo' : 'banner'}.`, 'error')
  }
  finally {
    if (type === 'avatar') uploadingAvatar.value = false
    if (type === 'banner') uploadingBanner.value = false
    input.value = '' // Reset input
  }
}

async function saveProfile() {
  saving.value = true
  try {
    await api('/api/seller/profile/media', {
      method: 'PUT',
      body: {
        shop_name: form.value.shop_name,
        shop_avatar_url: form.value.shop_avatar_url,
        shop_banner_url: form.value.shop_banner_url,
      },
    })

    // Instantly update global user state
    if (userState.value) {
      userState.value.shop_name = form.value.shop_name
      userState.value.shop_avatar_url = form.value.shop_avatar_url
      userState.value.shop_banner_url = form.value.shop_banner_url
    }

    triggerToast('Shop details saved.')
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Failed to save profile', 'error')
  }
  finally {
    saving.value = false
  }
}

async function saveLocation() {
  if (!pin.value) return
  savingLocation.value = true
  try {
    const res = await api<{ location: SellerProfile }>('/api/seller/profile/location', {
      method: 'PUT',
      body: {
        latitude: pin.value.latitude,
        longitude: pin.value.longitude,
        shop_address: form.value.shop_address,
      },
    })
    const loc = res.location
    pin.value = { latitude: Number(loc.shop_latitude), longitude: Number(loc.shop_longitude) }
    form.value.shop_address = loc.shop_address || ''
    savedLocation.value = { pin: pin.value, address: form.value.shop_address }
    editingLocation.value = false
    triggerToast('Pickup location saved.')
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Failed to save pickup location', 'error')
  }
  finally {
    savingLocation.value = false
  }
}

function cancelLocationEdit() {
  pin.value = savedLocation.value.pin
  form.value.shop_address = savedLocation.value.address
  editingLocation.value = false
}

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 4000)
}

useHead({ title: 'Shop Settings — Farmers to Market Seller' })
</script>
