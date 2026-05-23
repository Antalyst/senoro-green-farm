<template>
  <PageContainer class="space-y-12 py-8 md:py-12">
    <header class="border-b border-farm-light pb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-2">
          Delivery profile
        </p>
        <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight">
          Saved addresses
        </h1>
        <p class="text-sm text-farm-dark/50 mt-2">Manage shipping destinations for checkout</p>
      </div>
      <button
        type="button"
        class="px-5 py-2.5 border border-farm-deep text-farm-deep text-xs font-medium tracking-[0.12em] uppercase hover:bg-farm-deep hover:text-white transition-colors"
        @click="openCreate"
      >
        Add address
      </button>
    </header>

    <div
      v-if="showRequiredBanner"
      class="border border-farm-yellow/50 bg-farm-yellow/10 px-4 py-3 text-sm text-farm-dark"
    >
      Shipping address required before you can complete a purchase. Add your delivery details below.
    </div>

    <section v-if="pending" class="p-12 text-center text-xs text-farm-dark/40">
      Loading addresses…
    </section>

    <section v-else-if="fetchError" class="border border-red-200 p-8 text-center text-sm text-red-600">
      {{ fetchError }}
      <button
        type="button"
        class="block mx-auto mt-4 text-xs uppercase tracking-wide text-farm-deep border-b border-farm-deep"
        @click="refresh()"
      >
        Retry
      </button>
    </section>

    <section v-else-if="!addresses.length" class="border border-farm-light p-12 text-center bg-white">
      <p class="text-sm font-medium text-farm-dark">No addresses yet</p>
      <p class="text-xs text-farm-dark/45 mt-1">Add a delivery address before checkout.</p>
      <button
        type="button"
        class="inline-block mt-4 px-5 py-2.5 bg-farm-deep text-white text-xs font-medium tracking-wide uppercase"
        @click="openCreate"
      >
        Add your first address
      </button>
    </section>

    <section v-else class="border border-farm-light divide-y divide-farm-light bg-white">
      <article
        v-for="addr in addresses"
        :key="addr.id"
        class="p-5 flex flex-col sm:flex-row sm:items-start gap-4"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <p class="text-sm font-medium text-farm-dark">{{ addr.full_name }}</p>
            <span
              v-if="addr.is_default"
              class="text-[10px] uppercase tracking-wider border border-farm-deep text-farm-deep px-2 py-0.5"
            >
              Default
            </span>
          </div>
          <p class="text-xs text-farm-dark/60">{{ addr.phone_number }}</p>
          <p class="text-sm text-farm-dark/70 mt-2 leading-relaxed">
            {{ addr.detailed_address }}, Brgy. {{ addr.barangay }}, {{ addr.city }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2 flex-shrink-0">
          <button
            v-if="!addr.is_default"
            type="button"
            class="px-3 py-2 text-[10px] uppercase tracking-wide border border-farm-light hover:border-farm-deep text-farm-dark/60"
            @click="setDefault(addr.id)"
          >
            Set default
          </button>
          <button
            type="button"
            class="px-3 py-2 text-[10px] uppercase tracking-wide border border-farm-light hover:border-farm-deep text-farm-dark/60"
            @click="openEdit(addr)"
          >
            Edit
          </button>
          <button
            type="button"
            class="px-3 py-2 text-[10px] uppercase tracking-wide border border-red-200 text-red-600 hover:bg-red-50"
            @click="removeAddress(addr.id)"
          >
            Delete
          </button>
        </div>
      </article>
    </section>

    <ClientOnly>
      <Transition name="modal-fade">
        <div v-if="showModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-farm-dark/40" @click="closeModal" />
          <form
            class="relative z-10 bg-white border border-farm-light w-full max-w-lg max-h-[90vh] overflow-y-auto"
            @submit.prevent="saveAddress"
          >
            <div class="px-5 py-4 border-b border-farm-light flex justify-between items-center">
              <h3 class="text-sm font-medium text-farm-dark">{{ editingId ? 'Edit address' : 'New address' }}</h3>
              <button type="button" class="text-farm-dark/50" @click="closeModal">
                <Icon name="heroicons:x-mark" class="w-5 h-5" />
              </button>
            </div>
            <div class="p-5 space-y-5">
              <div class="space-y-1">
                <label class="text-[10px] uppercase tracking-wider text-farm-dark/45">Full name</label>
                <input
                  v-model="form.full_name"
                  required
                  class="field-input"
                >
              </div>
              <div class="space-y-1">
                <label class="text-[10px] uppercase tracking-wider text-farm-dark/45">Phone number</label>
                <input
                  v-model="form.phone_number"
                  required
                  type="tel"
                  class="field-input"
                >
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] uppercase tracking-wider text-farm-dark/45">City</label>
                  <select
                    v-model="form.city"
                    required
                    class="field-input"
                    @change="onCityChange"
                  >
                    <option v-for="city in phCities" :key="city" :value="city">{{ city }}</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] uppercase tracking-wider text-farm-dark/45">Barangay</label>
                  <select
                    v-model="form.barangay"
                    required
                    class="field-input"
                  >
                    <option v-for="brgy in barangayOptions" :key="brgy" :value="brgy">{{ brgy }}</option>
                  </select>
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] uppercase tracking-wider text-farm-dark/45">Detailed address / landmarks</label>
                <textarea
                  v-model="form.detailed_address"
                  required
                  rows="3"
                  class="field-input resize-none"
                />
              </div>
              <label class="flex items-center gap-2 text-xs text-farm-dark/60">
                <input v-model="form.is_default" type="checkbox" class="accent-farm-deep">
                Set as default shipping address
              </label>
              <button
                type="submit"
                :disabled="saving"
                class="w-full py-3 bg-farm-deep text-white text-xs font-medium tracking-[0.12em] uppercase hover:bg-farm-leaf disabled:opacity-50"
              >
                {{ saving ? 'Saving…' : 'Save address' }}
              </button>
            </div>
          </form>
        </div>
      </Transition>
    </ClientOnly>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '~/components/ui/PageContainer.vue'
