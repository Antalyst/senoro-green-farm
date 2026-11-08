import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'

// Chat history between the current user and one other person on an order.
// Query: ?with=<user id>. Threads: buyer <-> each shop on the order, and buyer <-> rider.
// For a buyer <-> shop thread it also returns that shop's payment (amount, account, status).
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const orderId = getRouterParam(event, 'orderId')
  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID required.' })
  }

  const supabase = await serverSupabaseClient(event)
  const access = await loadOrderChatAccess(supabase, orderId, user.id)
  const { order, side } = access

  // Older screens open the rider chat without ?with=.
  const requested = String(getQuery(event).with ?? '')
  const partnerId = requested
    || (side === 'buyer' ? order.delivery_rider_id : order.buyer_id)
    || ''
  if (!partnerId) {
    throw createError({ statusCode: 400, statusMessage: 'Chat partner required.' })
  }
  const thread = assertChatPartner(access, partnerId)

  const [rows, { data: partner }] = await Promise.all([
    fetchPairMessages(supabase, orderId, user.id, partnerId),
    supabase.from('users').select('id, full_name, shop_name, role').eq('id', partnerId).maybeSingle(),
  ])

  // Payment card: buyer <-> shop shows the buyer's online payment; rider <-> shop shows the COD payment.
  let payment: any = null
  const sellerId = threadSellerId(access, thread, user.id, partnerId)
  if (sellerId) {
    const payments = await fetchOrderPayments(supabase, [orderId])
    payment = payments.get(orderId)?.find(p => p.seller_id === sellerId) ?? null

    // COD: the rider pays the shop's current account (no copy was saved at checkout).
    if (payment?.method === 'cod' && thread === 'rider_shop' && !payment.payout_method) {
      const account = (await fetchPayoutAccounts(supabase, [sellerId])).get(sellerId)
      if (hasOnlinePayout(account)) payment = { ...payment, ...account }
    }
  }

  return {
    order: {
      id: order.id,
      status: order.status,
      buyer_id: order.buyer_id,
      delivery_rider_id: order.delivery_rider_id,
    },
    thread,
    side,
    partner: partner
      ? { id: partner.id, name: partner.shop_name || partner.full_name, role: partner.role }
      : { id: partnerId, name: 'Order chat', role: null },
    locked_reason: chatOpenReason(thread, order),
    payment,
    messages: await withImageUrls(event, rows),
  }
})
