// Order items keep a copy of the product name/image from checkout (migration 014),
// because the live product can be edited or deleted later.
interface OrderItemLike {
  product_name?: string | null
  product_image_url?: string | null
  products?: { name?: string | null; image_url?: string | null; category?: string | null } | null
}

export function orderItemName(item: OrderItemLike): string {
  return item.products?.name || item.product_name || 'Product no longer available'
}

export function orderItemImage(item: OrderItemLike): string {
  return item.products?.image_url || item.product_image_url || fallbackProductImage(item.products?.category)
}
