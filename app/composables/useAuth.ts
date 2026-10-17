export interface AuthUser {
  id: string
  full_name: string
  email: string
  role: string
  /** pending | approved | rejected — only approved accounts get past the verification screen */
  approval_status?: string
  avatar_url?: string | null
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

export const VERIFICATION_ROUTE = '/account/verification'

export function useAuth() {
  const user = useUserState()
  const loading = useAuthLoading()
  const initialized = useAuthInitialized()

  const isLoggedIn = computed(() => !!user.value)
  const role = computed(() => user.value?.role ?? null)
  // Accounts from before identity verification have no status stored locally; treat them as approved.
  const isVerified = computed(() =>
    !!user.value && (user.value.role === 'admin' || (user.value.approval_status ?? 'approved') === 'approved'),
  )

  function storeToken(token?: string) {
    if (import.meta.client && token) {
      localStorage.setItem(TOKEN_KEY, token)
    }
  }

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
  async function fetchUser(force = false) {
    if (initialized.value && !force) return

    loading.value = true
    try {
      const api = useApiFetch()
      // The server sends a new token when the approval status changed since sign-in.
      const data = await api<{ user: AuthUser; token?: string }>('/api/auth/me')
      user.value = data.user
      persistToLocal(data.user)
      storeToken(data.token)
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
      storeToken(data.token)
      return data.user
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Register a new account. The form carries full_name, email, password, role, id_type
   * and the two verification photos (selfie, id_document). New accounts start pending.
   */
  async function register(form: FormData) {
    loading.value = true
    try {
      const api = useApiFetch()
      const data = await api<{ success: boolean; token?: string; user: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: form,
      })

      user.value = data.user
      persistToLocal(data.user)
      storeToken(data.token)
      return data.user
    }
    finally {
      loading.value = false
    }
  }

  /** Merge changes (e.g. a new profile photo) into the signed-in user. */
  function updateUser(patch: Partial<AuthUser>) {
    if (!user.value) return
    user.value = { ...user.value, ...patch }
    persistToLocal(user.value)
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

  /** Where to send a user after sign-in: the verification screen until an admin approves them. */
  function homeRoute(u?: Pick<AuthUser, 'role' | 'approval_status'> | null): string {
    if (u && u.role !== 'admin' && (u.approval_status ?? 'approved') !== 'approved') {
      return VERIFICATION_ROUTE
    }
    return dashboardRoute(u?.role)
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
    isVerified,
    role,
    loading: readonly(loading),
    initialized: readonly(initialized),
    fetchUser,
    login,
    register,
    updateUser,
    logout,
    homeRoute,
    dashboardRoute,
  }
}
