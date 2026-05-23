export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export interface TimelineStep {
  key: string
  label: string
  description: string
  done: boolean
  active: boolean
}

const STATUS_RANK: Record<OrderStatus, number> = {
  pending: 0,
  processing: 1,
  ready_for_pickup: 2,
  out_for_delivery: 3,
  delivered: 4,
  cancelled: -1,
}

const STEPS: { key: OrderStatus; label: string; description: string }[] = [
  { key: 'pending', label: 'Order placed', description: 'Payment received and order logged' },
  { key: 'processing', label: 'Packed by farmer', description: 'Seller is preparing your harvest' },
  { key: 'ready_for_pickup', label: 'Ready for pickup', description: 'Waiting for courier assignment' },
  { key: 'out_for_delivery', label: 'Out for delivery', description: 'Courier is on the way' },
  { key: 'delivered', label: 'Delivered', description: 'Parcel received successfully' },
]

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  ready_for_pickup: 'Ready for pickup',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export function useOrderTimeline(status: MaybeRefOrGetter<string>) {
  const steps = computed<TimelineStep[]>(() => {
    const current = toValue(status) as OrderStatus
    const rank = STATUS_RANK[current] ?? 0
    return STEPS.map((step) => {
      const stepRank = STATUS_RANK[step.key]
      const done = rank >= stepRank
      const active = rank === stepRank
      return { ...step, done, active }
    })
  })

  const statusLabel = computed(() => STATUS_LABELS[toValue(status)] ?? toValue(status))

  return { steps, statusLabel }
}
