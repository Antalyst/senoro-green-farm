import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'buyer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const { product_id, quantity = 1, is_update = false } = body ?? {}

  if (!product_id) {
    throw createError({ statusCode: 400, statusMessage: 'product_id is required' })
  }

  const supabase = await serverSupabaseClient(event)

  // Fetch product stock to validate
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('stock')
    .eq('id', product_id)
    .single()

  if (productError || !product) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  // Check if item already exists in cart
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('buyer_id', user.id)
    .eq('product_id', product_id)
    .maybeSingle()

  let finalQuantity = quantity

  if (existing && !is_update) {
    // Increment mode: add requested quantity to existing quantity
    finalQuantity = existing.quantity + quantity
  }
  // If is_update is true, finalQuantity is the absolute value passed in

  // Validate against stock
  if (finalQuantity > product.stock) {
    throw createError({
      statusCode: 400,
      statusMessage: `Only ${product.stock} unit(s) available in stock`
    })
  }

  if (finalQuantity < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Quantity must be at least 1' })
  }

  const { data, error } = await supabase
    .from('cart_items')
    .upsert(
      { buyer_id: user.id, product_id, quantity: finalQuantity },
      { onConflict: 'buyer_id, product_id' }
    )
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to add to cart' })
  }

  return { cart_item: data }
})
