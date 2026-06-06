import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'
import {
  assertDeliveryTransition,
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
    const { data: sellerItems } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', id)
      .eq('seller_id', user.id)

    if (!sellerItems?.length) {
      throw createError({ statusCode: 403, statusMessage: 'No seller items on this order' })
    }

    if (target === 'processing') {
      if (current !== 'pending' && current !== 'processing') {
        throw createError({
          statusCode: 400,
          statusMessage: `Seller cannot transition from ${current} to processing`,
        })
      }
      updatePayload.status = 'processing'
    }
    else if (target === 'ready_for_pickup') {
      if (current !== 'pending' && current !== 'processing') {
        throw createError({
          statusCode: 400,
          statusMessage: `Seller cannot transition from ${current} to ready_for_pickup`,
        })
      }

      // Mark this seller's items as confirmed
      const { error: updateItemsError } = await supabase
        .from('order_items')
        .update({ is_confirmed: true })
        .eq('order_id', id)
        .eq('seller_id', user.id)

      if (updateItemsError) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to confirm seller order items',
        })
      }

      // Check if there are any remaining unconfirmed sellers for this specific order
      const { data: unconfirmed, error: countError } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', id)
        .eq('is_confirmed', false)

      if (countError) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to check other sellers confirmation status',
        })
      }

      if (!unconfirmed || unconfirmed.length === 0) {
        updatePayload.status = 'ready_for_pickup'
      }
      else {
        updatePayload.status = 'processing'
      }
    }
    else {
      throw createError({
        statusCode: 400,
        statusMessage: `Seller cannot transition order to status ${target}`,
      })
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

  // Multi-role notification pipeline — fires only when status actually changed
  if (current !== updated.status) {
    const newStatus = updated.status

    // Step 2: Seller accepts order -> Notify BUYER that their order is being prepared
    if (newStatus === 'processing' && updated.buyer_id) {
      const { error: processingNotifError } = await supabase
        .from('notifications')
        .insert({
          user_id: updated.buyer_id,
          order_id: id,
          title: 'Order Accepted & Preparing! 🍳',
          message: 'The shop has accepted your order and is currently preparing your fresh items.',
          is_read: false,
        })

      if (processingNotifError) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to notify buyer of order acceptance' })
      }
    }

    // Step 3: All sellers confirmed, order ready -> Notify ALL DELIVERY RIDERS to claim the job
    if (newStatus === 'ready_for_pickup') {
      const { data: riders, error: ridersError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'delivery')

      if (ridersError) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to fetch delivery riders for notification' })
      }

      if (riders && riders.length > 0) {
        for (const rider of riders) {
          const { error: riderNotifError } = await supabase
            .from('notifications')
            .insert({
              user_id: rider.id,
              order_id: id,
              title: 'New Job Available! 🛵',
              message: 'A unified market order package is packed and ready for pickup in Bago City.',
              is_read: false,
            })

          if (riderNotifError) {
            throw createError({ statusCode: 500, statusMessage: 'Failed to notify delivery riders of ready order' })
          }
        }
      }
    }

    // Step 4: Rider picks up order -> Notify BUYER that their order is on the way
    if (newStatus === 'out_for_delivery' && updated.buyer_id) {
      const { error: outForDeliveryNotifError } = await supabase
        .from('notifications')
        .insert({
          user_id: updated.buyer_id,
          order_id: id,
          title: 'Order is On the Way! 🚀',
          message: 'Your delivery rider has collected your parcels and is en route to your location.',
          is_read: false,
        })

      if (outForDeliveryNotifError) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to notify buyer of pickup' })
      }
    }

    // Final delivery confirmation -> Notify BUYER their order was delivered
    if (newStatus === 'delivered' && updated.buyer_id) {
      const { error: deliveredNotifError } = await supabase
        .from('notifications')
        .insert({
          user_id: updated.buyer_id,
          order_id: id,
          title: 'Order Delivered! 🎉',
          message: 'Enjoy your fresh farm items! Thank you for ordering from Senoro Green Farm.',
          is_read: false,
        })

      if (deliveredNotifError) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to notify buyer of delivery' })
      }
    }

    // Cancellation -> Notify BUYER their order was cancelled
    if (newStatus === 'cancelled' && updated.buyer_id) {
      const { error: cancelledNotifError } = await supabase
        .from('notifications')
        .insert({
          user_id: updated.buyer_id,
          order_id: id,
          title: 'Order Cancelled ❌',
          message: 'Your order was cancelled. Please check your payment or contact support.',
          is_read: false,
        })

      if (cancelledNotifError) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to notify buyer of cancellation' })
      }
    }
  }

  return { order: updated }
})

