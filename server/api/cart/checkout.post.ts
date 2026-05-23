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

  // Get selected cart items and verify ownership
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

  // Double check all belong to the current user
  for (const item of cartItems) {
    if (item.buyer_id !== user.id) {
      throw createError({ statusCode: 403, statusMessage: 'Unauthorized cart item access' })
    }
  }

  // Calculate total amount
  let totalAmount = 0
  for (const item of cartItems) {
    // @ts-ignore
    const price = parseFloat(item.products.price)
    totalAmount += price * item.quantity
  }

  // Resolve shipping address
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

  // Insert order
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

  // Insert order items
  const orderItemsData = cartItems.map(item => ({
    order_id: newOrder.id,
    product_id: item.product_id,
    // @ts-ignore
    seller_id: item.products.seller_id,
    quantity: item.quantity,
    // @ts-ignore
    price: item.products.price
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsData)

  if (itemsError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create order items' })
  }

  // Deduct stock for products
  for (const item of cartItems) {
    // @ts-ignore
    const newStock = Math.max(0, item.products.stock - item.quantity)
    await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', item.product_id)
  }

  // Delete checked out cart items
  await supabase
    .from('cart_items')
    .delete()
    .in('id', cart_item_ids)

  return {
    success: true,
    order_id: newOrder.id,
    total_amount: totalAmount
  }
})
