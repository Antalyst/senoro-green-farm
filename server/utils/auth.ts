import { createHmac, timingSafeEqual } from 'node:crypto'

export interface UserPayload {
  id: string
  full_name: string
  email: string
  role: string
}

interface JwtHeader {
  alg: string
  typ: string
}

interface JwtPayload extends UserPayload {
  iat: number
  exp: number
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function base64UrlDecode(str: string): string {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4)
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
}

function getSecret(): string {
  const config = useRuntimeConfig()
  return config.jwtSecret as string
}

/**
 * Signs a JWT token with HS256 algorithm containing the user payload.
 * Token expires in 7 days.
 */
export function signToken(payload: UserPayload): string {
  const secret = getSecret()

  const header: JwtHeader = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const jwtPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + 60 * 60 * 24 * 7, // 7 days
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload))
  const signingInput = `${encodedHeader}.${encodedPayload}`

  const signature = createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return `${signingInput}.${signature}`
}

/**
 * Verifies a JWT token and returns the decoded user payload.
 * Throws an error if the token is invalid or expired.
 */
export function verifyToken(token: string): UserPayload {
  const secret = getSecret()

  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid token format')
  }

  const [encodedHeader, encodedPayload, signature] = parts
  const signingInput = `${encodedHeader}.${encodedPayload}`

  // Verify signature
  const expectedSig = createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSig)

  if (
    sigBuffer.length !== expectedBuffer.length
    || !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid token signature')
  }

  // Decode payload
  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtPayload

  // Check expiration
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp < now) {
    throw new Error('Token expired')
  }

  return {
    id: payload.id,
    full_name: payload.full_name,
    email: payload.email,
    role: payload.role,
  }
}

/**
 * Helper to extract and verify the auth token from the request cookie.
 * Returns the user payload or throws.
 */
export function requireAuth(event: Parameters<typeof getCookie>[0]): UserPayload {
  let token = getCookie(event, 'auth_token')

  if (!token) {
    const authHeader = getHeader(event, 'authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  try {
    return verifyToken(token)
  }
  catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired session' })
  }
}
