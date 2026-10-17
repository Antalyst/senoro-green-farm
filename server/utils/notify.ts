import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export interface NotificationInput {
  user_id: string
  order_id?: string | null
  title: string
  message: string
}

/** Best effort: a failed notification must never fail the order action that triggered it. */
export async function notify(event: H3Event, rows: NotificationInput[]) {
  if (!rows.length) return
  try {
    const supabase = await serverSupabaseClient(event)
    const { error } = await supabase
      .from('notifications')
      .insert(rows.map(row => ({ ...row, is_read: false })))
    if (error) console.error('[notify] insert failed:', error.code, error.message)
  }
  catch (err) {
    console.error('[notify] insert failed:', err)
  }
}
