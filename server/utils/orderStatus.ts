export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

const SELLER_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'processing',
  processing: 'ready_for_pickup',
}

const DELIVERY_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  ready_for_pickup: 'out_for_delivery',
  out_for_delivery: 'delivered',
}

export function nextStatusForSeller(current: OrderStatus): OrderStatus | null {
  return SELLER_NEXT[current] ?? null
}

export function nextStatusForDelivery(current: OrderStatus): OrderStatus | null {
  return DELIVERY_NEXT[current] ?? null
}

export function assertSellerTransition(current: OrderStatus, target: OrderStatus) {
  if (SELLER_NEXT[current] !== target) {
    throw createError({
      statusCode: 400,
      statusMessage: `Seller cannot transition from ${current} to ${target}`,
    })
  }
}

export function assertDeliveryTransition(current: OrderStatus, target: OrderStatus) {
  if (DELIVERY_NEXT[current] !== target) {
    throw createError({
      statusCode: 400,
      statusMessage: `Delivery cannot transition from ${current} to ${target}`,
    })
  }
}
