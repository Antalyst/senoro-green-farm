import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

const ACTIVE_STATUSES = ['ready_for_pickup', 'out_for_delivery'] as const

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const supabase = await serverSupabaseClient(event)

  const body = await readBody(event)
  const { order_id, message_text, receiver_id } = body ?? {}

  if (!order_id || !message_text?.trim() || !receiver_id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required parameters.' })
  }

  const trimmedText = message_text.trim()
  if (trimmedText.length > 1000) {
    throw createError({ statusCode: 400, statusMessage: 'Message exceeds 1000 characters.' })
  }

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('status, buyer_id, delivery_rider_id')
    .eq('id', order_id)
    .single()

  if (orderErr || !order) {
    throw createError({ statusCode: 404, statusMessage: 'Fulfillment order context not found.' })
  }

  if (!ACTIVE_STATUSES.includes(order.status as typeof ACTIVE_STATUSES[number])) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Chat thread is inactive. Conversations are closed unless items are ready or out for delivery.',
    })
  }

  if (!order.delivery_rider_id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Chat is unavailable until a delivery rider is assigned.',
    })
  }

  const isBuyer = user.id === order.buyer_id
  const isRider = user.id === order.delivery_rider_id

  if (!isBuyer && !isRider) {
    throw createError({ statusCode: 403, statusMessage: 'You are not a participant on this order.' })
  }

  const expectedReceiver = isBuyer ? order.delivery_rider_id : order.buyer_id
  if (receiver_id !== expectedReceiver) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid message recipient for this order.' })
  }

  const { data: newMessage, error: msgErr } = await supabase
    .from('messages')
    .insert({
      order_id,
      sender_id: user.id,
      receiver_id,
      message_text: trimmedText,
    })
    .select()
    .single()

  if (msgErr) {
    throw createError({ statusCode: 500, statusMessage: msgErr.message })
  }

  const isSenderRider = user.id === order.delivery_rider_id
  const alertTitle = isSenderRider ? 'New Message from Rider! 🛵' : 'New Message from Buyer! 🌾'

  await supabase.from('notifications').insert({
    user_id: receiver_id,
    order_id,
    title: alertTitle,
    message: trimmedText.length > 45 ? `${trimmedText.slice(0, 42)}...` : trimmedText,
    is_read: false,
  })

  await supabase.channel(`realtime-order-chat:${order_id}`).send({
    type: 'broadcast',
    event: 'message',
    payload: newMessage,
  })

  return { success: true, data: newMessage }
})
