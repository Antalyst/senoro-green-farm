import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = query.category as string
  const search = query.search as string

  const supabase = await serverSupabaseClient(event)
  
  let req = supabase
    .from('products')
    .select('id, name, description, price, stock, category, image_url, users!seller_id(id, full_name)')
    .order('created_at', { ascending: false })

  if (category) {
    req = req.eq('category', category)
  }
  if (search) {
    req = req.ilike('name', `%${search}%`)
  }

  const { data: products, error } = await req

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch products' })
  }

  return { products }
})
