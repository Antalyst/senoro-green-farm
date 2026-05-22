export default defineEventHandler((event) => {
  // requireAuth reads the cookie, verifies JWT, returns user payload or throws 401
  const user = requireAuth(event)
  return { user }
})
