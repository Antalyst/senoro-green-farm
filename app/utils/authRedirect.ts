import type { LocationQuery } from 'vue-router'

/**
 * Where a buyer goes after login/register: back to the page that sent them (e.g. "Add to cart"
 * as a guest), or null. Only same-site paths are allowed, so a link cannot send users elsewhere.
 */
export function buyerReturnPath(query: LocationQuery): string | null {
  const redirect = query.redirect
  if (typeof redirect !== 'string') return null
  if (!redirect.startsWith('/') || redirect.startsWith('//') || redirect.startsWith('/auth')) return null
  return redirect
}
