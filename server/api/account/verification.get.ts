import { serverSupabaseClient } from '#supabase/server'

// Status for the "pending verification" screen. Never returns the photos themselves.
export default defineEventHandler(async (event) => {
  const session = requireAuth(event, { allowUnverified: true })
  const supabase = await serverSupabaseClient(event)

  const { data: row, error } = await supabase
    .from('users')
    .select('approval_status, selfie_path, id_document_path, id_type, verification_submitted_at, rejection_reason')
    .eq('id', session.id)
    .maybeSingle()

  if (error || !row) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load verification status' })
  }

  return {
    approval_status: row.approval_status,
    has_selfie: !!row.selfie_path,
    has_id_document: !!row.id_document_path,
    id_type: row.id_type,
    submitted_at: row.verification_submitted_at,
    rejection_reason: row.approval_status === 'rejected' ? row.rejection_reason : null,
  }
})
