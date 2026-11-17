<template>
  <div
    v-if="chat.isOpen"
    class="fixed inset-0 z-[999] flex justify-end overflow-hidden bg-black/50"
    @click="chat.closeChatModal()"
  >
    <div class="flex h-full max-h-[100dvh] w-full flex-col bg-white md:max-w-md" @click.stop>
      <!-- Header -->
      <header class="flex flex-shrink-0 items-center gap-1 border-b border-gray-100 bg-white pb-2 pl-1 pr-2 pt-[calc(0.5rem+var(--safe-top))]">
        <button
          type="button"
          class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-farm-leaf hover:bg-gray-100"
          aria-label="Close chat"
          @click="chat.closeChatModal()"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-shop-mint text-base font-bold uppercase text-farm-deep">
          {{ partnerInitial }}
        </span>
        <div class="ml-1.5 min-w-0 flex-1">
          <h2 class="truncate text-[15px] font-semibold leading-tight text-shop-ink">{{ chat.partnerName || chat.label }}</h2>
          <p class="truncate text-xs text-gray-500">{{ threadTitle }}</p>
        </div>
        <button
          v-if="pay"
          type="button"
          class="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full hover:bg-gray-100"
          :class="showPayment ? 'text-market-orange' : 'text-farm-leaf'"
          :aria-label="showPayment ? 'Hide payment details' : 'Show payment details'"
          :aria-expanded="showPayment"
          @click="showPayment = !showPayment"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-6 w-6" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" />
            <circle cx="12" cy="7.6" r="0.6" fill="currentColor" />
          </svg>
          <!-- Someone has to act on the payment -->
          <span v-if="needsAction && !showPayment" class="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-market-orange ring-2 ring-white" />
        </button>
      </header>

      <!-- Payment card: buyer <-> shop (online payment) and rider <-> shop (COD: the rider pays the shop) -->
      <section v-if="pay && showPayment" class="mx-3 mt-3 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-50">
        <div class="flex items-center gap-3 px-4 py-3">
          <span class="min-w-0 flex-1">
            <span class="block truncate text-xs text-gray-500">{{ cardTitle }}</span>
            <span class="block text-lg font-bold tabular-nums text-shop-ink">{{ formatPeso(pay.amount) }}</span>
          </span>
          <span class="flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="paymentBadgeClass(pay)">
            {{ paymentStatusLabel(pay) }}
          </span>
        </div>

        <div class="max-h-[40vh] space-y-3 overflow-y-auto px-4 pb-4 text-sm">
          <!-- Buyer looking at a COD shop: nothing to pay here -->
          <p v-if="chat.side === 'buyer' && pay.method === 'cod'" class="text-xs text-gray-600">
            Cash on delivery: pay this amount, plus the delivery fee, in cash to the rider when your order arrives.
          </p>

          <template v-else>
            <!-- Shop account + QR (the payer scans it; the shop sees what was shown) -->
            <div v-if="hasAccount && (iAmPayer || chat.side === 'seller')" class="flex gap-3 rounded-lg border border-gray-100 bg-farm-light/40 p-3">
              <a
                v-if="pay.payout_qr_url"
                :href="pay.payout_qr_url"
                target="_blank"
                rel="noopener"
                class="flex-shrink-0"
                aria-label="Open QR code"
              >
                <img :src="pay.payout_qr_url" alt="Shop payment QR code" class="h-28 w-28 rounded border border-gray-200 bg-white object-contain">
              </a>
              <dl class="min-w-0 flex-1 space-y-1 text-xs">
                <div>
                  <dt class="text-gray-500">{{ pay.payout_method === 'bank' ? pay.payout_bank_name : payoutLabel(pay.payout_method) }}</dt>
                  <dd class="flex items-center gap-1.5 font-mono text-sm font-semibold text-shop-ink">
                    {{ pay.payout_account_number }}
                    <button type="button" class="text-farm-leaf" aria-label="Copy number" @click="copy(pay.payout_account_number)">
                      <Icon name="heroicons:clipboard-document" class="h-4 w-4" />
                    </button>
                  </dd>
                </div>
                <div>
                  <dt class="text-gray-500">Account name</dt>
                  <dd class="font-semibold text-shop-ink">{{ pay.payout_account_name }}</dd>
                </div>
                <p v-if="copied" class="text-farm-leaf">Copied</p>
              </dl>
            </div>

            <!-- Payer (buyer for online, rider for COD): pay + send receipt -->
            <template v-if="iAmPayer">
              <p v-if="pay.status === 'rejected'" class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                The shop did not accept the receipt: {{ pay.rejection_reason }}
              </p>
              <template v-if="mustPay && hasAccount">
                <ol class="list-decimal space-y-0.5 pl-4 text-xs text-gray-600">
                  <li>Scan the QR (or send to the number) and pay exactly <b>{{ formatPeso(pay.amount) }}</b>.</li>
                  <li>Check the name shown in your app is <b>{{ pay.payout_account_name }}</b>.</li>
                  <li>Send a photo of the receipt and its reference number below.</li>
                </ol>
                <p v-if="pay.method === 'cod'" class="text-xs text-gray-500">Or pay cash at the shop; the shop will confirm it here.</p>
                <form v-if="!chat.lockedReason" class="space-y-2" @submit.prevent="sendReceipt">
                  <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-xs text-gray-600">
                    <Icon name="heroicons:photo" class="h-5 w-5 text-farm-leaf" />
                    <span class="min-w-0 flex-1 truncate">{{ receiptFile ? receiptFile.name : 'Choose receipt photo' }}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="pickReceipt">
                  </label>
                  <input
                    v-model="reference"
                    type="text"
                    inputmode="text"
                    maxlength="24"
                    placeholder="Reference number (e.g. 1234567890123)"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm uppercase outline-none focus:border-farm-leaf"
                  >
                  <button
                    type="submit"
                    class="w-full rounded-lg bg-market-orange py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    :disabled="chat.isSending || !receiptFile || reference.replace(/[\s-]/g, '').length < 6"
                  >
                    {{ chat.isSending ? 'Sending…' : 'Send receipt to shop' }}
                  </button>
                </form>
              </template>
              <p v-else-if="mustPay" class="text-xs text-gray-600">
                This shop has no online account. Pay <b>{{ formatPeso(pay.amount) }}</b> in cash at the shop. The shop will confirm it here.
              </p>
              <p v-else-if="pay.status === 'submitted'" class="text-xs text-gray-600">
                Receipt sent (Ref {{ pay.reference_number }}). The shop will check it and confirm here.
              </p>
              <p v-else-if="shopIsPaid(pay)" class="text-xs text-farm-deep">
                Payment confirmed. {{ pay.method === 'cod' ? 'Wait until the shop marks it ready for pickup.' : 'The shop will now prepare your order.' }}
              </p>
            </template>

            <!-- Shop: check the receipt, or record a cash payment from the rider -->
            <template v-else-if="chat.side === 'seller'">
              <template v-if="pay.status === 'submitted'">
                <p class="text-xs text-gray-600">Reference number: <b class="font-mono text-shop-ink">{{ pay.reference_number }}</b></p>
                <p class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  A screenshot can be edited. Open your {{ payoutLabel(pay.payout_method) }} app and check that
                  <b>{{ formatPeso(pay.amount) }}</b> with reference <b>{{ pay.reference_number }}</b> arrived before you confirm.
                </p>
                <div v-if="!rejecting" class="grid grid-cols-2 gap-2">
                  <button type="button" class="rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-red-600" :disabled="chat.isSending" @click="rejecting = true">
                    Reject
                  </button>
                  <button type="button" class="rounded-lg bg-farm-leaf py-2.5 text-sm font-semibold text-white disabled:opacity-50" :disabled="chat.isSending" @click="chat.reviewPayment('confirm')">
                    {{ chat.isSending ? 'Saving…' : 'Confirm payment' }}
                  </button>
                </div>
                <form v-else class="space-y-2" @submit.prevent="reject">
                  <input
                    v-model="rejectReason"
                    type="text"
                    maxlength="300"
                    placeholder="Why? e.g. amount is short, photo unclear, not received"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-farm-leaf"
                  >
                  <div class="grid grid-cols-2 gap-2">
                    <button type="button" class="rounded-lg border border-gray-200 py-2.5 text-sm" @click="rejecting = false">Back</button>
                    <button type="submit" class="rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50" :disabled="chat.isSending || rejectReason.trim().length < 3">
                      Send rejection
                    </button>
                  </div>
                </form>
              </template>
              <template v-else-if="pay.method === 'cod' && riderMustPay(pay)">
                <p class="text-xs text-gray-600">Waiting for the rider to pay you {{ formatPeso(pay.amount) }}{{ hasAccount ? ' online or in cash' : ' in cash' }}.</p>
                <button
                  v-if="chat.thread === 'rider_shop'"
                  type="button"
                  class="w-full rounded-lg border border-farm-leaf py-2.5 text-sm font-semibold text-farm-deep disabled:opacity-50"
                  :disabled="chat.isSending"
                  @click="chat.reviewPayment('rider_paid')"
                >
                  Rider paid me {{ formatPeso(pay.amount) }} in cash
                </button>
              </template>
              <p v-else-if="buyerMustPay(pay)" class="text-xs text-gray-600">Waiting for the buyer to pay and send the receipt.</p>
              <p v-else-if="shopIsPaid(pay)" class="text-xs text-farm-deep">Payment confirmed. You can accept the order now.</p>
            </template>

            <!-- Rider looking at a shop the buyer paid online -->
            <p v-else-if="chat.side === 'rider' && pay.method === 'online'" class="text-xs text-gray-600">
              The buyer paid this shop online. Nothing to pay here.
            </p>
          </template>
        </div>
      </section>

      <!-- Messages -->
      <div ref="scrollBox" class="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain px-3 py-4">
        <!-- Delivered, still open: this chat is for problems with the items -->
        <div v-if="problemOpen" class="mx-auto mb-2 max-w-sm rounded-2xl bg-amber-50 px-4 py-3 text-center text-xs leading-relaxed text-amber-900">
          <p class="font-semibold">Order delivered</p>
          <p v-if="chat.side === 'buyer'">
            Is an item defective, wrong or missing? Tell {{ chat.partnerName || 'them' }} here and add a photo.
            You can chat until {{ untilLabel }}.
          </p>
          <p v-else>
            The buyer can report problems with the items here until {{ untilLabel }}.
          </p>
        </div>

        <div v-if="chat.isPending" class="flex justify-center py-12">
          <div class="h-7 w-7 animate-spin rounded-full border-4 border-farm-leaf border-t-transparent" />
        </div>
        <div v-else-if="!chat.messages.length" class="flex flex-col items-center px-6 py-14 text-center">
          <span class="flex h-20 w-20 items-center justify-center rounded-full bg-shop-mint text-3xl font-bold uppercase text-farm-deep">
            {{ partnerInitial }}
          </span>
          <p class="mt-3 text-base font-semibold text-shop-ink">{{ chat.partnerName || chat.label }}</p>
          <p class="text-xs text-gray-500">{{ threadTitle }}</p>
          <p class="mt-4 max-w-[16rem] text-sm text-gray-500">
            {{ chat.thread === 'rider' ? 'No messages yet. Coordinate pickup or drop-off here.' : 'No messages yet. Ask anything about this order here.' }}
          </p>
        </div>

        <div
          v-for="message in chat.messages"
          :key="message.id"
          class="flex"
          :class="mine(message) ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[78%] overflow-hidden rounded-[20px] text-[15px] leading-snug md:text-sm"
            :class="mine(message) ? 'rounded-br-md bg-farm-leaf text-white' : 'rounded-bl-md bg-gray-100 text-shop-ink'"
          >
            <p v-if="message.kind === 'receipt'" class="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-market-orange">
              🧾 Payment receipt
            </p>
            <a v-if="message.image_url" :href="message.image_url" target="_blank" rel="noopener" class="block">
              <img :src="message.image_url" alt="Photo in chat" class="max-h-64 w-full bg-black/5 object-contain">
            </a>
            <p v-else-if="message.kind === 'image' || message.kind === 'receipt'" class="px-3 pt-2 text-xs opacity-70">Photo unavailable</p>
            <div class="px-3.5 py-2">
              <p v-if="message.message_text" class="whitespace-pre-line break-words">{{ message.message_text }}</p>
              <p class="mt-0.5 text-right text-[10px] opacity-60">{{ formatTime(message.created_at) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Composer -->
      <p v-if="chat.errorMessage" class="flex-shrink-0 bg-red-50 px-4 py-2 text-xs text-red-700">{{ chat.errorMessage }}</p>

      <!-- Closed chat: one quiet bar instead of a disabled message box -->
      <div
        v-if="chat.lockedReason"
        class="flex flex-shrink-0 items-center justify-center gap-2 border-t border-gray-100 bg-gray-50 px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))] text-center text-xs text-gray-500"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 flex-shrink-0" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        <span>{{ chat.lockedReason }}</span>
      </div>

      <template v-else>
      <div
        v-if="problemOpen && chat.side === 'buyer'"
        class="flex flex-shrink-0 gap-2 overflow-x-auto border-t border-gray-100 px-3 pt-2 scrollbar-none"
        aria-label="Report a problem"
      >
        <button
          v-for="p in PROBLEMS"
          :key="p.label"
          type="button"
          class="min-h-[36px] flex-shrink-0 rounded-full border border-market-orange/40 px-3 text-xs font-semibold text-market-orange hover:bg-market-orange/10"
          @click="startProblem(p.text)"
        >
          {{ p.label }}
        </button>
      </div>

      <form
        class="flex flex-shrink-0 items-center gap-1.5 bg-white px-2 pt-2 pb-[calc(0.5rem+var(--safe-bottom))]"
        @submit.prevent="send"
      >
        <label
          class="flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-farm-leaf hover:bg-gray-100"
          :class="{ 'pointer-events-none opacity-40': locked }"
          aria-label="Send a photo"
          title="Send a photo"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <circle cx="9" cy="10" r="1.8" />
            <path d="M21 16l-5-5-9 9" />
          </svg>
          <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" :disabled="locked" @change="sendPhoto">
        </label>
        <input
          ref="messageInput"
          v-model="text"
          type="text"
          maxlength="1000"
          :disabled="locked"
          placeholder="Message…"
          aria-label="Message"
          enterkeyhint="send"
          class="h-11 min-w-0 flex-1 rounded-full bg-gray-100 px-4 text-base text-shop-ink outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-farm-leaf/30 disabled:cursor-not-allowed md:text-sm"
        >
        <button
          type="submit"
          class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-market-orange text-white transition-opacity disabled:opacity-40"
          :disabled="locked || !text.trim()"
          aria-label="Send"
        >
          <span v-if="chat.isSending" class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <svg v-else viewBox="0 0 24 24" fill="currentColor" class="ml-0.5 h-5 w-5" aria-hidden="true">
            <path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.99.99 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
          </svg>
        </button>
      </form>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { OrderMessage, OrderPayment } from '~/composables/useOrderChat'

// The layout passes reactive(useLayoutChatDrawer()).
const props = defineProps<{ chat: any }>()

const scrollBox = ref<HTMLElement | null>(null)
const messageInput = ref<HTMLInputElement | null>(null)

// ---- Problems after delivery (defective, wrong or missing item) ----
const PROBLEMS = [
  { label: 'Item is defective', text: 'Hi, an item I received is defective: ' },
  { label: 'Wrong item', text: 'Hi, I received the wrong item: ' },
  { label: 'Something is missing', text: 'Hi, something is missing from my order: ' },
]

/** Delivered order whose chat is still open for problem reports. */
const problemOpen = computed(() => props.chat.orderContext?.status === 'delivered' && !!props.chat.problemChatUntil && !props.chat.lockedReason)
const untilLabel = computed(() => {
  const until = props.chat.problemChatUntil
  return until ? new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(until)) : ''
})

function startProblem(starter: string) {
  text.value = starter
  nextTick(() => {
    const input = messageInput.value
    if (!input) return
    input.focus()
    input.setSelectionRange(input.value.length, input.value.length)
  })
}
const text = ref('')
const showPayment = ref(true)
const receiptFile = ref<File | null>(null)
const reference = ref('')
const rejecting = ref(false)
const rejectReason = ref('')
const copied = ref(false)

const pay = computed<OrderPayment | null>(() => (props.chat.thread !== 'rider' ? props.chat.payment : null))

const threadTitle = computed(() => {
  const t = props.chat.thread
  if (t === 'rider_shop') {
    const cod = props.chat.payment?.method === 'cod' ? ' · COD payment' : ''
    return props.chat.side === 'rider' ? `Shop chat${cod}` : `Rider chat${cod}`
  }
  if (t === 'seller') return props.chat.side === 'buyer' ? 'Shop chat' : 'Buyer chat'
  return props.chat.side === 'buyer' ? 'Rider chat' : 'Buyer chat'
})

/** The buyer pays online shops; the rider pays COD shops. */
const iAmPayer = computed(() => {
  const p = pay.value
  if (!p) return false
  return (props.chat.side === 'buyer' && p.method === 'online')
    || (props.chat.side === 'rider' && p.method === 'cod')
})
const mustPay = computed(() => iAmPayer.value && (buyerMustPay(pay.value) || riderMustPay(pay.value)))
const hasAccount = computed(() => !!pay.value?.payout_account_number)
const cardTitle = computed(() => {
  const p = pay.value
  if (!p) return ''
  if (p.method === 'online') return `Amount to pay · ${payoutLabel(p.payout_method)}`
  if (props.chat.side === 'buyer') return 'Cash on delivery'
  return hasAccount.value ? `COD · rider pays shop · ${payoutLabel(p.payout_method)}` : 'COD · rider pays shop in cash'
})
const partnerInitial = computed(() => String(props.chat.partnerName || props.chat.label || '?').trim().charAt(0) || '?')
const locked = computed(() => !props.chat.isChatActive || props.chat.isSending)

const { user } = useAuth()
const mine = (m: OrderMessage) => m.sender_id === user.value?.id

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-PH', { timeStyle: 'short' }).format(new Date(value))
}

