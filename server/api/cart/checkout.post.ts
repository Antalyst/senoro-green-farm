import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { quoteDeliveryFee } from '../../utils/deliveryFee'
import type { PaymentMethod } from '../../utils/payments'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const { cart_item_ids, address_id, payment_methods } = body ?? {}

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

  // A shop blocked or deleted by the admin cannot take new orders.
  const hiddenSellers = await hiddenSellerIds(supabase)
  if (sellerIds.some(id => hiddenSellers.has(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A shop in your cart is not available right now. Remove its items and try again.',
    })
  }

  // Each shop's share of the items (what the buyer pays that shop, online or through the rider).
  const shopSubtotals = new Map<string, number>()
  for (const item of cartItems) {
    // @ts-ignore Supabase relation typing is generated as object at runtime.
    const sellerId = item.products.seller_id as string
    // @ts-ignore Supabase relation typing is generated as object at runtime.
    const line = parseFloat(item.products.price) * item.quantity
    shopSubtotals.set(sellerId, (shopSubtotals.get(sellerId) ?? 0) + line)
  }

  // Payment per shop: "online" only if that shop has a GCash / Maya / bank account, otherwise COD.
  const requested = (payment_methods && typeof payment_methods === 'object') ? payment_methods as Record<string, unknown> : {}
  const payouts = await fetchPayoutAccounts(supabase, sellerIds)
  const methodBySeller = new Map<string, PaymentMethod>()
  for (const sellerId of sellerIds) {
    const wanted = requested[sellerId] === 'online' ? 'online' : 'cod'
    if (wanted === 'online' && !hasOnlinePayout(payouts.get(sellerId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'One of the shops no longer accepts online payment. Choose cash on delivery for it.',
      })
    }
    methodBySeller.set(sellerId, wanted)
  }
  const hasOnline = [...methodBySeller.values()].includes('online')

  // Rate per km (set by admin) × distance from each shop to the buyer.
  const { fee: deliveryFee } = await quoteDeliveryFee(supabase, sellerIds, address)
  const totalAmount = Math.round((itemsSubtotal + deliveryFee) * 100) / 100

  const orderRow = {
    buyer_id: user.id,
    total_amount: totalAmount,
    address_id: resolvedAddressId,
    status: 'pending',
  }
  let { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({ ...orderRow, delivery_fee: deliveryFee })
    .select()
    .single()

  // DB without migration 017: save the order without delivery_fee (COD only then).
  if (orderError && isMissingPaymentSchema(orderError) && !hasOnline) {
    ;({ data: newOrder, error: orderError } = await supabase.from('orders').insert(orderRow).select().single())
  }

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
    await supabase.from('orders').delete().eq('id', newOrder.id)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create order items' })
  }

  // One payment row per shop, with a copy of the shop's account at this moment.
  const paymentRows = sellerIds.map((sellerId) => {
    const method = methodBySeller.get(sellerId)!
    const payout = method === 'online' ? payouts.get(sellerId)! : null
    return {
      order_id: newOrder.id,
      seller_id: sellerId,
      method,
      amount: Math.round((shopSubtotals.get(sellerId) ?? 0) * 100) / 100,
      status: method === 'online' ? 'awaiting_payment' : 'cod_unpaid',
      payout_method: payout?.payout_method ?? null,
      payout_account_name: payout?.payout_account_name ?? null,
      payout_account_number: payout?.payout_account_number ?? null,
      payout_bank_name: payout?.payout_bank_name ?? null,
      payout_qr_url: payout?.payout_qr_url ?? null,
    }
  })
  const { error: paymentsError } = await supabase.from('order_payments').insert(paymentRows)

  if (paymentsError && !(isMissingPaymentSchema(paymentsError) && !hasOnline)) {
    // Without payment rows a seller could accept an unpaid online order, so undo the order.
    console.error('[checkout] payment rows failed:', paymentsError.message)
    await supabase.from('order_items').delete().eq('order_id', newOrder.id)
    await supabase.from('orders').delete().eq('id', newOrder.id)
    throw createError({ statusCode: 500, statusMessage: 'Failed to set up payment for this order' })
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
  await notify(event, sellerIds.map((sellerId) => {
    const amount = formatPesoServer(shopSubtotals.get(sellerId) ?? 0)
    return {
      user_id: sellerId,
      order_id: newOrder.id,
      title: 'New Order Received! 🌾',
      message: methodBySeller.get(sellerId) === 'online'
        ? `Online payment of ${amount}. Wait for the buyer's receipt in chat, check it, then accept.`
        : `Cash on delivery: a rider will accept and pay you ${amount} first. Confirm the payment, then accept.`,
    }
  }))

  // COD orders need a rider right away (the rider pays the COD shops before they accept).
  // Only when the payment rows were saved (migration 017); older databases keep the old flow.
  if (!paymentsError && [...methodBySeller.values()].includes('cod')) {
    const { data: riders } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'delivery')
      .eq('approval_status', 'approved')
    const codTotal = paymentRows.filter(p => p.method === 'cod').reduce((sum, p) => sum + p.amount, 0)
    await notify(event, (riders ?? []).map(rider => ({
      user_id: rider.id,
      order_id: newOrder.id,
      title: 'New COD Job! 🛵',
      message: `Pay ${formatPesoServer(codTotal)} to the shop first, then collect it from the buyer.`,
    })))
  }

  const payNow = paymentRows.filter(p => p.method === 'online').reduce((sum, p) => sum + p.amount, 0)

  return {
    success: true,
    order_id: newOrder.id,
    total_amount: totalAmount,
    delivery_fee: deliveryFee,
    pay_online: Math.round(payNow * 100) / 100,
    pay_at_door: Math.round((totalAmount - payNow) * 100) / 100,
  }
})
