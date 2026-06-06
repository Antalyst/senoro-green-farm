export interface AuthUser {
  id: string
  full_name: string
  email: string
  role: string
  shop_name?: string
  shop_avatar_url?: string
  shop_banner_url?: string
}

// Global reactive user state — shared across all components
const useUserState = () => useState<AuthUser | null>('auth:user', () => null)
const useAuthLoading = () => useState<boolean>('auth:loading', () => false)
const useAuthInitialized = () => useState<boolean>('auth:initialized', () => false)

// LS key for Capacitor native fallback
const LS_KEY = 'sgf_auth_user'
const TOKEN_KEY = 'sgf_auth_token'

export function useAuth() {
  const user = useUserState()
  const loading = useAuthLoading()
  const initialized = useAuthInitialized()

  const isLoggedIn = computed(() => !!user.value)
  const role = computed(() => user.value?.role ?? null)

  /** Persist user to localStorage (Capacitor native fallback) */
  function persistToLocal(u: AuthUser | null) {
    if (import.meta.client) {
      if (u) {
        localStorage.setItem(LS_KEY, JSON.stringify(u))
      }
      else {
        localStorage.removeItem(LS_KEY)
      }
    }
  }

  /** Restore from localStorage (used when cookie isn't available natively) */
  function restoreFromLocal(): AuthUser | null {
    if (import.meta.client) {
      try {
        const raw = localStorage.getItem(LS_KEY)
        return raw ? JSON.parse(raw) : null
      }
      catch {
        return null
      }
    }
    return null
  }

  /**
   * Fetch current user from the server (/api/auth/me).
   * Falls back to localStorage if the server call fails (Capacitor).
   */
  async function fetchUser() {
    if (initialized.value) return

    loading.value = true
    try {
      const api = useApiFetch()
      const data = await api<{ user: AuthUser }>('/api/auth/me')
      user.value = data.user
      persistToLocal(data.user)
    }
    catch {
      // Server call failed — try localStorage fallback (native Capacitor context)
      const local = restoreFromLocal()
      user.value = local
    }
    finally {
      loading.value = false
      initialized.value = true
    }
  }

  /**
   * Log in with email + password.
   */
  async function login(email: string, password: string) {
    loading.value = true
    try {
      const api = useApiFetch()
      const data = await api<{ success: boolean; token: string; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      user.value = data.user
      persistToLocal(data.user)
      if (import.meta.client && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token)
      }
      return data.user
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Register a new account.
   */
  async function register(full_name: string, email: string, password: string, role: string) {
    loading.value = true
    try {
      const api = useApiFetch()
      const data = await api<{
        success: boolean
        token?: string
        pendingApproval?: boolean
        message?: string
        user: AuthUser
      }>('/api/auth/register', {
        method: 'POST',
        body: { full_name, email, password, role },
      })

      if (data.pendingApproval) {
        return { ...data.user, pendingApproval: true as const, message: data.message }
      }

      user.value = data.user
      persistToLocal(data.user)
      if (import.meta.client && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token)
      }
      return data.user
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Log out — clears server cookie and local state.
   */
  async function logout() {
    try {
      const api = useApiFetch()
      await api('/api/auth/logout', { method: 'POST' })
    }
    catch { /* ignore */ }
    finally {
      user.value = null
      initialized.value = false
      persistToLocal(null)
      if (import.meta.client) {
        localStorage.removeItem(TOKEN_KEY)
      }
    }
  }

  /** Get the dashboard route for a given role */
  function dashboardRoute(r?: string | null): string {
    const roleMap: Record<string, string> = {
      admin: '/admin/dashboard',
      seller: '/seller/dashboard',
      buyer: '/',
      delivery: '/delivery/dashboard',
    }
    return roleMap[r ?? ''] ?? '/auth/login'
  }

  return {
    user: readonly(user),
    isLoggedIn,
    role,
    loading: readonly(loading),
    initialized: readonly(initialized),
    fetchUser,
    login,
    register,
    logout,
    dashboardRoute,
  }
}
