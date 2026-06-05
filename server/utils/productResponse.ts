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
