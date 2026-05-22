export default defineEventHandler((event) => {
  // Clear the auth cookie
  deleteCookie(event, 'auth_token', {
    path: '/',
    sameSite: 'lax',
  })

  return { ok: true }
})
