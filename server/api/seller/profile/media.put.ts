import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: Seller access required' })
  }

  const supabase = await serverSupabaseClient(event)
  
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || currentUser?.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: Seller access required' })
  }

  const body = await readBody(event)
  const { shop_name, shop_avatar_url, shop_banner_url } = body

  const { data, error } = await supabase
    .from('users')
    .update({ 
      shop_name, 
      shop_avatar_url, 
      shop_banner_url 
    })
    .eq('id', user.id)
    .select()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { success: true, data }
})
