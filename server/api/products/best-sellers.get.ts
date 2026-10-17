import { serverSupabaseClient } from '#supabase/server'
import { PRODUCT_LIST_SELECT, attachRatings, normalizeProductCategories } from '../../utils/productResponse'

// Products ordered by units sold (cancelled orders excluded).
// With no sales yet, returns the newest products so the section is never empty.
export default defineEventHandler(async (event) => {
  const limit = Math.min(Math.max(Number(getQuery(event).limit) || 4, 1), 12)
  const supabase = await serverSupabaseClient(event)

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('product_id, quantity, orders!inner(status)')
    .neq('orders.status', 'cancelled')
    .not('product_id', 'is', null)

  if (itemsError) console.error('[best-sellers]', itemsError.message)

  const sold = new Map<string, number>()
  for (const item of (items ?? []) as { product_id: string; quantity: number }[]) {
    sold.set(item.product_id, (sold.get(item.product_id) ?? 0) + Number(item.quantity))
  }

  const topIds = [...sold.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)

  let products: any[] = []
  if (topIds.length) {
    const { data } = await supabase.from('products').select(PRODUCT_LIST_SELECT).in('id', topIds)
    products = (data ?? []).sort((a: any, b: any) => (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0))
  }

  // Fill up with the newest products (no sales yet, or deleted best sellers).
  if (products.length < limit) {
    const have = new Set(products.map(p => p.id))
    const { data: newest } = await supabase
      .from('products')
      .select(PRODUCT_LIST_SELECT)
      .order('created_at', { ascending: false })
      .limit(limit + products.length)
    products = [...products, ...(newest ?? []).filter((p: any) => !have.has(p.id))].slice(0, limit)
  }

  const withRatings = await attachRatings(supabase, normalizeProductCategories(products))
  return {
    products: withRatings.map(p => ({ ...p, units_sold: sold.get(p.id) ?? 0 })),
  }
})
