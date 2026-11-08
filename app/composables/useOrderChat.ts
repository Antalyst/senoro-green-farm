import type { RealtimeChannel } from '@supabase/supabase-js'
import { computed, onUnmounted, ref } from 'vue'
import type { OrderStatus } from './useOrderTimeline'

export interface OrderMessage {
  id: string
  order_id: string
  sender_id: string
  receiver_id: string
  message_text: string
  kind?: 'text' | 'image' | 'receipt'
  /** Short-lived link to the photo (private storage). */
  image_url?: string | null
  created_at: string
}

export interface OrderChatContext {
  id: string
  status: OrderStatus | string
  buyer_id: string | null
  delivery_rider_id: string | null
}

export type PaymentStatus = 'awaiting_payment' | 'submitted' | 'confirmed' | 'rejected' | 'cod_unpaid' | 'rider_paid'

export interface OrderPayment {
  id: string
  order_id: string
  seller_id: string
  method: 'online' | 'cod'
  amount: number
  status: PaymentStatus
  payout_method: 'gcash' | 'maya' | 'bank' | null
  payout_account_name: string | null
  payout_account_number: string | null
  payout_bank_name: string | null
  payout_qr_url: string | null
  reference_number: string | null
  submitted_at: string | null
  rejection_reason: string | null
  confirmed_at: string | null
  rider_paid_at: string | null
  rider_paid_method: string | null
}

interface ChatResponse {
  order: OrderChatContext
  thread: 'seller' | 'rider' | 'rider_shop'
  side: 'buyer' | 'seller' | 'rider'
  partner: { id: string; name: string; role: string | null }
  locked_reason: string | null
  payment: OrderPayment | null
  messages: OrderMessage[]
}

/** Same name as the server's chatChannelName(): one channel per pair of people per order. */
function channelName(orderId: string, a: string, b: string) {
  const [x, y] = [a, b].sort()
  return `order-chat:${orderId}:${x}:${y}`
}

function errorText(err: any, fallback: string) {
  return err?.data?.statusMessage || err?.statusMessage || fallback
}

