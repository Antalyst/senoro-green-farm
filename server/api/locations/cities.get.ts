import { fetchDeliveryCities } from '../../utils/psgc'

// Location lists rarely change, so cache for one day.
export default defineCachedEventHandler(async () => {
  return { cities: await fetchDeliveryCities() }
}, { maxAge: 60 * 60 * 24, name: 'psgc-cities' })
