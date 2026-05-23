export function useProductActions() {
  const api = useApiFetch()
  const router = useRouter()
  const { requireAddressOrRedirect } = useShippingAddressGuard()
  const refreshCartCount = inject<(() => void) | undefined>('refreshCartCount')

  async function addToCart(productId: string, quantity = 1) {
    await api('/api/cart/add', {
      method: 'POST',
      body: { product_id: productId, quantity },
    })
    refreshCartCount?.()
  }

  async function buyNow(productId: string, quantity = 1) {
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
