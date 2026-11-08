import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'
import type { OrderStatus } from '../../../utils/orderStatus'

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

    // The shop must be paid before it accepts:
    // online -> the buyer's receipt is confirmed; COD -> the rider who accepted the job paid the shop.
    const payment = (await fetchOrderPayments(supabase, [id])).get(id)?.find(p => p.seller_id === user.id)
    if (!isPaymentSettledForSeller(payment)) {
      let statusMessage: string
      if (payment?.method === 'cod') {
        statusMessage = !order.delivery_rider_id
          ? 'Cash on delivery: wait for a rider to accept this order and pay you first.'
          : payment.status === 'submitted'
            ? 'Check the rider\'s receipt and confirm the payment first.'
            : 'Wait for the rider to pay you, then confirm it before accepting.'
      }
      else {
        statusMessage = payment?.status === 'submitted'
          ? 'Check the buyer\'s receipt and confirm the payment first.'
          : 'Wait for the buyer\'s payment receipt, then confirm it before accepting.'
      }
      throw createError({ statusCode: 400, statusMessage })
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
    // QR handoff flow: riders accept via /api/delivery/orders/:id/accept and
    // move the order forward only by scanning QR codes (/api/delivery/scan).
    throw createError({ statusCode: 403, statusMessage: 'Riders update orders by accepting the job and scanning QR codes.' })
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

  // Multi-role notification pipeline — fires only when status actually changed.
  // Best effort: the status is already saved, so a notification problem must not return an error.
  if (current !== updated.status) {
    const newStatus = updated.status as OrderStatus
    const buyerMessages: Partial<Record<OrderStatus, { title: string; message: string }>> = {
      processing: {
        title: 'Order Accepted & Preparing! 🍳',
        message: 'The shop has accepted your order and is currently preparing your fresh items.',
      },
      out_for_delivery: {
        title: 'Order is On the Way! 🚀',
        message: 'Your delivery rider has collected your parcels and is en route to your location.',
      },
      delivered: {
        title: 'Order Delivered! 🎉',
        message: 'Enjoy your fresh farm items! Thank you for ordering from Farmers to Market.',
      },
      cancelled: {
        title: 'Order Cancelled ❌',
        message: 'Your order was cancelled. Please check your payment or contact support.',
      },
    }

    const buyerMessage = buyerMessages[newStatus]
    if (buyerMessage && updated.buyer_id) {
      await notify(event, [{ user_id: updated.buyer_id, order_id: id, ...buyerMessage }])
    }

    // All sellers packed. A rider already on the job (COD orders) is told to come;
    // otherwise every rider is told a job is ready.
    if (newStatus === 'ready_for_pickup' && updated.delivery_rider_id) {
      await notify(event, [{
        user_id: updated.delivery_rider_id,
        order_id: id,
        title: 'Ready for pickup 📦',
        message: `Order #${id.slice(0, 8).toUpperCase()} is packed. Go to the shop and scan the receipt QR.`,
      }])
    }
    else if (newStatus === 'ready_for_pickup') {
      const { data: riders, error: ridersError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'delivery')

      if (ridersError) console.error('[status] failed to load riders:', ridersError.message)

      await notify(event, (riders ?? []).map(rider => ({
        user_id: rider.id,
        order_id: id,
        title: 'New Job Available! 🛵',
        message: 'A unified market order package is packed and ready for pickup in Bacolod City.',
      })))
    }
  }

  return { order: updated }
})

