<template>
  <div class="receipt-page h-full overflow-y-auto bg-gray-50 px-4 py-6 print:bg-white print:p-0">
    <!-- Toolbar (not printed) -->
    <div class="no-print mx-auto mb-4 flex max-w-[360px] items-center justify-between gap-2">
      <NuxtLink to="/seller/orders" class="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-shop-ink">
        <Icon name="heroicons:arrow-left" class="h-4 w-4" />
        Orders
      </NuxtLink>
      <button
        type="button"
        class="ui-btn"
        :disabled="!receipt"
        @click="printNow"
      >
        <Icon name="heroicons:printer" class="h-4 w-4" />
        Print receipt
      </button>
    </div>

    <p v-if="error" class="no-print mx-auto max-w-[360px] rounded border border-gray-100 bg-white px-4 py-3 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="!receipt" class="no-print mx-auto max-w-[360px] rounded border border-gray-100 bg-white py-16 text-center text-sm text-gray-400">Loading…</p>

    <!-- Receipt (80 mm wide on thermal printers) -->
    <article v-else class="receipt mx-auto max-w-[360px] bg-white p-6 font-mono text-[13px] leading-snug text-black border border-gray-100 print:border-0">
      <header class="text-center">
        <p class="text-base font-bold tracking-wide">NFWM</p>
        <p class="text-[11px]">Negros Farmers Weekend Market</p>
        <p class="mt-2 text-sm font-bold">{{ receipt.shop_name }}</p>
      </header>

      <div class="dash" />

      <dl class="space-y-0.5">
        <div class="flex justify-between"><dt>Order</dt><dd class="font-bold">#{{ receipt.short_id }}</dd></div>
        <div class="flex justify-between"><dt>Date</dt><dd>{{ formatDate(receipt.created_at) }}</dd></div>
        <div class="flex justify-between"><dt>Items</dt><dd>{{ receipt.item_count }}</dd></div>
      </dl>

      <div class="dash" />

      <p class="font-bold">DELIVER TO</p>
      <template v-if="receipt.recipient">
        <p>{{ receipt.recipient.full_name }} · {{ receipt.recipient.phone_number }}</p>
        <p>{{ receipt.recipient.detailed_address }}</p>
        <p>Brgy. {{ receipt.recipient.barangay }}, {{ receipt.recipient.city }}</p>
      </template>
      <p v-else>No address on file</p>

      <div class="dash" />

      <table class="w-full">
        <tbody>
          <tr v-for="(item, i) in receipt.items" :key="i" class="align-top">
            <td class="pr-2">{{ item.quantity }}× {{ item.name }}</td>
            <td class="whitespace-nowrap text-right">{{ peso(item.line_total) }}</td>
          </tr>
        </tbody>
      </table>
      <div class="mt-1 flex justify-between border-t border-black pt-1 font-bold">
        <span>Shop subtotal</span>
        <span>{{ peso(receipt.subtotal) }}</span>
      </div>

      <div class="dash" />

      <!-- Pickup QR -->
      <section class="text-center">
        <p class="font-bold">RIDER PICKUP QR</p>
        <div class="mx-auto mt-2 w-48">
          <UiQrCode :value="receipt.qr_payload" label="Pickup QR code" @ready="onQrReady" />
        </div>
        <p class="mt-2 text-[11px]">Pickup code</p>
        <p class="text-xl font-bold tracking-[0.25em]">{{ receipt.pickup_code }}</p>
        <p class="mt-2 text-[11px]">The rider scans this QR when collecting the package.</p>
        <p v-if="receipt.rider_name" class="mt-1 text-[11px]">Rider: {{ receipt.rider_name }}</p>
      </section>

      <div class="dash" />
      <p class="text-center text-[11px]">Attach this receipt to the package.</p>
    </article>
  </div>
</template>

<script setup lang="ts">
// No layout: a clean page that prints only the receipt.
definePageMeta({ layout: false })

interface Receipt {
  order_id: string
  short_id: string
  created_at: string
  status: string
  shop_name: string
  recipient: { full_name: string; phone_number: string; detailed_address: string; barangay: string; city: string } | null
  rider_name: string | null
  items: { name: string; quantity: number; price: number; line_total: number }[]
  item_count: number
  subtotal: number
  pickup_code: string
  qr_payload: string
}

const route = useRoute()
const api = useApiFetch()
const receipt = ref<Receipt | null>(null)
const error = ref<string | null>(null)
let autoPrinted = false

function peso(n: number) {
  return `P${n.toFixed(2)}`
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function printNow() {
  window.print()
}

// ?print=1 (after "Mark ready") opens the print dialog once the QR is drawn.
function onQrReady() {
  if (route.query.print === '1' && !autoPrinted) {
    autoPrinted = true
    setTimeout(printNow, 300)
  }
}

onMounted(async () => {
  try {
    const res = await api<{ receipt: Receipt }>(`/api/seller/orders/${route.params.id}/receipt`)
    receipt.value = res.receipt
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    error.value = e.data?.statusMessage || 'Could not load the receipt.'
  }
})

useHead({ title: computed(() => receipt.value ? `Receipt #${receipt.value.short_id} — NFWM` : 'Receipt — NFWM') })
</script>

<style scoped>
.dash {
  @apply my-3 border-t border-dashed border-black;
}
</style>

<style>
/* Printing: undo Ionic's full-screen container so the receipt prints normally. */
@media print {
  @page {
    margin: 6mm;
  }
  ion-app {
    position: static !important;
    contain: none !important;
    overflow: visible !important;
  }
  .receipt-page {
    height: auto !important;
    overflow: visible !important;
  }
  .no-print {
    display: none !important;
  }
}
</style>