import { PH_CITIES, barangaysForCity } from '~/utils/phLocations'

definePageMeta({ layout: 'buyer' })

interface AddressRow {
  id: string
  full_name: string
  phone_number: string
  city: string
  barangay: string
  detailed_address: string
  is_default: boolean
}

const route = useRoute()
const api = useApiFetch()

const phCities = PH_CITIES

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
const formReady = ref(false)

const defaultCity = PH_CITIES[0]
const defaultBarangay = barangaysForCity(defaultCity)[0] ?? ''

const form = ref({
  full_name: '',
  phone_number: '',
  city: defaultCity,
  barangay: defaultBarangay,
  detailed_address: '',
  is_default: false,
})

const barangayOptions = computed(() => {
  if (!formReady.value) return barangaysForCity(defaultCity)
  return barangaysForCity(form.value.city)
})

function resetFormDefaults() {
  form.value = {
    full_name: '',
    phone_number: '',
    city: defaultCity,
    barangay: defaultBarangay,
    detailed_address: '',
    is_default: addresses.value.length === 0,
  }
}

function onCityChange() {
  const options = barangaysForCity(form.value.city)
  if (!options.includes(form.value.barangay)) {
    form.value.barangay = options[0] ?? ''
  }
}

function openCreate() {
  editingId.value = null
  resetFormDefaults()
  formReady.value = true
  showModal.value = true
}

function openEdit(addr: AddressRow) {
  editingId.value = addr.id
  form.value = {
    full_name: addr.full_name,
    phone_number: addr.phone_number,
    city: addr.city,
    barangay: addr.barangay,
    detailed_address: addr.detailed_address,
    is_default: addr.is_default,
  }
  formReady.value = true
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveAddress() {
  saving.value = true
  try {
    if (editingId.value) {
      await api(`/api/buyer/addresses/${editingId.value}`, { method: 'PUT', body: form.value })
    }
    else {
      await api('/api/buyer/addresses', { method: 'POST', body: form.value })
    }
    closeModal()
    await refresh()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    alert(e.data?.statusMessage || 'Failed to save address')
  }
  finally {
    saving.value = false
  }
}

async function setDefault(id: string) {
  await api(`/api/buyer/addresses/${id}/default`, { method: 'PUT' })
  await refresh()
}

async function removeAddress(id: string) {
  if (!confirm('Delete this address?')) return
  await api(`/api/buyer/addresses/${id}`, { method: 'DELETE' })
  await refresh()
}

onMounted(() => {
  formReady.value = true
  refresh()
})

useHead({ title: 'Addresses — Senoro Green Farm' })
</script>

<style scoped>
.field-input {
  @apply w-full border-b border-gray-200 focus:border-farm-deep bg-transparent rounded-none px-0 py-2.5 text-sm text-farm-dark outline-none;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
