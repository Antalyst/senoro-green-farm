import { DELIVERY_PROVINCE_CODE, fetchBarangays } from '../../../utils/psgc'

export default defineCachedEventHandler(async (event) => {
  const cityCode = getRouterParam(event, 'cityCode') ?? ''

  // Only allow cities inside the delivery province (first 4 digits of a PSGC code = region + province).
  if (!/^\d{9}$/.test(cityCode) || !cityCode.startsWith(DELIVERY_PROVINCE_CODE.slice(0, 4))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid city code' })
  }

  return { barangays: await fetchBarangays(cityCode) }
}, {
  maxAge: 60 * 60 * 24,
  name: 'psgc-barangays',
  getKey: event => getRouterParam(event, 'cityCode') ?? '',
})
