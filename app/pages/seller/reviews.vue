<template>
  <div class="mx-auto w-full max-w-page space-y-5 py-6 md:space-y-6 md:py-8">
    <div class="flex items-center gap-4 rounded-md bg-farm-deep px-4 py-4 text-white md:px-5">
      <p class="text-4xl font-semibold tabular-nums">{{ allReviews.length ? average.toFixed(1) : '—' }}</p>
      <div>
        <UiStarRating :value="average" size="md" />
        <p class="mt-0.5 text-xs text-white/70">
          Average from {{ allReviews.length }} {{ allReviews.length === 1 ? 'review' : 'reviews' }}
        </p>
      </div>
    </div>

    <nav class="flex gap-5 overflow-x-auto border-b border-farm-leaf/15" aria-label="Filter by rating">
      <button
        v-for="filter in ratingFilters"
        :key="filter.value"
        type="button"
        class="ui-tab"
        :class="activeRatingFilter === filter.value ? 'ui-tab--active' : ''"
        @click="activeRatingFilter = filter.value"
      >
        {{ filter.label }}
        <span class="ml-0.5 text-gray-400">{{ countFor(filter.value) }}</span>
      </button>
    </nav>

    <p v-if="pending" class="ui-card py-16 text-center text-sm text-gray-400">Loading…</p>

    <div v-else-if="!filteredReviews.length" class="ui-card py-16 text-center">
      <p class="text-sm font-medium text-shop-ink">No reviews here</p>
      <p class="mt-1 text-xs text-gray-400">Reviews appear after buyers receive your products.</p>
    </div>

    <ul v-else class="ui-card divide-y divide-farm-leaf/10">
      <li v-for="review in filteredReviews" :key="review.id" class="space-y-3 px-4 py-4 md:px-5">
        <div class="flex items-start gap-3">
          <AccountAvatar
            :name="review.users?.full_name"
            fallback="B"
            class="h-9 w-9 rounded-full bg-gray-100 text-sm text-gray-600"
          />
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline justify-between gap-3">
              <p class="truncate text-sm font-medium text-shop-ink">{{ review.users?.full_name ?? 'Buyer' }}</p>
              <span class="flex-shrink-0 text-xs text-gray-400">{{ formatDate(review.created_at) }}</span>
            </div>
            <div class="mt-0.5 flex items-center gap-2">
              <UiStarRating :value="review.rating" />
              <span class="truncate text-xs text-gray-400">{{ review.products?.name ?? 'Product' }}</span>
            </div>
          </div>
        </div>

        <p class="text-sm leading-relaxed text-gray-600">
          {{ review.comment || 'No comment.' }}
        </p>

        <div v-if="review.seller_reply" class="rounded bg-gray-50 px-3 py-2.5">
          <p class="text-xs text-gray-400">Your reply</p>
          <p class="mt-0.5 text-sm text-gray-600">{{ review.seller_reply }}</p>
        </div>

        <div v-else-if="activeReplyId === review.id" class="space-y-2">
          <textarea
            v-model="replyText"
            rows="3"
            placeholder="Write a reply"
            aria-label="Reply"
            class="ui-input resize-none"
          />
          <div class="flex gap-2 sm:justify-end">
            <button type="button" class="ui-btn-outline flex-1 sm:flex-none" @click="activeReplyId = null">Cancel</button>
            <button
              type="button"
              class="ui-btn flex-1 sm:flex-none"
              :disabled="submittingReply || !replyText.trim()"
              @click="submitReply(review.id)"
            >
              {{ submittingReply ? 'Sending…' : 'Send reply' }}
            </button>
          </div>
        </div>

        <button v-else type="button" class="ui-link" @click="startReply(review.id)">Reply</button>
      </li>
    </ul>

    <BuyerToast :show="toast.show" :message="toast.message" :type="toast.type" @close="toast.show = false" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'seller' })

interface SellerReview {
  id: string
  rating: number
  comment?: string | null
  seller_reply?: string | null
  created_at: string
  users?: { full_name?: string | null } | null
  products?: { name?: string | null } | null
}

const api = useApiFetch()

const ratingFilters = [
  { label: 'All', value: 'all' },
  { label: '5 stars', value: '5' },
  { label: '4 stars', value: '4' },
  { label: '3 stars', value: '3' },
  { label: '2 stars', value: '2' },
  { label: '1 star', value: '1' },
]
const activeRatingFilter = ref('all')

const { data: reviewsData, pending, refresh } = await useAsyncData(
  'seller:reviews',
  () => api<{ reviews: SellerReview[] }>('/api/seller/reviews'),
  { server: false },
)

const allReviews = computed(() => reviewsData.value?.reviews ?? [])

const average = computed(() => {
  const list = allReviews.value
  if (!list.length) return 0
  return list.reduce((sum, r) => sum + Number(r.rating || 0), 0) / list.length
})

function countFor(value: string) {
  if (value === 'all') return allReviews.value.length
  return allReviews.value.filter(r => r.rating === Number(value)).length
}

const filteredReviews = computed(() => {
  if (activeRatingFilter.value === 'all') return allReviews.value
  const star = Number(activeRatingFilter.value)
  return allReviews.value.filter(r => r.rating === star)
})

// Reply state
const activeReplyId = ref<string | null>(null)
const replyText = ref('')
const submittingReply = ref(false)

const toast = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 4000)
}

function startReply(reviewId: string) {
  activeReplyId.value = reviewId
  replyText.value = ''
}

async function submitReply(reviewId: string) {
  if (!replyText.value.trim()) return
  submittingReply.value = true
  try {
    await api('/api/seller/reviews/reply', {
      method: 'PUT',
      body: {
        review_id: reviewId,
        reply: replyText.value.trim(),
      },
    })
    triggerToast('Reply posted.')
    activeReplyId.value = null
    refresh()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Failed to send reply', 'error')
  }
  finally {
    submittingReply.value = false
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

useHead({ title: 'Reviews — NFWM Seller' })
</script>
