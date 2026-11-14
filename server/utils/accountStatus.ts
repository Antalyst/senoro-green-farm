// Admin block / soft delete (migration 018).
// - Blocked: the person cannot sign in or use the app until the admin unblocks them.
// - Deleted (soft): same, and the account is hidden from normal lists; the row stays so the admin
//   can restore it and old orders keep their names.
// A blocked or deleted seller's products are hidden from the shop and cannot be bought.

type Db = { from: (table: string) => any }

export interface AccountStatus {
  blocked_at: string | null
  blocked_reason: string | null
  deleted_at: string | null
}

export const ACCOUNT_STATUS_COLUMNS = 'blocked_at, blocked_reason, deleted_at'

/** True when migration 018 has not been run yet (missing columns). */
export function isMissingAccountStatusSchema(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false
  return ['42703', 'PGRST204'].includes(error.code ?? '') || /blocked_at|blocked_reason|deleted_at/.test(error.message ?? '')
}

// Small per-server cache so checking every request stays cheap. An admin change shows up
// within CACHE_MS on other servers (and at once on the server that made it).
const CACHE_MS = 30_000
const statusCache = new Map<string, { at: number; status: AccountStatus | null }>()
let hiddenSellersCache: { at: number; ids: Set<string> } | null = null

export function forgetAccountStatus(userId?: string) {
  if (userId) statusCache.delete(userId)
  else statusCache.clear()
  hiddenSellersCache = null
}

/** Block / delete state of one account, or null when the account is fine (or before migration 018). */
export async function loadAccountStatus(supabase: Db, userId: string, { fresh = false } = {}): Promise<AccountStatus | null> {
  const cached = statusCache.get(userId)
  if (!fresh && cached && Date.now() - cached.at < CACHE_MS) return cached.status

  const { data, error } = await supabase
    .from('users')
    .select(ACCOUNT_STATUS_COLUMNS)
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    if (!isMissingAccountStatusSchema(error)) console.error('[account-status]', error.message)
    return null
  }

  const status = data && (data.blocked_at || data.deleted_at) ? data as AccountStatus : null
  statusCache.set(userId, { at: Date.now(), status })
  if (statusCache.size > 5000) statusCache.clear()
  return status
}

/** The error a blocked or deleted account gets. `data.account_status` tells the app to sign out. */
export function accountStatusError(status: AccountStatus) {
  if (status.deleted_at) {
    return createError({
      statusCode: 401,
      statusMessage: 'This account was deleted by the admin.',
      data: { account_status: 'deleted' },
    })
  }
  const reason = status.blocked_reason ? ` Reason: ${status.blocked_reason}` : ''
  return createError({
    statusCode: 403,
    statusMessage: `Your account is blocked by the admin.${reason}`,
    data: { account_status: 'blocked' },
  })
}

/** Ids of sellers who are blocked or deleted (their products are hidden). Empty before migration 018. */
export async function hiddenSellerIds(supabase: Db): Promise<Set<string>> {
  if (hiddenSellersCache && Date.now() - hiddenSellersCache.at < CACHE_MS) return hiddenSellersCache.ids

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'seller')
    .or('blocked_at.not.is.null,deleted_at.not.is.null')

  if (error) {
    if (!isMissingAccountStatusSchema(error)) console.error('[hidden-sellers]', error.message)
    return new Set()
  }

  const ids = new Set<string>((data ?? []).map((row: { id: string }) => row.id))
  hiddenSellersCache = { at: Date.now(), ids }
  return ids
}

/** Removes products whose seller is blocked or deleted (seller from `seller_id` or the joined `users`). */
export async function withoutHiddenSellers<T extends { seller_id?: string | null; users?: unknown }>(supabase: Db, products: T[]): Promise<T[]> {
  if (!products.length) return products
  const hidden = await hiddenSellerIds(supabase)
  if (!hidden.size) return products
  return products.filter((p) => {
    const sellerId = p.seller_id ?? (p.users as { id?: string } | null | undefined)?.id
    return !sellerId || !hidden.has(sellerId)
  })
}

/** Throws 404 when the seller is blocked or deleted (shop page, product page, cart, checkout). */
export async function assertSellerVisible(supabase: Db, sellerId: string | null | undefined, message = 'This shop is not available right now.') {
  if (!sellerId) return
  const hidden = await hiddenSellerIds(supabase)
  if (hidden.has(sellerId)) throw createError({ statusCode: 404, statusMessage: message })
}
