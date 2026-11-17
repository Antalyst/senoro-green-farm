import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { parseDay, phDayRange } from '../../utils/salesPeriods'

// Sales details for the seller: which products sold between two Philippine dates (inclusive).
// GET /api/seller/sales?from=2026-11-01&to=2026-11-30
// Cancelled orders are not counted (same rule as the dashboard sales report).
const MAX_DAYS = 400
const MAX_LINES = 5000

interface ProductSale {
  key: string
  product_id: string | null
  name: string
  image_url: string | null
  unit_type: string | null
  quantity: number
  revenue: number
  orders: number
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  if (user.role !== 'seller') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const query = getQuery(event)
  const from = parseDay(query.from)
  const to = parseDay(query.to)
  if (!from || !to) {
    throw createError({ statusCode: 400, statusMessage: 'Choose a start and end date (YYYY-MM-DD).' })
  }
  if (from > to) {
    throw createError({ statusCode: 400, statusMessage: 'The start date must be on or before the end date.' })
  }
  const days = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1
  if (days > MAX_DAYS) {
    throw createError({ statusCode: 400, statusMessage: 'Choose a range of one year or less.' })
  }

  const { start, end } = phDayRange(from, to)
  const supabase = await serverSupabaseClient(event)

  // `*` keeps this working whether or not the product snapshot columns (migration 014) exist.
  const { data, error } = await supabase
    .from('order_items')
    .select('*, orders!inner(status), products(name, image_url, unit_type)')
    .eq('seller_id', user.id)
    .neq('orders.status', 'cancelled')
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: false })
    .limit(MAX_LINES)

  if (error) {
    console.error('[seller/sales]', error.message)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load sales details' })
  }

  const rows = data ?? []
  const byProduct = new Map<string, ProductSale & { orderIds: Set<string> }>()
  const allOrders = new Set<string>()
  let revenue = 0
  let quantity = 0

  for (const row of rows as any[]) {
    const qty = Number(row.quantity) || 0
    const amount = (Number(row.price) || 0) * qty
    const name = row.product_name || row.products?.name || 'Deleted product'
    const key = row.product_id || `name:${name}`

    let entry = byProduct.get(key)
    if (!entry) {
      entry = {
        key,
        product_id: row.product_id ?? null,
        name,
        image_url: row.product_image_url || row.products?.image_url || null,
        unit_type: row.products?.unit_type ?? null,
        quantity: 0,
        revenue: 0,
        orders: 0,
        orderIds: new Set<string>(),
      }
      byProduct.set(key, entry)
    }
    entry.quantity += qty
    entry.revenue += amount
    if (row.order_id) {
      entry.orderIds.add(row.order_id)
      allOrders.add(row.order_id)
    }
    revenue += amount
    quantity += qty
  }

  const round = (n: number) => Math.round(n * 100) / 100
  const products: ProductSale[] = [...byProduct.values()]
    .map(({ orderIds, ...p }) => ({ ...p, revenue: round(p.revenue), orders: orderIds.size }))
    .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)

  return {
    from,
    to,
    totals: { revenue: round(revenue), orders: allOrders.size, quantity, products: products.length },
    products,
    limited: rows.length === MAX_LINES,
  }
})