async function send() {
  if (await props.chat.sendText(text.value)) text.value = ''
}

async function sendPhoto(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) await props.chat.sendPhoto(file, text.value)
  if (file && !props.chat.errorMessage) text.value = ''
}

function pickReceipt(event: Event) {
  receiptFile.value = (event.target as HTMLInputElement).files?.[0] ?? null
}

async function sendReceipt() {
  if (!receiptFile.value) return
  if (await props.chat.submitReceipt(receiptFile.value, reference.value)) {
    receiptFile.value = null
    reference.value = ''
  }
}

async function reject() {
  if (await props.chat.reviewPayment('reject', rejectReason.value)) {
    rejecting.value = false
    rejectReason.value = ''
  }
}

async function copy(value: string | null) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  }
  catch { /* clipboard not allowed */ }
}

async function scrollToBottom() {
  await nextTick()
  if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight
}

watch(() => props.chat.messages.length, () => { if (props.chat.isOpen) scrollToBottom() })
watch(() => props.chat.isOpen, (isOpen) => {
  if (isOpen) {
    text.value = ''
    rejecting.value = false
    scrollToBottom()
  }
})
/** Someone has to do something with the payment (pay, send a receipt, or check one). */
const needsAction = computed(() => {
  const p = pay.value
  return !!p && (mustPay.value || p.status === 'submitted' || (props.chat.side === 'seller' && riderMustPay(p)))
})

// Show the payment card when someone needs to act on it; otherwise it stays behind the info button.
watch(pay, () => { showPayment.value = needsAction.value }, { immediate: true })

// White chat bar: dark status-bar icons while the chat is open.
useOverlayStatusBar(() => !!props.chat.isOpen, 'dark')
</script>
