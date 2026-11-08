import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import type { PayoutAccount } from '../../utils/payments'

// Sends a payment receipt for one shop of an order. Who pays depends on the payment method:
// - online: the BUYER pays the shop (receipt goes in the buyer <-> shop chat)
// - cod:    the RIDER who accepted the job pays the shop online (receipt in the rider <-> shop chat);
//           a rider paying cash at the shop needs no receipt, the shop just taps "Rider paid me (cash)".
// Multipart form: order_id, seller_id, reference_number, image (JPG/PNG/WebP, max 5 MB).
// The payment becomes "submitted" until the shop checks it and confirms or rejects.
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer' && user.role !== 'delivery') {
    throw createError({ statusCode: 403, statusMessage: 'Only the buyer or the rider can send a payment receipt.' })
  }

  if (!(getHeader(event, 'content-type') || '').includes('multipart/form-data')) {
    throw createError({ statusCode: 400, statusMessage: 'Attach a photo of your receipt.' })
  }
  const parts = await readMultipartFormData(event)
  const fields = multipartFields(parts)
  const orderId = String(fields.order_id ?? '')
  const sellerId = String(fields.seller_id ?? '')
  if (!orderId || !sellerId) {
    throw createError({ statusCode: 400, statusMessage: 'order_id and seller_id are required.' })
  }
  const reference = normalizeReference(fields.reference_number)
  const image = readImagePart(parts, 'image', 'The receipt photo')

  const supabase = await serverSupabaseClient(event)

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, buyer_id, delivery_rider_id')
    .eq('id', orderId)
    .maybeSingle()

  const isBuyer = user.role === 'buyer' && order?.buyer_id === user.id
  const isRider = user.role === 'delivery' && order?.delivery_rider_id === user.id
  if (!order || (!isBuyer && !isRider)) throw createError({ statusCode: 404, statusMessage: 'Order not found.' })
  if (order.status === 'cancelled' || order.status === 'delivered') {
    throw createError({ statusCode: 400, statusMessage: `This order is ${order.status}.` })
  }

  const { data: payment, error: paymentError } = await supabase
    .from('order_payments')
    .select('id, method, status, amount, payout_method')
    .eq('order_id', orderId)
    .eq('seller_id', sellerId)
    .maybeSingle()

  if (isMissingPaymentSchema(paymentError)) {
    throw createError({ statusCode: 503, statusMessage: 'Online payment needs a database update (migration 017).' })
  }
  if (!payment) throw createError({ statusCode: 404, statusMessage: 'No payment found for this shop.' })

  if (isBuyer && payment.method !== 'online') {
    throw createError({ statusCode: 400, statusMessage: 'This shop is cash on delivery. You pay the rider when your order arrives.' })
  }
  if (isRider && payment.method !== 'cod') {
    throw createError({ statusCode: 400, statusMessage: 'The buyer already pays this shop online. Nothing to pay here.' })
  }
  if (payment.status === 'submitted') {
    throw createError({ statusCode: 409, statusMessage: 'The receipt was already sent. Wait for the shop to check it.' })
  }
  if (payment.status === 'confirmed' || payment.status === 'rider_paid') {
    throw createError({ statusCode: 409, statusMessage: 'This payment is already confirmed.' })
  }

  // COD: the rider pays the shop's current account. Shops without one take cash at the shop.
  let codAccount: PayoutAccount | null = null
  if (isRider) {
    codAccount = (await fetchPayoutAccounts(supabase, [sellerId])).get(sellerId) ?? null
    if (!hasOnlinePayout(codAccount)) {
      throw createError({ statusCode: 400, statusMessage: 'This shop has no online account. Pay cash at the shop; the shop will confirm it.' })
    }
  }

  // One receipt can't pay for two orders.
  const { data: reused } = await supabase
    .from('order_payments')
    .select('id')
    .ilike('reference_number', reference)
    .in('status', ['submitted', 'confirmed', 'rider_paid'])
    .neq('id', payment.id)
    .limit(1)
  if (reused?.length) {
    throw createError({ statusCode: 409, statusMessage: 'This reference number was already used for another payment.' })
  }

  const imagePath = await storeChatImage(event, orderId, user.id, image)
  const amount = formatPesoServer(Number(payment.amount))

  const message = await postChatMessage(event, supabase, {
    order_id: orderId,
    sender_id: user.id,
    receiver_id: sellerId,
    message_text: `Payment receipt · ${amount} · Ref ${reference}`,
    kind: 'receipt',
    image_path: imagePath,
  })
  if (!message) {
    await removeChatImages(event, [imagePath])
    throw createError({ statusCode: 500, statusMessage: 'Could not send the receipt. Please try again.' })
  }

  // Only moves forward if nobody changed it in the meantime.
  const { data: updated, error: updateError } = await supabase
    .from('order_payments')
    .update({
      status: 'submitted',
      reference_number: reference,
      receipt_message_id: message.id,
      submitted_at: new Date().toISOString(),
      rejection_reason: null,
      updated_at: new Date().toISOString(),
      // COD: remember which account the rider paid.
      ...(codAccount ? { ...codAccount } : {}),
    })
    .eq('id', payment.id)
    .in('status', [...PAYABLE_STATUSES])
    .select(PAYMENT_SELECT)
    .maybeSingle()

  if (updateError?.code === '23505') {
    throw createError({ statusCode: 409, statusMessage: 'This reference number was already used for another payment.' })
  }
  if (updateError || !updated) {
    throw createError({ statusCode: 409, statusMessage: 'The payment changed. Refresh and try again.' })
  }

  await notify(event, [{
    user_id: sellerId,
    order_id: orderId,
    title: isRider ? 'Rider sent payment receipt 🧾' : 'Payment receipt received 🧾',
    message: `${amount}, ref ${reference}. Check your account, then confirm in chat.`,
  }])

  return { payment: { ...updated, amount: Number(updated.amount) }, message }
})
