interface CategoryJoin {
  id?: string
  name?: string
}

interface ProductLike {
  category?: string | null
  category_id?: string | null
  categories?: CategoryJoin | CategoryJoin[] | null
}

function getJoinedCategory(category: ProductLike['categories']): CategoryJoin | null {
  if (Array.isArray(category)) return category[0] ?? null
  return category ?? null
}

export function normalizeProductCategory<T extends ProductLike>(product: T): T & {
  category: string
  category_id: string | null
} {
  const joined = getJoinedCategory(product.categories)

  return {
    ...product,
    category_id: product.category_id ?? joined?.id ?? null,
    category: joined?.name ?? product.category ?? 'Uncategorized',
  }
}

export function normalizeProductCategories<T extends ProductLike>(products: T[] | null | undefined) {
  return (products ?? []).map(product => normalizeProductCategory(product))
}

/** Columns for storefront product lists (home, search, best sellers). */
export const PRODUCT_LIST_SELECT = 'id, name, description, price, stock, category, category_id, image_url, unit_type, users!seller_id(id, full_name, shop_name, shop_avatar_url, shop_banner_url), categories!category_id(id, name)'

/** Adds average_rating (1 decimal) and review_count to each product. */
export async function attachRatings<T extends { id: string }>(
  supabase: { from: (table: string) => any },
  products: T[],
): Promise<(T & { average_rating: number; review_count: number })[]> {
  if (!products.length) return []

  const ids = products.map(p => p.id)
  // Small lists filter by id; very long id lists would make the URL too long, so read all ratings instead.
  let query = supabase.from('reviews').select('product_id, rating')
  if (ids.length <= 150) query = query.in('product_id', ids)
  const { data: reviews, error } = await query
  if (error) console.error('[attachRatings]', error.message)

  const totals = new Map<string, { sum: number; count: number }>()
  for (const r of (reviews ?? []) as { product_id: string; rating: number }[]) {
    const t = totals.get(r.product_id) ?? { sum: 0, count: 0 }
    t.sum += Number(r.rating)
    t.count += 1
    totals.set(r.product_id, t)
  }

  return products.map((p) => {
    const t = totals.get(p.id)
    return {
      ...p,
      average_rating: t ? Math.round((t.sum / t.count) * 10) / 10 : 0,
      review_count: t?.count ?? 0,
    }
  })
}
