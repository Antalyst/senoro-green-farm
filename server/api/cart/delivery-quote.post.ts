import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { quoteDeliveryFee } from '../../utils/deliveryFee'

/** Delivery fee preview for the checkout page. Checkout recalculates it, so this is display only. */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const { cart_item_ids, address_id } = body ?? {}

  if (!Array.isArray(cart_item_ids) || cart_item_ids.length === 0 || !address_id) {
    throw createError({ statusCode: 400, statusMessage: 'cart_item_ids and address_id are required' })
  }

  const supabase = await serverSupabaseClient(event)

  const [{ data: cartItems, error: cartError }, { data: address }] = await Promise.all([
    supabase
      .from('cart_items')
      .select('id, products!inner(seller_id)')
      .in('id', cart_item_ids)
      .eq('buyer_id', user.id),
    supabase
      .from('addresses')
      .select('*')
      .eq('id', address_id)
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (cartError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve cart items' })
  }
  if (!address) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid shipping address' })
  }

  // @ts-ignore Supabase relation typing is generated as object at runtime.
  const sellerIds: string[] = [...new Set((cartItems ?? []).map(item => item.products?.seller_id).filter(Boolean))]

  return await quoteDeliveryFee(supabase, sellerIds, address)
})
