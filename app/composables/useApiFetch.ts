export function useApiFetch() {
  const config = useRuntimeConfig()
  
  // Detect if we are running in a native Capacitor webview
  const isCapacitor = import.meta.client && typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform()
  
  // If native, force the Vercel base URL. Otherwise, use relative paths for web.
  const baseURL = isCapacitor ? config.public.apiBaseUrl : ''

  // Return a customized fetch instance
  return $fetch.create({
    baseURL: baseURL as string,
    onRequest({ options }) {
      if (import.meta.client) {
        const token = localStorage.getItem('sgf_auth_token')
        if (token) {
          const headers = new Headers(options.headers)
          headers.set('Authorization', `Bearer ${token}`)
          options.headers = headers
        }
      }
    }
  })
}
