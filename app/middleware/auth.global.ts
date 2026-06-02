export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware on server (ssr: false, but guard is defensive)
  if (import.meta.server) return

  const auth = useAuth()

  // Hydrate user state on first navigation
  if (!auth.initialized?.value) {
    await auth.fetchUser()
  }

  const path = to.path
  const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/', '/buyer/categories']
  const PUBLIC_PREFIXES = ['/buyer/product/', '/buyer/shop/']

  // Allow public routes always
  if (PUBLIC_ROUTES.includes(path) || PUBLIC_PREFIXES.some(prefix => path.startsWith(prefix))) {
    // If already logged in, bounce to their dashboard
    if (path.startsWith('/auth/') && auth.isLoggedIn?.value && auth.user?.value) {
      return navigateTo(auth.dashboardRoute(auth.user.value.role))
    }
    return
  }

  // Not authenticated — redirect to login
  if (!auth.isLoggedIn?.value) {
    return navigateTo('/auth/login')
  }

  if (path === '/' && auth.isLoggedIn?.value && auth.user?.value) {
    return navigateTo(auth.dashboardRoute(auth.user.value.role))
  }

  const userRole = auth.user?.value?.role ?? ''

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
    return navigateTo(auth.dashboardRoute(userRole))
  }

  // Root path — redirect to their dashboard
  if (path === '/') {
    return navigateTo(auth.dashboardRoute(userRole))
  }
})
