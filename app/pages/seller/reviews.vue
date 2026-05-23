<template>
  <PageContainer class="space-y-12 py-8 md:py-12">
    <header class="border-b border-farm-light pb-8">
      <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45 mb-2">
        Feedback
      </p>
      <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight">
        Customer reviews
      </h1>
      <p class="text-sm text-farm-dark/50 mt-2">Responses from buyers on your products</p>
    </header>

    <section class="flex gap-2 overflow-x-auto scrollbar-hide border-b border-farm-light pb-4">
      <button
        v-for="filter in ratingFilters"
        :key="filter.value"
        type="button"
        class="px-4 py-2 text-[10px] font-medium tracking-[0.14em] uppercase whitespace-nowrap border transition-colors"
        :class="activeRatingFilter === filter.value
          ? 'border-farm-deep text-farm-deep bg-farm-light/50'
          : 'border-farm-light text-farm-dark/45 hover:border-farm-deep/40'"
        @click="activeRatingFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </section>

    <section class="border border-farm-light">
      <div v-if="pending" class="p-12 text-center text-xs text-farm-dark/40">
        <Icon name="heroicons:arrow-path" class="w-6 h-6 text-farm-leaf animate-spin mx-auto mb-2" />
        Loading reviews…
      </div>

      <div v-else-if="!filteredReviews?.length" class="p-12 text-center">
        <p class="text-sm font-medium text-farm-dark">No reviews yet</p>
        <p class="text-xs text-farm-dark/45 mt-1">Reviews appear after buyers purchase your products.</p>
      </div>

      <div v-else class="divide-y divide-farm-light">
        <article
          v-for="review in filteredReviews"
          :key="review.id"
          class="p-5 space-y-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex gap-3 items-center min-w-0">
              <div class="w-9 h-9 border border-farm-light flex items-center justify-center text-farm-deep text-xs font-medium flex-shrink-0">
                {{ review.users?.full_name?.charAt(0).toUpperCase() ?? 'B' }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-farm-dark truncate">
                  {{ review.users?.full_name ?? 'Anonymous' }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <div class="flex text-farm-yellow">
                    <Icon
                      v-for="i in 5"
                      :key="i"
                      :name="i <= review.rating ? 'heroicons:star-solid' : 'heroicons:star'"
                      class="w-3 h-3"
                    />
                  </div>
                  <span class="text-[10px] text-farm-dark/40">{{ formatDate(review.created_at) }}</span>
                </div>
              </div>
            </div>
            <span class="text-[10px] font-medium tracking-wider uppercase text-farm-leaf flex-shrink-0 text-right max-w-[40%] truncate">
              {{ review.products?.name ?? 'Product' }}
            </span>
          </div>

          <p class="text-sm text-farm-dark/70 leading-relaxed">
            {{ review.comment || 'No comment.' }}
          </p>

          <div v-if="review.seller_reply" class="border border-farm-light bg-farm-light/30 p-4">
            <p class="text-[10px] font-medium tracking-[0.14em] uppercase text-farm-dark/45 mb-1">Your reply</p>
            <p class="text-sm text-farm-dark/70">{{ review.seller_reply }}</p>
          </div>

          <div v-else>
            <div v-if="activeReplyId === review.id" class="space-y-3">
              <textarea
                v-model="replyText"
                rows="2"
                placeholder="Write a reply…"
                class="w-full border border-farm-light px-3 py-2 text-sm outline-none focus:border-farm-deep resize-none bg-white"
              />
              <div class="flex gap-2 justify-end">
                <button
                  type="button"
                  class="px-4 py-2 border border-farm-light text-xs font-medium uppercase tracking-wide text-farm-dark/60 hover:bg-farm-light/50"
                  @click="activeReplyId = null"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  :disabled="submittingReply || !replyText.trim()"
                  class="px-4 py-2 bg-farm-deep text-white text-xs font-medium uppercase tracking-wide hover:bg-farm-leaf disabled:opacity-50 flex items-center gap-1"
                  @click="submitReply(review.id)"
                >
                  <Icon v-if="submittingReply" name="heroicons:arrow-path" class="w-3.5 h-3.5 animate-spin" />
                  Send
                </button>
              </div>
            </div>
            <button
              v-else
              type="button"
              class="flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase text-farm-deep hover:text-farm-leaf"
              @click="startReply(review.id)"
            >
              <Icon name="heroicons:chat-bubble-left-right" class="w-4 h-4 stroke-[1.5]" />
              Reply
            </button>
          </div>
        </article>
      </div>
    </section>

    <Transition name="slide-up">
      <div
        v-if="toast.show"
        class="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-page z-[60] px-4"
      >
        <div
          class="p-4 border flex items-center gap-3 text-sm font-medium"
          :class="toast.type === 'success' ? 'bg-farm-deep text-white border-farm-deep' : 'bg-red-600 text-white border-red-600'"
        >
          <Icon :name="toast.type === 'success' ? 'heroicons:check-circle' : 'heroicons:exclamation-circle'" class="w-5 h-5 flex-shrink-0" />
          <span class="flex-1">{{ toast.message }}</span>
          <button type="button" class="p-1 opacity-80 hover:opacity-100" @click="toast.show = false">
            <Icon name="heroicons:x-mark" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '~/components/ui/PageContainer.vue'

definePageMeta({ layout: 'seller' })

const api = useApiFetch()

const ratingFilters = [
  { label: 'All Reviews', value: 'all' },
  { label: '5 Stars ⭐', value: '5' },
  { label: '4 Stars ⭐', value: '4' },
  { label: '3 Stars ⭐', value: '3' },
  { label: '2 Stars ⭐', value: '2' },
  { label: '1 Star ⭐', value: '1' }
]
const activeRatingFilter = ref('all')

const { data: reviewsData, pending, refresh } = await useAsyncData('seller:reviews', () => api('/api/seller/reviews'), { server: false })

const filteredReviews = computed(() => {
  let list = reviewsData.value?.reviews ?? []
  if (activeRatingFilter.value !== 'all') {
    const star = parseInt(activeRatingFilter.value)
    list = list.filter((r: any) => r.rating === star)
  }
  return list
})

// Reply state
const activeReplyId = ref<string | null>(null)
const replyText = ref('')
const submittingReply = ref(false)

// Toast state
const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value.message = message
  toast.value.type = type
  toast.value.show = true
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
        reply: replyText.value.trim()
      }
    })
    triggerToast('Reply posted successfully!')
    activeReplyId.value = null
    refresh()
  } catch (err: any) {
    triggerToast(err.data?.statusMessage || 'Failed to submit reply', 'error')
  } finally {
    submittingReply.value = false
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

useHead({ title: 'Seller Reviews — Senoro Green Farm' })
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
