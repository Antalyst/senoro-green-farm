import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

// Shop action on its own payment for an order.
// Body:
//   { action: 'confirm' }               receipt checked and money received
//                                       (online: from the buyer; COD: from the rider)
//   { action: 'reject', reason }        receipt wrong (amount, unclear photo, not received)
//   { action: 'rider_paid' }            COD: the rider paid cash at the shop
// The shop can accept the order only after this (see isPaymentSettledForSeller).
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Only the shop can update its payment.' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Payment ID required.' })

  const body = await readBody(event)
  const action = String(body?.action ?? '')

  const supabase = await serverSupabaseClient(event)
  const { data: payment, error: loadError } = await supabase
    .from('order_payments')
    .select('id, order_id, seller_id, method, status, amount, reference_number, payout_method')
    .eq('id', id)
    .maybeSingle()

  if (isMissingPaymentSchema(loadError)) {
    throw createError({ statusCode: 503, statusMessage: 'Online payment needs a database update (migration 017).' })
  }
  if (!payment || payment.seller_id !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Payment not found.' })
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, buyer_id, delivery_rider_id')
    .eq('id', payment.order_id)
    .maybeSingle()
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found.' })
  if (order.status === 'cancelled' || order.status === 'delivered') {
    throw createError({ statusCode: 400, statusMessage: `This order is ${order.status}.` })
  }

  const isCod = payment.method === 'cod'
  // Who paid: the buyer (online) or the rider (COD). Chat replies and alerts go to them.
  const payerId: string | null = isCod ? order.delivery_rider_id : order.buyer_id
  const amount = formatPesoServer(Number(payment.amount))
  const now = new Date().toISOString()
  let changes: Record<string, unknown>
  let fromStatuses: string[]
  let chatText: string | null = null
  let notice: { title: string; message: string } | null = null

  if (action === 'confirm') {
    if (payment.status !== 'submitted') {
      throw createError({ statusCode: 400, statusMessage: 'There is no receipt waiting to be checked.' })
    }
    fromStatuses = ['submitted']
    changes = isCod
      ? { status: 'rider_paid', rider_paid_at: now, rider_paid_method: payment.payout_method ?? 'gcash', rejection_reason: null }
      : { status: 'confirmed', confirmed_at: now, rejection_reason: null }
    chatText = isCod
      ? `✅ Payment of ${amount} received (Ref ${payment.reference_number}). We'll prepare the order and tell you when it's ready for pickup.`
      : `✅ Payment of ${amount} confirmed (Ref ${payment.reference_number}). We'll prepare your order.`
    notice = isCod
      ? { title: 'Shop received your payment 💵', message: `The shop confirmed your ${amount}. Wait until it is ready for pickup.` }
      : { title: 'Payment confirmed ✅', message: `The shop confirmed your payment of ${amount}.` }
  }
  else if (action === 'reject') {
    if (payment.status !== 'submitted') {
      throw createError({ statusCode: 400, statusMessage: 'There is no receipt waiting to be checked.' })
    }
    const reason = String(body?.reason ?? '').trim().replace(/\s+/g, ' ')
    if (reason.length < 3 || reason.length > 300) {
      throw createError({ statusCode: 400, statusMessage: 'Say why (3 to 300 characters).' })
    }
    fromStatuses = ['submitted']
    changes = { status: 'rejected', rejection_reason: reason }
    chatText = `❌ Payment not accepted: ${reason}. Please check and send the receipt again.`
    notice = { title: 'Payment not accepted ❌', message: reason.length > 60 ? `${reason.slice(0, 57)}...` : reason }
  }
  else if (action === 'rider_paid') {
    if (!isCod) {
      throw createError({ statusCode: 400, statusMessage: 'Only cash on delivery payments are paid by the rider.' })
    }
    if (!order.delivery_rider_id) {
      throw createError({ statusCode: 400, statusMessage: 'Wait until a rider accepts this order.' })
    }
    if (payment.status === 'rider_paid') {
      throw createError({ statusCode: 400, statusMessage: 'The rider already paid for this order.' })
    }
    if (order.status === 'out_for_delivery') {
      throw createError({ statusCode: 400, statusMessage: 'This order was already picked up.' })
    }
    fromStatuses = ['cod_unpaid', 'rejected', 'submitted']
    changes = { status: 'rider_paid', rider_paid_at: now, rider_paid_method: 'cash', rejection_reason: null }
    chatText = `✅ Cash payment of ${amount} received. We'll prepare the order and tell you when it's ready for pickup.`
    notice = { title: 'Shop received your payment 💵', message: `The shop confirmed your cash payment of ${amount}.` }
  }
  else {
    throw createError({ statusCode: 400, statusMessage: 'Unknown action.' })
  }

  // Conditional update: only if the payment is still in an expected state.
  const { data: updated, error } = await supabase
    .from('order_payments')
    .update({ ...changes, updated_at: now })
    .eq('id', payment.id)
    .in('status', fromStatuses)
    .select(PAYMENT_SELECT)
    .maybeSingle()

  if (error || !updated) {
    throw createError({ statusCode: 409, statusMessage: 'The payment changed. Refresh and try again.' })
  }

  if (chatText && payerId) {
    await postChatMessage(event, supabase, {
      order_id: order.id,
      sender_id: user.id,
      receiver_id: payerId,
      message_text: chatText,
    })
  }
  if (notice && payerId) await notify(event, [{ ...notice, user_id: payerId, order_id: order.id }])

  return { payment: { ...updated, amount: Number(updated.amount) } }
})
