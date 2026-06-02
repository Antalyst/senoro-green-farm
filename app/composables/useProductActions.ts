export function useProductActions() {
  const api = useApiFetch()
  const router = useRouter()
  const route = useRoute()
  const { isLoggedIn } = useAuth()
  const { requireAddressOrRedirect } = useShippingAddressGuard()
  const refreshCartCount = inject<(() => void) | undefined>('refreshCartCount')

  function redirectToLogin() {
    return router.push({ path: '/auth/login', query: { redirect: route.fullPath } })
  }

  async function addToCart(productId: string, quantity = 1) {
    if (!isLoggedIn.value) {
      await redirectToLogin()
      return false
    }

    await api('/api/cart/add', {
      method: 'POST',
      body: { product_id: productId, quantity },
    })
    refreshCartCount?.()
    return true
  }

  async function buyNow(productId: string, quantity = 1) {
    if (!isLoggedIn.value) {
      await redirectToLogin()
      return false
    }

    const canProceed = await requireAddressOrRedirect()
    if (!canProceed) return false

    await api('/api/cart/add', {
      method: 'POST',
      body: { product_id: productId, quantity },
    })
    refreshCartCount?.()
    await router.push('/buyer/cart')
    return true
  }

  return { addToCart, buyNow }
}
