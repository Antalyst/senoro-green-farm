import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'

// Saves the shop's payment account (GCash / Maya / bank + QR image).
// Body: { payout_method, payout_account_name, payout_account_number, payout_bank_name?, payout_qr_url? }
// Send { payout_method: null } to remove it; the shop then takes COD only.
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const account = parsePayoutAccount(body)

  const supabase = await serverSupabaseClient(event)
  const { data, error } = await supabase
    .from('users')
    .update(account)
    .eq('id', user.id)
    .eq('role', 'seller')
    .select(PAYOUT_COLUMNS)
    .single()

  if (isMissingPaymentSchema(error)) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Online payment is not available yet. Ask the admin to run database migration 017.',
    })
  }
  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to save payment account' })
  }

  return { payout: data, online_payment: hasOnlinePayout(data) }
})
