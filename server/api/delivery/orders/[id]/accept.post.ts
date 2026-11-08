import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../../utils/auth'

// Rider claims a job.
// - Order with a cash on delivery (COD) shop: can be claimed right after checkout. The rider pays
//   each COD shop first (online receipt in chat, or cash at the shop); the shop accepts after that.
// - Order paid fully online: can be claimed only when every shop marked it ready for pickup.
// The order status does not change here; it moves on with the shop's actions and the QR scans.
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'delivery') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — delivery only' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Order ID required' })

  const supabase = await serverSupabaseClient(event)

  const payments = (await fetchOrderPayments(supabase, [id])).get(id) ?? []
  const hasCod = hasCodPayment(payments)
  const claimable = hasCod ? ['pending', 'processing', 'ready_for_pickup'] : ['ready_for_pickup']

  // Conditional update: only one rider can win, even if two tap "Accept" at the same time.
  const { data: claimed, error } = await supabase
    .from('orders')
    .update({ delivery_rider_id: user.id })
    .eq('id', id)
    .in('status', claimable)
    .is('delivery_rider_id', null)
    .select('id, buyer_id, status')
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to accept job' })
  }
  if (!claimed) {
    throw createError({ statusCode: 409, statusMessage: 'This job is no longer available. Another rider may have taken it.' })
  }

  const { data: items } = await supabase.from('order_items').select('seller_id').eq('order_id', id)
  const sellerIds = [...new Set((items ?? []).map(i => i.seller_id).filter(Boolean))] as string[]
  const shortId = id.slice(0, 8).toUpperCase()

  await notify(event, [
    ...(claimed.buyer_id
      ? [{
          user_id: claimed.buyer_id,
          order_id: id,
          title: 'Rider assigned 🛵',
          message: `${user.full_name} accepted your order and will deliver it.`,
        }]
      : []),
    ...sellerIds.map((sellerId) => {
      const payment = payments.find(p => p.seller_id === sellerId)
      const codUnpaid = payment?.method === 'cod' && payment.status !== 'rider_paid'
      return {
        user_id: sellerId,
        order_id: id,
        title: codUnpaid ? 'Rider accepted · payment coming 🛵' : 'Rider coming for pickup 🛵',
        message: codUnpaid
          ? `${user.full_name} will pay you ${formatPesoServer(payment!.amount)} for order #${shortId}. Confirm the payment, then accept the order.`
          : `${user.full_name} will pick up order #${shortId}. Have the receipt QR ready.`,
      }
    }),
  ])

  return { success: true, order_id: id, status: claimed.status, pay_shops_first: hasCod }
})
