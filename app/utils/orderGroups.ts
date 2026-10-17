// Buyer-facing order groups (Shopee style). Used by the profile shortcuts and the orders page tabs.
export const ORDER_GROUPS = [
  { key: 'to_confirm', label: 'To confirm', icon: 'heroicons:clock', statuses: ['pending'] },
  { key: 'preparing', label: 'Preparing', icon: 'heroicons:archive-box', statuses: ['processing'] },
  { key: 'to_receive', label: 'To receive', icon: 'heroicons:truck', statuses: ['ready_for_pickup', 'out_for_delivery'] },
  { key: 'completed', label: 'Completed', icon: 'heroicons:check-badge', statuses: ['delivered'] },
] as const

export type OrderGroupKey = typeof ORDER_GROUPS[number]['key']

export function orderGroupFor(key: unknown) {
  return ORDER_GROUPS.find(g => g.key === key) ?? null
}

export function countOrdersByGroup(orders: { status: string }[]) {
  return Object.fromEntries(
    ORDER_GROUPS.map(g => [g.key, orders.filter(o => (g.statuses as readonly string[]).includes(o.status)).length]),
  ) as Record<OrderGroupKey, number>
}
