import { serverSupabaseClient } from '#supabase/server'

// Newest good review (4–5 stars, with a comment) for the storefront testimonial.
// Returns { review: null } when there is none, so the page can hide the section.
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, users!buyer_id(full_name), products(id, name, image_url, category)')
    .gte('rating', 4)
    .not('comment', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('[reviews/featured]', error.message)
    return { review: null }
  }

  const row = (data ?? []).find((r: any) => String(r.comment ?? '').trim().length >= 10 && r.products)
  if (!row) return { review: null }

  const r = row as any
  return {
    review: {
      id: r.id,
      rating: r.rating,
      comment: String(r.comment).trim(),
      created_at: r.created_at,
      buyer_name: shortName(r.users?.full_name),
      product: r.products,
    },
  }
})

// Public page: show "Juan D." instead of the full name.
function shortName(fullName?: string | null) {
  const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'A happy buyer'
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1]!.charAt(0)}.`
}
