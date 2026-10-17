<template>
  <div class="space-y-8 py-8 md:py-10">
    <UiPageHeader
      label="Settings"
      title="Delivery fee"
      caption="Buyers pay the rate per kilometer × the distance from each shop to their pinned address."
    />

    <p v-if="pending" class="py-16 text-center text-sm text-gray-400">Loading…</p>

    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <form class="ui-card space-y-5 p-5 md:p-6" @submit.prevent="save">
        <h2 class="text-base font-semibold text-farm-deep">Rates</h2>

        <div>
          <label for="rate" class="ui-label">Rate per kilometer (₱)</label>
          <input
            id="rate"
            v-model.number="form.rate_per_km"
            type="number"
            min="0"
            step="0.01"
            required
            class="ui-input tabular-nums"
          >
        </div>

        <div>
          <label for="fallback" class="ui-label">Fallback fee per shop (₱)</label>
          <input
            id="fallback"
            v-model.number="form.fallback_fee"
            type="number"
            min="0"
            step="0.01"
            required
            class="ui-input tabular-nums"
          >
          <p class="mt-1.5 text-xs text-gray-400">
            Charged when the buyer's address or the shop has no map pin, so the distance can't be measured.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 border-t border-farm-leaf/15 pt-5">
          <button type="submit" :disabled="saving" class="ui-btn-accent">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
          <p v-if="message" class="text-sm" :class="messageIsError ? 'text-red-600' : 'text-gray-500'">
            {{ message }}
          </p>
        </div>
      </form>

      <section class="space-y-5 rounded-md border border-farm-leaf/15 bg-shop-mint p-5 md:p-6">
        <h2 class="text-base font-semibold text-farm-deep">Fee calculator</h2>

        <div>
          <label for="sample-km" class="ui-label">Distance (km)</label>
          <input
            id="sample-km"
            v-model.number="sampleKm"
            type="number"
            min="0"
            step="0.1"
            class="ui-input tabular-nums"
          >
        </div>

        <div class="border-t border-farm-leaf/15 pt-5">
          <p class="text-sm tabular-nums text-gray-500">
            ₱{{ formatMoney(form.rate_per_km) }} × {{ sampleKm || 0 }} km
          </p>
          <p class="mt-1 text-2xl font-semibold tabular-nums text-market-orange">
            ₱{{ formatMoney(sampleFee) }}
          </p>
        </div>

        <p class="text-xs text-gray-400">
          Distance is a straight line between the two map pins. Orders from several shops add each shop's fee.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const api = useApiFetch()

interface DeliverySettings {
  rate_per_km: number
  fallback_fee: number
}

const form = reactive<DeliverySettings>({ rate_per_km: 15, fallback_fee: 50 })
const sampleKm = ref(15)
const saving = ref(false)
const message = ref('')
const messageIsError = ref(false)

const { data, pending } = await useAsyncData(
  'admin:delivery-settings',
  () => api<{ settings: DeliverySettings }>('/api/admin/delivery-settings'),
  { server: false },
)

watch(data, (value) => {
  if (value?.settings) Object.assign(form, value.settings)
}, { immediate: true })

const sampleFee = computed(() => Math.round((Number(form.rate_per_km) || 0) * (Number(sampleKm.value) || 0) * 100) / 100)

function formatMoney(n: number) {
  return (Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function save() {
  saving.value = true
  message.value = ''
  try {
    const res = await api<{ settings: DeliverySettings }>('/api/admin/delivery-settings', {
      method: 'PUT',
      body: { rate_per_km: form.rate_per_km, fallback_fee: form.fallback_fee },
    })
    Object.assign(form, res.settings)
    messageIsError.value = false
    message.value = 'Saved. New checkouts use this rate right away.'
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    messageIsError.value = true
    message.value = e.data?.statusMessage || 'Failed to save delivery rate'
  }
  finally {
    saving.value = false
  }
}

useHead({ title: 'Delivery Fee — NFWM Admin' })
</script>
