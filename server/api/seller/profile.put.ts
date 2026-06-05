import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const shopName = String(body?.shop_name ?? '').trim()

  if (!shopName) {
    throw createError({ statusCode: 400, statusMessage: 'Shop name is required' })
  }

  if (shopName.length > 160) {
    throw createError({ statusCode: 400, statusMessage: 'Shop name must be 160 characters or fewer' })
  }

  const supabase = await serverSupabaseClient(event)
  const { data: seller, error } = await supabase
    .from('users')
    .update({ shop_name: shopName })
    .eq('id', user.id)
    .eq('role', 'seller')
    .select('id, full_name, email, role, shop_name, created_at')
    .single()

  if (error) {
    const message = error.code === '23505' ? 'Shop name is already taken' : 'Failed to update shop profile'
    throw createError({ statusCode: error.code === '23505' ? 409 : 500, statusMessage: message })
  }

  return { seller }
})
