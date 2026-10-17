import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

function parseAmount(value: unknown, label: string) {
  const n = Number(value)
  if (value === null || value === '' || !Number.isFinite(n) || n < 0 || n > 100000) {
    throw createError({ statusCode: 400, statusMessage: `${label} must be a number from 0 to 100,000` })
  }
  return Math.round(n * 100) / 100
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — admin only' })
  }

  const body = await readBody(event)
  const rate_per_km = parseAmount(body?.rate_per_km, 'Rate per km')
  const fallback_fee = parseAmount(body?.fallback_fee, 'Fallback fee')

  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('delivery_settings')
    .upsert({ id: 1, rate_per_km, fallback_fee, updated_at: new Date().toISOString() })
    .select('rate_per_km, fallback_fee')
    .single()

  if (error || !data) {
    const missingTable = error?.code === '42P01' || error?.code === 'PGRST205'
    throw createError({
      statusCode: 500,
      statusMessage: missingTable
        ? 'Delivery settings table is missing — run supabase/015_delivery_rate.sql'
        : 'Failed to save delivery settings',
    })
  }

  return { settings: { rate_per_km: Number(data.rate_per_km), fallback_fee: Number(data.fallback_fee) } }
})
