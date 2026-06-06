import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const orderId = getRouterParam(event, 'orderId')

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID required.' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, status, buyer_id, delivery_rider_id')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found.' })
  }

  const isParticipant = user.id === order.buyer_id || user.id === order.delivery_rider_id
  if (!isParticipant) {
    throw createError({ statusCode: 403, statusMessage: 'You are not a participant on this order.' })
  }

  const { data: messages, error: msgErr } = await supabase
    .from('messages')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (msgErr) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load chat history.' })
  }

  return {
    order: {
      id: order.id,
      status: order.status,
      buyer_id: order.buyer_id,
      delivery_rider_id: order.delivery_rider_id,
    },
    messages: messages ?? [],
  }
})