/** Chat between the signed-in user and one other person on an order. */
export const useOrderChat = () => {
  const supabase = useSupabaseClient()
  const api = useApiFetch()
  const { user } = useAuth()

  const orderId = ref<string | null>(null)
  const partnerId = ref<string | null>(null)
  const messages = ref<OrderMessage[]>([])
  const orderContext = ref<OrderChatContext | null>(null)
  const thread = ref<'seller' | 'rider' | 'rider_shop' | null>(null)
  const side = ref<'buyer' | 'seller' | 'rider' | null>(null)
  const partnerName = ref<string>('')
  const lockedReason = ref<string | null>(null)
  const payment = ref<OrderPayment | null>(null)
  const isPending = ref(false)
  const isSending = ref(false)
  const errorMessage = ref<string | null>(null)
  /** Goes up whenever the payment changes, so pages can refresh their lists. */
  const paymentVersion = ref(0)
  let chatChannel: RealtimeChannel | null = null

  const isChatActive = computed(() => !!orderContext.value && !lockedReason.value)
  const orderStatus = computed(() => orderContext.value?.status ?? 'pending')

  function addMessage(incoming: OrderMessage) {
    const i = messages.value.findIndex(m => m.id === incoming.id)
    if (i === -1) messages.value.push(incoming)
    else messages.value[i] = { ...messages.value[i], ...incoming }
  }

  function setPayment(next: OrderPayment | null) {
    const changed = JSON.stringify(next) !== JSON.stringify(payment.value)
    payment.value = next
    if (changed) paymentVersion.value++
  }

  async function load(silent = false) {
    if (!orderId.value) return
    if (!silent) isPending.value = true
    try {
      const query = partnerId.value ? `?with=${encodeURIComponent(partnerId.value)}` : ''
      const data = await api<ChatResponse>(`/api/chat/${orderId.value}/messages${query}`)
      orderContext.value = data.order
      thread.value = data.thread
      side.value = data.side
      partnerId.value = data.partner.id
      partnerName.value = data.partner.name
      lockedReason.value = data.locked_reason
      messages.value = data.messages ?? []
      setPayment(data.payment ? { ...data.payment, amount: Number(data.payment.amount) } : null)
      errorMessage.value = null
    }
    catch (err) {
      console.error('Failed loading chat history:', err)
      if (!silent) errorMessage.value = errorText(err, 'Could not load this chat.')
    }
    finally {
      isPending.value = false
    }
  }

  function disconnect() {
    if (chatChannel) {
      supabase.removeChannel(chatChannel)
      chatChannel = null
    }
  }

  function connect() {
    const me = user.value?.id
    if (!orderId.value || !partnerId.value || !me) return
    disconnect()
    chatChannel = supabase
      .channel(channelName(orderId.value, me, partnerId.value))
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        addMessage(payload as OrderMessage)
        // Receipts and payment replies change the payment card: reload it quietly.
        if (thread.value !== 'rider') load(true)
      })
      .subscribe()
  }

  async function open(id: string, partner: string | null) {
    disconnect()
    orderId.value = id
    partnerId.value = partner
    messages.value = []
    orderContext.value = null
    payment.value = null
    lockedReason.value = null
    errorMessage.value = null
    await load()
    connect()
  }

  function close() {
    disconnect()
    orderId.value = null
    partnerId.value = null
    messages.value = []
    errorMessage.value = null
  }

  async function sendText(text: string) {
    const trimmed = text.trim()
    if (!orderId.value || !partnerId.value || !trimmed || isSending.value) return false
    isSending.value = true
    errorMessage.value = null
    try {
      const result = await api<{ data: OrderMessage }>('/api/chat/send', {
        method: 'POST',
        body: { order_id: orderId.value, receiver_id: partnerId.value, message_text: trimmed },
      })
      if (result.data) addMessage(result.data)
      return true
    }
    catch (err) {
      errorMessage.value = errorText(err, 'Message not sent. Please try again.')
      return false
    }
    finally {
      isSending.value = false
    }
  }

  async function sendPhoto(file: File, caption = '') {
    if (!orderId.value || !partnerId.value || isSending.value) return false
    isSending.value = true
    errorMessage.value = null
    try {
      const form = new FormData()
      form.append('order_id', orderId.value)
      form.append('receiver_id', partnerId.value)
      if (caption.trim()) form.append('message_text', caption.trim())
      form.append('image', file)
      const result = await api<{ data: OrderMessage }>('/api/chat/send', { method: 'POST', body: form })
      if (result.data) addMessage(result.data)
      return true
    }
    catch (err) {
      errorMessage.value = errorText(err, 'Photo not sent. Please try again.')
      return false
    }
    finally {
      isSending.value = false
    }
  }

  /** Buyer: send the payment receipt photo + reference number to the shop. */
  async function submitReceipt(file: File, reference: string) {
    if (!orderId.value || !payment.value || isSending.value) return false
    isSending.value = true
    errorMessage.value = null
    try {
      const form = new FormData()
      form.append('order_id', orderId.value)
      form.append('seller_id', payment.value.seller_id)
      form.append('reference_number', reference)
      form.append('image', file)
      const result = await api<{ payment: OrderPayment; message: OrderMessage }>('/api/payments/submit', {
        method: 'POST',
        body: form,
      })
      if (result.message) addMessage(result.message)
      setPayment({ ...result.payment, amount: Number(result.payment.amount) })
      return true
    }
    catch (err) {
      errorMessage.value = errorText(err, 'Receipt not sent. Please try again.')
      return false
    }
    finally {
      isSending.value = false
    }
  }

  /** Seller: confirm or reject the receipt, or record that the rider paid cash at the shop (COD). */
  async function reviewPayment(action: 'confirm' | 'reject' | 'rider_paid', reason = '') {
    if (!payment.value || isSending.value) return false
    isSending.value = true
    errorMessage.value = null
    try {
      const result = await api<{ payment: OrderPayment }>(`/api/payments/${payment.value.id}`, {
        method: 'PATCH',
        body: { action, reason },
      })
      setPayment({ ...result.payment, amount: Number(result.payment.amount) })
      await load(true)
      return true
    }
    catch (err) {
      errorMessage.value = errorText(err, 'Could not update the payment.')
      return false
    }
    finally {
      isSending.value = false
    }
  }

  onUnmounted(disconnect)

  return {
    orderId,
    partnerId,
    messages,
    orderContext,
    orderStatus,
    thread,
    side,
    partnerName,
    lockedReason,
    payment,
    paymentVersion,
    isPending,
    isSending,
    isChatActive,
    errorMessage,
    open,
    close,
    sendText,
    sendPhoto,
    submitReceipt,
    reviewPayment,
  }
}
