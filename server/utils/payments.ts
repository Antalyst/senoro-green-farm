// Online payment (GCash / Maya / bank QR) and order chat access rules (migration 017).

type Db = { from: (table: string) => any }

export type PayoutMethod = 'gcash' | 'maya' | 'bank'
export type PaymentMethod = 'online' | 'cod'
export type PaymentStatus =
  | 'awaiting_payment'
  | 'submitted'
  | 'confirmed'
  | 'rejected'
  | 'cod_unpaid'
  | 'rider_paid'

export const PAYOUT_METHODS: PayoutMethod[] = ['gcash', 'maya', 'bank']
export const RIDER_PAID_METHODS = ['cash', 'gcash', 'maya', 'bank'] as const

export interface PayoutAccount {
  payout_method: PayoutMethod | null
  payout_account_name: string | null
  payout_account_number: string | null
  payout_bank_name: string | null
  payout_qr_url: string | null
}

export const PAYOUT_COLUMNS = 'payout_method, payout_account_name, payout_account_number, payout_bank_name, payout_qr_url'

const bad = (statusMessage: string) => createError({ statusCode: 400, statusMessage })

/**
 * Validates a seller payment account from a request body.
 * - GCash / Maya: account name, 11-digit number starting with 09, QR image required.
 * - Bank: account name, bank name, 10–16 digit account number, QR optional.
 * Sending { payout_method: null } removes the account (shop becomes COD only).
 */
export function parsePayoutAccount(body: any): PayoutAccount {
  if (body?.payout_method === null || body?.payout_method === '') {
    return { payout_method: null, payout_account_name: null, payout_account_number: null, payout_bank_name: null, payout_qr_url: null }
  }

  const method = String(body?.payout_method ?? '').toLowerCase() as PayoutMethod
  if (!PAYOUT_METHODS.includes(method)) throw bad('Choose GCash, Maya or Bank.')

  const name = String(body?.payout_account_name ?? '').trim().replace(/\s+/g, ' ')
  if (name.length < 2 || name.length > 60) throw bad('Account name must be 2 to 60 characters.')

  const number = String(body?.payout_account_number ?? '').replace(/[\s-]/g, '')
  const qr = String(body?.payout_qr_url ?? '').trim() || null
  if (qr && !/^https:\/\/\S+$/.test(qr)) throw bad('Upload the QR image again.')

  if (method === 'gcash' || method === 'maya') {
    if (!/^09\d{9}$/.test(number)) throw bad(`${method === 'gcash' ? 'GCash' : 'Maya'} number must be 11 digits starting with 09.`)
    if (!qr) throw bad('Upload your QR code image so buyers can scan it.')
    return { payout_method: method, payout_account_name: name, payout_account_number: number, payout_bank_name: null, payout_qr_url: qr }
  }

  const bank = String(body?.payout_bank_name ?? '').trim().replace(/\s+/g, ' ')
  if (bank.length < 2 || bank.length > 60) throw bad('Enter the bank name.')
  if (!/^\d{10,16}$/.test(number)) throw bad('Bank account number must be 10 to 16 digits.')
  return { payout_method: 'bank', payout_account_name: name, payout_account_number: number, payout_bank_name: bank, payout_qr_url: qr }
}

/** True when a seller can receive online payment. */
export function hasOnlinePayout(row: Partial<PayoutAccount> | null | undefined) {
  if (!row?.payout_method || !row.payout_account_name || !row.payout_account_number) return false
  if (row.payout_method === 'bank') return !!row.payout_bank_name
  return !!row.payout_qr_url
}

/** True when migration 017 has not been run yet (missing table or columns). */
export function isMissingPaymentSchema(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false
  return ['42P01', 'PGRST205', 'PGRST204', '42703'].includes(error.code ?? '')
    || /order_payments|payout_|delivery_fee|image_path|'kind'|"kind"/.test(error.message ?? '')
}

/** Seller id -> payout account. Empty map before migration 017. */
export async function fetchPayoutAccounts(supabase: Db, sellerIds: string[]) {
  const accounts = new Map<string, PayoutAccount>()
  if (!sellerIds.length) return accounts
  const { data, error } = await supabase.from('users').select(`id, ${PAYOUT_COLUMNS}`).in('id', sellerIds)
  if (error) {
    if (!isMissingPaymentSchema(error)) console.error('fetchPayoutAccounts:', error.message)
    return accounts
  }
  for (const row of data ?? []) accounts.set(row.id, row)
  return accounts
}

export const PAYMENT_SELECT = `
  id, order_id, seller_id, method, amount, status,
  payout_method, payout_account_name, payout_account_number, payout_bank_name, payout_qr_url,
  reference_number, submitted_at, rejection_reason, confirmed_at, rider_paid_at, rider_paid_method,
  created_at, updated_at
`

/** Order id -> payment rows. Empty map before migration 017. */
export async function fetchOrderPayments(supabase: Db, orderIds: string[]) {
  const byOrder = new Map<string, any[]>()
  if (!orderIds.length) return byOrder
  const { data, error } = await supabase.from('order_payments').select(PAYMENT_SELECT).in('order_id', orderIds)
  if (error) {
    if (!isMissingPaymentSchema(error)) console.error('fetchOrderPayments:', error.message)
    return byOrder
  }
  for (const row of data ?? []) {
    const list = byOrder.get(row.order_id) ?? []
    list.push({ ...row, amount: Number(row.amount) })
    byOrder.set(row.order_id, list)
  }
  return byOrder
}

/**
 * Can the shop accept / pack its part of the order?
 * - Online: the buyer's receipt must be confirmed.
 * - COD: a rider accepted the job and the shop confirmed the rider paid (online receipt or cash).
 * - Orders from before migration 017 (no payment row) never block.
 */
