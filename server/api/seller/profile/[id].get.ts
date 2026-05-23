import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Seller ID required' })
  }

  const supabase = await serverSupabaseClient(event)
  
  const { data: seller, error: sellerError } = await supabase
    .from('users')
    .select('id, full_name, email, created_at')
    .eq('id', id)
    .eq('role', 'seller')
    .single()

  if (sellerError || !seller) {
    throw createError({ statusCode: 404, statusMessage: 'Seller not found' })
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, price, stock, category, image_url')
    .eq('seller_id', id)
    .order('created_at', { ascending: false })

  return { seller, products }
})
