const ADDRESS_REQUIRED_MESSAGE =
  'Shipping Address Required. Please add a delivery address to your profile before completing your purchase.'

export function useShippingAddressGuard() {
  const api = useApiFetch()
  const router = useRouter()

  async function fetchAddresses() {
    const response = await api<{ addresses?: { id: string }[] }>('/api/buyer/addresses')
    return response?.addresses ?? []
  }

  async function hasSavedAddresses() {
    const addresses = await fetchAddresses()
    return addresses.length > 0
  }

  /**
   * Returns true when checkout may proceed; false when blocked (redirects to addresses).
   */
  async function requireAddressOrRedirect(notify?: (message: string) => void) {
    try {
      const addresses = await fetchAddresses()
      if (addresses.length > 0) return true

      notify?.(ADDRESS_REQUIRED_MESSAGE)
      await router.push({ path: '/buyer/profile/addresses', query: { required: '1' } })
      return false
    }
    catch {
      notify?.('Unable to verify your delivery addresses. Please try again.')
      return false
    }
  }

  return {
    ADDRESS_REQUIRED_MESSAGE,
    hasSavedAddresses,
    requireAddressOrRedirect,
  }
}
