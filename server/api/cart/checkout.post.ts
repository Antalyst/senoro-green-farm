import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { quoteDeliveryFee } from '../../utils/deliveryFee'

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
      products!inner(id, name, price, seller_id, stock, image_url)
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

  let itemsSubtotal = 0
  for (const item of cartItems) {
    // @ts-ignore Supabase relation typing is generated as object at runtime.
    const price = parseFloat(item.products.price)
    itemsSubtotal += price * item.quantity
  }

  // '*' includes latitude/longitude once migration 009 is applied, without failing before it.
  let address: { id: string; latitude?: number | null; longitude?: number | null } | null = null

  if (address_id) {
    const { data: addr } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', address_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!addr) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid shipping address' })
    }
    address = addr
  }
  else {
    const { data: defaultAddr } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .maybeSingle()

    address = defaultAddr
  }

  if (!address) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot process order without a valid shipping address.',
    })
  }
  const resolvedAddressId = address.id

  // @ts-ignore Supabase relation typing is generated as object at runtime.
  const sellerIds: string[] = [...new Set(cartItems.map(item => item.products?.seller_id).filter(Boolean))]

  // Rate per km (set by admin) × distance from each shop to the buyer.
  const { fee: deliveryFee } = await quoteDeliveryFee(supabase, sellerIds, address)
  const totalAmount = Math.round((itemsSubtotal + deliveryFee) * 100) / 100

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

  // Copy the product name and image onto the order (migration 014) so order history
  // keeps them even if the seller later edits or deletes the product.
  const withSnapshot = orderItemsData.map((row, i) => ({
    ...row,
    // @ts-ignore Supabase relation typing is generated as object at runtime.
    product_name: cartItems[i].products.name,
    // @ts-ignore Supabase relation typing is generated as object at runtime.
    product_image_url: cartItems[i].products.image_url ?? null,
  }))

  let { error: itemsError } = await supabase.from('order_items').insert(withSnapshot)

  // DB without migration 014: save the items without the snapshot.
  if (itemsError && (itemsError.code === 'PGRST204' || /product_name|product_image_url/.test(itemsError.message))) {
    ;({ error: itemsError } = await supabase.from('order_items').insert(orderItemsData))
  }

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
  // The order is already saved, so a notification problem must not show the buyer an error.
  await notify(event, sellerIds.map(sellerId => ({
    user_id: sellerId as string,
    order_id: newOrder.id,
    title: 'New Order Received! 🌾',
    message: 'A customer has checked out items from your shop. Please review and accept.',
  })))

  return {
    success: true,
    order_id: newOrder.id,
    total_amount: totalAmount,
  }
})
