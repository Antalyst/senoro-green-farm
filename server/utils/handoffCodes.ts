import { createHmac, timingSafeEqual } from 'node:crypto'

// Signed handoff codes for the QR flow.
// - Pickup code: printed on each shop's receipt; the rider scans it at the shop.
// - Delivery code: shown on the buyer's order page; the rider scans it at the door.
// Codes are HMACs of the order (and seller), so they cannot be guessed or forged.

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I, easy to type

function signCode(input: string): string {
  const secret = useRuntimeConfig().jwtSecret as string
  const digest = createHmac('sha256', secret).update(`nfwm-handoff:${input}`).digest()
  let code = ''
  for (let i = 0; i < 8; i++) code += ALPHABET[digest[i]! % ALPHABET.length]
  return code
}

export const pickupCode = (orderId: string, sellerId: string) => signCode(`pickup:${orderId}:${sellerId}`)
export const deliveryCode = (orderId: string) => signCode(`deliver:${orderId}`)

export const pickupQrPayload = (orderId: string, sellerId: string) =>
  `NFWM:P:${orderId}:${sellerId}:${pickupCode(orderId, sellerId)}`
export const deliveryQrPayload = (orderId: string) =>
  `NFWM:D:${orderId}:${deliveryCode(orderId)}`

/** "ABCD2345" -> "ABCD-2345" for printing. */
export function displayCode(code: string) {
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

/** Normalizes typed codes: uppercase, no spaces or dashes. */
export function normalizeCode(input: unknown) {
  return String(input ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function codesMatch(a: string, b: string) {
  const x = Buffer.from(normalizeCode(a))
  const y = Buffer.from(normalizeCode(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

export type HandoffScan =
  | { type: 'pickup'; orderId: string; sellerId: string; code: string }
  | { type: 'delivery'; orderId: string; code: string }

export function parseHandoffPayload(text: unknown): HandoffScan | null {
  const parts = String(text ?? '').trim().split(':')
  if (parts[0] !== 'NFWM') return null
  if (parts[1] === 'P' && parts.length === 5) return { type: 'pickup', orderId: parts[2]!, sellerId: parts[3]!, code: parts[4]! }
  if (parts[1] === 'D' && parts.length === 4) return { type: 'delivery', orderId: parts[2]!, code: parts[3]! }
  return null
}