export function isPaymentSettledForSeller(payment: { method: string; status: string } | null | undefined) {
  if (!payment) return true
  if (payment.method === 'online') return payment.status === 'confirmed'
  return payment.status === 'rider_paid'
}

/** Statuses a payment can be in while a receipt or cash payment is still expected. */
export const PAYABLE_STATUSES = ['awaiting_payment', 'rejected', 'cod_unpaid'] as const

/** COD orders get their rider right after checkout (the rider pays the COD shops first). */
export function hasCodPayment(payments: { method: string }[] | undefined) {
  return !!payments?.some(p => p.method === 'cod')
}

/** Who may chat with whom on one order. */
export interface OrderChatAccess {
  order: { id: string; status: string; buyer_id: string | null; delivery_rider_id: string | null }
  sellerIds: string[]
  /** Role of the current user on this order. */
  side: 'buyer' | 'seller' | 'rider'
}

/** Loads the order and checks the user takes part in it (buyer, a seller with items, or the rider). */
export async function loadOrderChatAccess(supabase: Db, orderId: string, userId: string): Promise<OrderChatAccess> {
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, buyer_id, delivery_rider_id')
    .eq('id', orderId)
    .maybeSingle()

  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found.' })

  const { data: items } = await supabase.from('order_items').select('seller_id').eq('order_id', orderId)
  const sellerIds = [...new Set((items ?? []).map((i: any) => i.seller_id).filter(Boolean))] as string[]

  let side: OrderChatAccess['side'] | null = null
  if (userId === order.buyer_id) side = 'buyer'
  else if (userId === order.delivery_rider_id) side = 'rider'
  else if (sellerIds.includes(userId)) side = 'seller'

  if (!side) throw createError({ statusCode: 403, statusMessage: 'You are not part of this order.' })
  return { order, sellerIds, side }
}

/**
 * Chat threads on one order:
 * - 'seller':     buyer <-> a shop (online payment receipts)
 * - 'rider':      buyer <-> the rider
 * - 'rider_shop': the rider <-> a shop (COD: the rider pays the shop before it accepts)
 */
export type ChatThread = 'seller' | 'rider' | 'rider_shop'

/** Checks the other person is allowed in a chat with the current user. Returns the thread type. */
export function assertChatPartner(access: OrderChatAccess, partnerId: string): ChatThread {
  const { order, sellerIds, side } = access
  if (side === 'buyer') {
    if (sellerIds.includes(partnerId)) return 'seller'
    if (partnerId === order.delivery_rider_id) return 'rider'
  }
  else if (side === 'seller') {
    if (partnerId === order.buyer_id) return 'seller'
    if (partnerId === order.delivery_rider_id) return 'rider_shop'
  }
  else {
    if (partnerId === order.buyer_id) return 'rider'
    if (sellerIds.includes(partnerId)) return 'rider_shop'
  }
  throw createError({ statusCode: 403, statusMessage: 'Invalid chat partner for this order.' })
}

/**
 * When a chat can take new messages.
 * - Buyer <-> shop: from checkout until the order is delivered or cancelled.
 * - Chats with the rider: once a rider has accepted the job, until delivered or cancelled.
 */
export function chatOpenReason(thread: ChatThread, order: OrderChatAccess['order']): string | null {
  if (order.status === 'delivered') return 'This order is delivered. The chat is now read-only.'
  if (order.status === 'cancelled') return 'This order was cancelled. The chat is now read-only.'
  if (thread !== 'seller' && !order.delivery_rider_id) return 'Chat is unavailable until a delivery rider is assigned.'
  return null
}

/** Shop id of the payment shown in a thread (buyer <-> shop, or rider <-> shop). */
export function threadSellerId(access: OrderChatAccess, thread: ChatThread, userId: string, partnerId: string) {
  if (thread === 'rider') return null
  return access.side === 'seller' ? userId : partnerId
}

/**
 * Can the buyer still cancel this order? Returns null when yes, or the reason why not.
 * Rule: the buyer can cancel while NO shop has been paid yet.
 * - Online shop: the buyer has not paid it (no receipt sent, or the receipt was rejected).
 * - COD shop:   no rider accepted yet, or the rider has not paid the shop.
 * Since a shop can only accept after it is paid, a cancellable order is always still "pending".
 */
export function buyerCancelBlock(
  order: { status: string },
  payments: { method: string; status: string }[],
): string | null {
  if (order.status === 'cancelled') return 'This order is already cancelled.'
  if (order.status !== 'pending') return 'A shop already accepted this order, so it can no longer be cancelled.'
  for (const p of payments) {
    if (p.status === 'confirmed') return 'You already paid a shop for this order, so it can no longer be cancelled.'
    if (p.status === 'rider_paid') return 'The rider already paid the shop, so this order can no longer be cancelled.'
    if (p.status === 'submitted') {
      return p.method === 'online'
        ? 'A shop is checking your payment receipt. Ask the shop in chat before cancelling.'
        : 'The rider sent a payment to the shop, so this order can no longer be cancelled.'
    }
  }
  return null
}

/** Reference number on a receipt: letters and digits only, 6–20 characters. */
export function normalizeReference(input: unknown) {
  const ref = String(input ?? '').toUpperCase().replace(/[\s-]/g, '')
  if (!/^[A-Z0-9]{6,20}$/.test(ref)) {
    throw bad('Enter the reference number from your receipt (6 to 20 letters or numbers).')
  }
  return ref
}

export const formatPesoServer = (n: number) =>
  `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
