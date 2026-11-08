// Shared wording for payments, so every screen says the same thing.
//
// Who pays a shop:
// - online: the buyer (QR + receipt in the buyer <-> shop chat)
// - cod:    the rider who accepted the job (QR + receipt in the rider <-> shop chat, or cash at the shop);
//           the buyer then pays the rider in cash at the door.

type PaymentLike = { method: string; status: string } | null | undefined

export const PAYOUT_LABELS: Record<string, string> = {
  gcash: 'GCash',
  maya: 'Maya',
  bank: 'Bank transfer',
}

export function payoutLabel(method: string | null | undefined) {
  return method ? PAYOUT_LABELS[method] ?? method : 'Online'
}

/** Short status text for a shop payment. */
export function paymentStatusLabel(payment: PaymentLike) {
  if (!payment) return 'Cash on delivery'
  if (payment.method === 'cod') {
    switch (payment.status) {
      case 'rider_paid': return 'COD · rider paid shop'
      case 'submitted': return 'COD · rider receipt sent'
      case 'rejected': return 'COD · rider receipt not accepted'
      default: return 'COD · waiting for rider'
    }
  }
  switch (payment.status) {
    case 'awaiting_payment': return 'Waiting for payment'
    case 'submitted': return 'Receipt sent · checking'
    case 'confirmed': return 'Paid'
    case 'rejected': return 'Receipt not accepted'
    default: return payment.status
  }
}

/** Badge colors (flat, no glow). */
export function paymentBadgeClass(payment: PaymentLike) {
  if (!payment) return 'bg-gray-100 text-gray-600'
  switch (payment.status) {
    case 'confirmed':
    case 'rider_paid': return 'bg-farm-light text-farm-deep'
    case 'submitted': return 'bg-amber-50 text-amber-700'
    case 'rejected': return 'bg-red-50 text-red-600'
    case 'cod_unpaid': return 'bg-gray-100 text-gray-600'
    default: return 'bg-orange-50 text-market-orange'
  }
}

/** True when the buyer still has to pay (or pay again) this shop online. */
export function buyerMustPay(payment: PaymentLike) {
  return !!payment && payment.method === 'online' && (payment.status === 'awaiting_payment' || payment.status === 'rejected')
}

/** True when the rider still has to pay (or pay again) this COD shop. */
export function riderMustPay(payment: PaymentLike) {
  return !!payment && payment.method === 'cod' && (payment.status === 'cod_unpaid' || payment.status === 'rejected')
}

/** True when the shop has been paid and can accept / pack its part. */
export function shopIsPaid(payment: PaymentLike) {
  if (!payment) return true
  return payment.method === 'online' ? payment.status === 'confirmed' : payment.status === 'rider_paid'
}
