import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

// Sends a chat message on an order to one other person (buyer <-> shop, or buyer <-> rider).
// JSON body:      { order_id, receiver_id, message_text }
// Multipart form: order_id, receiver_id, message_text (optional), image (JPG/PNG/WebP, max 5 MB)
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const supabase = await serverSupabaseClient(event)

  const isMultipart = (getHeader(event, 'content-type') || '').includes('multipart/form-data')
  const parts = isMultipart ? await readMultipartFormData(event) : undefined
  const body = isMultipart ? multipartFields(parts) : (await readBody(event)) ?? {}

  const orderId = String(body.order_id ?? '')
  const receiverId = String(body.receiver_id ?? '')
  const text = String(body.message_text ?? '').trim()
  const hasImage = !!parts?.some(p => p.name === 'image' && p.filename !== undefined)

  if (!orderId || !receiverId || (!text && !hasImage)) {
    throw createError({ statusCode: 400, statusMessage: 'Write a message or attach a photo.' })
  }
  if (text.length > 1000) {
    throw createError({ statusCode: 400, statusMessage: 'Message exceeds 1000 characters.' })
  }

  const access = await loadOrderChatAccess(supabase, orderId, user.id)
  const thread = assertChatPartner(access, receiverId)
  const locked = chatOpenReason(thread, access.order)
  if (locked) {
    throw createError({ statusCode: 403, statusMessage: locked })
  }

  const image = hasImage ? readImagePart(parts, 'image', 'The photo') : null
  const imagePath = image ? await storeChatImage(event, orderId, user.id, image) : null

  const row: Record<string, unknown> = {
    order_id: orderId,
    sender_id: user.id,
    receiver_id: receiverId,
    message_text: text,
  }
  if (imagePath) Object.assign(row, { image_path: imagePath, kind: 'image' })

  const { data: saved, error: msgErr } = await supabase.from('messages').insert(row).select().single()

  if (msgErr || !saved) {
    console.error('[chat] insert failed:', msgErr?.code, msgErr?.message)
    await removeChatImages(event, [imagePath])
    if (isMissingPaymentSchema(msgErr)) {
      throw createError({ statusCode: 503, statusMessage: 'Photos in chat need a database update (migration 017).' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Failed to send message. Please try again.' })
  }

  const [message] = await withImageUrls(event, [saved])

  const titles: Record<string, string> = {
    buyer: 'New Message from Buyer! 🌾',
    seller: 'New Message from Shop! 🏪',
    rider: 'New Message from Rider! 🛵',
  }
  const preview = text ? (text.length > 45 ? `${text.slice(0, 42)}...` : text) : '📷 Sent a photo'
  await notify(event, [{ user_id: receiverId, order_id: orderId, title: titles[access.side]!, message: preview }])

  await broadcastChatMessage(supabase, orderId, user.id, receiverId, message)

  return { success: true, data: message }
})
