import { serverSupabaseClient } from '#supabase/server'

// (Re)submit the selfie and ID photo, e.g. after a rejection or for an older pending
// account that never sent them. Puts the account back in the admin's queue.
export default defineEventHandler(async (event) => {
  const session = requireAuth(event, { allowUnverified: true })
  const supabase = await serverSupabaseClient(event)

  const { data: current, error: fetchError } = await supabase
    .from('users')
    .select('approval_status, selfie_path, id_document_path')
    .eq('id', session.id)
    .maybeSingle()

  if (fetchError || !current) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load your account' })
  }
  if (current.approval_status === 'approved') {
    throw createError({ statusCode: 400, statusMessage: 'Your account is already verified.' })
  }

  const parts = await readMultipartFormData(event)
  const idType = multipartFields(parts).id_type?.trim().slice(0, 60)
  if (!idType) {
    throw createError({ statusCode: 400, statusMessage: 'Please choose the type of ID you are uploading.' })
  }
  const selfie = readImagePart(parts, 'selfie', 'Your selfie')
  const idPhoto = readImagePart(parts, 'id_document', 'Your ID photo')

  const selfiePath = await storeVerificationPhoto(event, session.id, 'selfie', selfie)
  let idPath: string
  try {
    idPath = await storeVerificationPhoto(event, session.id, 'id', idPhoto)
  }
  catch (err) {
    await removeVerificationPhotos(event, [selfiePath])
    throw err
  }

  const { error } = await supabase
    .from('users')
    .update({
      approval_status: 'pending',
      selfie_path: selfiePath,
      id_document_path: idPath,
      id_type: idType,
      verification_submitted_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', session.id)

  if (error) {
    await removeVerificationPhotos(event, [selfiePath, idPath])
    throw createError({ statusCode: 500, statusMessage: 'Failed to save your verification photos' })
  }

  // Old photos are no longer needed once the new ones are saved.
  await removeVerificationPhotos(event, [current.selfie_path, current.id_document_path])

  return { ok: true, approval_status: 'pending' }
})
