import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'
import {
  assertDeliveryTransition,
  assertSellerTransition,
  type OrderStatus,
} from '../../../utils/orderStatus'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID required' })
  }

  const body = await readBody(event)
  const { status: targetStatus } = body ?? {}

  if (!targetStatus) {
    throw createError({ statusCode: 400, statusMessage: 'status is required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, delivery_rider_id, buyer_id')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !order) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  const current = order.status as OrderStatus
  const target = targetStatus as OrderStatus

  if (current === target) {
    return { order }
  }

  const updatePayload: {
    status: OrderStatus
    delivery_rider_id?: string | null
  } = { status: target }

  if (user.role === 'seller') {
    assertSellerTransition(current, target)

    const { data: sellerItems } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', id)
      .eq('seller_id', user.id)
      .limit(1)

    if (!sellerItems?.length) {
      throw createError({ statusCode: 403, statusMessage: 'No seller items on this order' })
    }
  }
  else if (user.role === 'delivery') {
    assertDeliveryTransition(current, target)

    if (target === 'out_for_delivery') {
      if (current !== 'ready_for_pickup') {
        throw createError({ statusCode: 400, statusMessage: 'Order must be ready for pickup' })
      }
      updatePayload.delivery_rider_id = user.id
    }

    if (target === 'delivered') {
      if (current !== 'out_for_delivery') {
        throw createError({ statusCode: 400, statusMessage: 'Order must be out for delivery' })
      }
      if (order.delivery_rider_id && order.delivery_rider_id !== user.id) {
        throw createError({ statusCode: 403, statusMessage: 'Order assigned to another rider' })
      }
      updatePayload.delivery_rider_id = user.id
    }
  }
  else if (user.role === 'admin') {
    // Admin may force status for support (optional)
  }
  else {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const { data: updated, error: updateError } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (updateError || !updated) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update order status' })
  }

  return { order: updated }
})
