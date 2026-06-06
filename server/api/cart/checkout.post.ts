import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const { cart_item_ids, address_id } = body ?? {}

  if (!cart_item_ids || !Array.isArray(cart_item_ids) || cart_item_ids.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'cart_item_ids array is required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: cartItems, error: fetchError } = await supabase
    .from('cart_items')
    .select(`
      id, quantity, buyer_id, product_id,
      products!inner(id, name, price, seller_id, stock)
    `)
    .in('id', cart_item_ids)

  if (fetchError || !cartItems || cartItems.length === 0) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve cart items' })
  }

  for (const item of cartItems) {
    if (item.buyer_id !== user.id) {
      throw createError({ statusCode: 403, statusMessage: 'Unauthorized cart item access' })
    }
  }

  const deliveryFee = 50
  let itemsSubtotal = 0
  for (const item of cartItems) {
    // @ts-ignore Supabase relation typing is generated as object at runtime.
    const price = parseFloat(item.products.price)
    itemsSubtotal += price * item.quantity
  }
  const totalAmount = itemsSubtotal + deliveryFee

  let resolvedAddressId = address_id as string | undefined

  if (resolvedAddressId) {
    const { data: addr } = await supabase
      .from('addresses')
      .select('id')
      .eq('id', resolvedAddressId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!addr) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid shipping address' })
    }
  }
  else {
    const { data: defaultAddr } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .maybeSingle()

    resolvedAddressId = defaultAddr?.id
  }

  if (!resolvedAddressId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot process order without a valid shipping address.',
    })
  }

  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_id: user.id,
      total_amount: totalAmount,
      address_id: resolvedAddressId,
      status: 'pending',
    })
    .select()
    .single()

  if (orderError || !newOrder) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create order' })
  }

  const orderItemsData = cartItems.map(item => ({
    order_id: newOrder.id,
    product_id: item.product_id,
    // @ts-ignore Supabase relation typing is generated as object at runtime.
    seller_id: item.products.seller_id,
    quantity: item.quantity,
    // @ts-ignore Supabase relation typing is generated as object at runtime.
    price: item.products.price,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsData)

  if (itemsError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create order items' })
  }

  for (const item of cartItems) {
    // @ts-ignore Supabase relation typing is generated as object at runtime.
    const newStock = Math.max(0, item.products.stock - item.quantity)
    await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', item.product_id)
  }

  await supabase
    .from('cart_items')
    .delete()
    .in('id', cart_item_ids)

  // Step 1: Notify each unique seller that a new order has been placed from their shop
  // @ts-ignore Supabase relation typing is generated as object at runtime.
  const sellerIds = [...new Set(cartItems.map(item => item.products?.seller_id).filter(Boolean))]

  for (const sellerId of sellerIds) {
    const { error: sellerNotifError } = await supabase
      .from('notifications')
      .insert({
        user_id: sellerId,
        order_id: newOrder.id,
        title: 'New Order Received! 🌾',
        message: 'A customer has checked out items from your shop. Please review and accept.',
        is_read: false,
      })

    if (sellerNotifError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Order created, but seller notification failed',
      })
    }
  }

  return {
    success: true,
    order_id: newOrder.id,
    total_amount: totalAmount,
  }
})
