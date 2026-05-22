export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware on server (ssr: false, but guard is defensive)
  if (import.meta.server) return

  const { user, isLoggedIn, fetchUser, initialized, dashboardRoute } = useAuth()

  // Hydrate user state on first navigation
  if (!initialized.value) {
    await fetchUser()
  }

  const path = to.path
  const PUBLIC_ROUTES = ['/auth/login', '/auth/register']

  // Allow public routes always
  if (PUBLIC_ROUTES.includes(path)) {
    // If already logged in, bounce to their dashboard
    if (isLoggedIn.value && user.value) {
      return navigateTo(dashboardRoute(user.value.role))
    }
    return
  }

  // Not authenticated — redirect to login
  if (!isLoggedIn.value) {
    return navigateTo('/auth/login')
  }

  const userRole = user.value?.role ?? ''

  // Role → allowed path prefix map
  const ROLE_PREFIXES: Record<string, string> = {
    admin: '/admin',
    seller: '/seller',
    buyer: '/buyer',
    delivery: '/delivery',
  }

  const allowedPrefix = ROLE_PREFIXES[userRole]

  // If accessing a role-prefixed route that doesn't match their role
  const PROTECTED_PREFIXES = Object.values(ROLE_PREFIXES)
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => path.startsWith(prefix))

  if (isProtectedRoute && allowedPrefix && !path.startsWith(allowedPrefix)) {
    // Wrong role — redirect to their own dashboard
    return navigateTo(dashboardRoute(userRole))
  }

  // Root path — redirect to their dashboard
  if (path === '/') {
    return navigateTo(dashboardRoute(userRole))
  }
})
