import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const caller = requireAuth(event)
  if (caller.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — admin only' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, approval_status, created_at, selfie_path, id_document_path, id_type, verification_submitted_at')
    .eq('approval_status', 'pending')
    .in('role', ['buyer', 'seller', 'delivery'])
    .order('created_at', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch pending approvals' })
  }

  const rows = users ?? []
  // Selfies and IDs live in a private bucket; hand the admin links that expire in 10 minutes.
  const paths = rows.flatMap(u => [u.selfie_path, u.id_document_path]).filter((p): p is string => !!p)
  const urls = await signedVerificationUrls(event, paths)

  return {
    users: rows.map(({ selfie_path, id_document_path, ...u }) => ({
      ...u,
      selfie_url: selfie_path ? urls.get(selfie_path) ?? null : null,
      id_document_url: id_document_path ? urls.get(id_document_path) ?? null : null,
    })),
  }
})
