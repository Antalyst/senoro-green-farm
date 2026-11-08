import type { H3Event } from 'h3'
import { signedChatImageUrls } from './imageUpload'

type Db = { from: (table: string) => any }

/** Realtime channel for one pair of people on one order (so other people on the order don't get it). */
export function chatChannelName(orderId: string, a: string, b: string) {
  const [x, y] = [a, b].sort()
  return `order-chat:${orderId}:${x}:${y}`
}

/** Messages between two people on one order, oldest first. */
export async function fetchPairMessages(supabase: Db, orderId: string, me: string, partner: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('order_id', orderId)
    .or(`and(sender_id.eq.${me},receiver_id.eq.${partner}),and(sender_id.eq.${partner},receiver_id.eq.${me})`)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[chat] load failed:', error.message)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load chat history.' })
  }
  return data ?? []
}

/** Swaps private storage paths for links that expire, and never sends the raw path. */
export async function withImageUrls(event: H3Event, rows: any[]) {
  const paths = rows.map(r => r.image_path).filter((p): p is string => !!p)
  const urls = paths.length ? await signedChatImageUrls(event, paths) : new Map<string, string>()
  return rows.map(({ image_path, ...row }) => ({
    ...row,
    kind: row.kind ?? 'text',
    image_url: image_path ? urls.get(image_path) ?? null : null,
  }))
}

/** Sends a new message to the pair's realtime channel. Best effort: the message is already saved. */
export async function broadcastChatMessage(supabase: any, orderId: string, a: string, b: string, message: any) {
  const channel = supabase.channel(chatChannelName(orderId, a, b))
  try {
    // The server never joins the channel, so send over REST (httpSend); older clients only have send().
    if (typeof channel.httpSend === 'function') await channel.httpSend('message', message)
    else await channel.send({ type: 'broadcast', event: 'message', payload: message })
  }
  catch (err) {
    console.error('[chat] broadcast failed:', err)
  }
  finally {
    try { await supabase.removeChannel(channel) }
    catch { /* ignore */ }
  }
}

/**
 * Saves a chat message from the server (e.g. a receipt or "payment confirmed"),
 * and sends it to the pair's realtime channel. Returns the message with its image link.
 */
export async function postChatMessage(
  event: H3Event,
  supabase: any,
  row: { order_id: string; sender_id: string; receiver_id: string; message_text: string; kind?: string; image_path?: string | null },
) {
  const insert: Record<string, unknown> = {
    order_id: row.order_id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    message_text: row.message_text,
  }
  if (row.kind && row.kind !== 'text') insert.kind = row.kind
  if (row.image_path) insert.image_path = row.image_path

  const { data, error } = await supabase.from('messages').insert(insert).select().single()
  if (error || !data) {
    console.error('[chat] server message failed:', error?.message)
    return null
  }
  const [message] = await withImageUrls(event, [data])
  await broadcastChatMessage(supabase, row.order_id, row.sender_id, row.receiver_id, message)
  return message
}
