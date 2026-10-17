import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../../utils/auth'

// Rider claims a ready order. The order stays ready_for_pickup until the shop QR is scanned.
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'delivery') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — delivery only' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Order ID required' })

  const supabase = await serverSupabaseClient(event)

  // Conditional update: only one rider can win, even if two tap "Accept" at the same time.
  const { data: claimed, error } = await supabase
    .from('orders')
    .update({ delivery_rider_id: user.id })
    .eq('id', id)
    .eq('status', 'ready_for_pickup')
    .is('delivery_rider_id', null)
    .select('id, buyer_id')
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
          message: `${user.full_name} accepted your order and is going to the shop.`,
        }]
      : []),
    ...sellerIds.map(sellerId => ({
      user_id: sellerId,
      order_id: id,
      title: 'Rider coming for pickup 🛵',
      message: `${user.full_name} will pick up order #${shortId}. Have the receipt QR ready.`,
    })),
  ])

  return { success: true, order_id: id }
})
