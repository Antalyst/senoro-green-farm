<template>
  <div class="space-y-8 py-8 md:py-10">
    <UiPageHeader
      label="Accounts"
      title="Approvals"
      caption="Check each new account's selfie against their ID before they can use the market."
    >
      <button type="button" class="ui-btn-outline" :disabled="pending" @click="refresh()">
        {{ pending ? 'Refreshing…' : 'Refresh' }}
      </button>
    </UiPageHeader>

    <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <UiStatCard
        v-for="(stat, i) in stats"
        :key="stat.label"
        :label="stat.label"
        :value="data ? stat.value : '—'"
        :icon="stat.icon"
        :tone="i === 0 && stat.value > 0 ? 'accent' : 'default'"
      />
    </section>

    <p class="text-xs text-gray-400">
      Selfies and IDs are private. Photo links expire after 10 minutes; press Refresh to get new ones.
    </p>

    <p v-if="pending && !pendingUsers.length" class="ui-card py-16 text-center text-sm text-gray-400">
      Loading…
    </p>

    <div v-else-if="!pendingUsers.length" class="ui-card py-16 text-center">
      <p class="text-sm font-medium text-shop-ink">No pending accounts</p>
      <p class="mt-1 text-xs text-gray-400">New buyer, seller and rider signups will appear here.</p>
    </div>

    <ul v-else class="space-y-4">
      <li v-for="applicant in pendingUsers" :key="applicant.id" class="ui-card p-5 md:p-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div class="min-w-0">
            <h2 class="text-base font-semibold text-farm-deep">{{ applicant.full_name }}</h2>
            <p class="mt-0.5 truncate text-sm text-gray-500">
              {{ applicant.email }} · <span class="ui-pill ui-pill-green capitalize">{{ roleLabel(applicant.role) }}</span>
            </p>
            <p class="mt-1 text-xs text-gray-400">
              Applied {{ formatDate(applicant.created_at) }}
              <template v-if="applicant.verification_submitted_at">
                · Photos sent {{ formatDate(applicant.verification_submitted_at) }}
              </template>
            </p>
          </div>

          <div class="flex flex-shrink-0 gap-2">
            <button
              type="button"
              class="ui-btn"
              :disabled="actingId === applicant.id || !hasPhotos(applicant)"
              :title="hasPhotos(applicant) ? '' : 'This account has not sent a selfie and ID yet'"
              @click="decide(applicant, 'approved')"
            >
              {{ actingId === applicant.id ? 'Saving…' : 'Approve' }}
            </button>
            <button
              type="button"
              class="ui-btn-danger"
              :disabled="actingId === applicant.id"
              @click="decide(applicant, 'rejected')"
            >
              Reject
            </button>
          </div>
        </div>

        <div v-if="hasPhotos(applicant)" class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <figure v-for="photo in photosOf(applicant)" :key="photo.label">
            <a
              v-if="photo.url"
              :href="photo.url"
              target="_blank"
              rel="noopener noreferrer"
              class="block overflow-hidden rounded-md bg-shop-cream"
              :title="`Open ${photo.label.toLowerCase()} full size`"
            >
              <img :src="photo.url" :alt="`${photo.label} of ${applicant.full_name}`" class="h-56 w-full object-contain">
            </a>
            <div v-else class="flex h-56 items-center justify-center rounded-md bg-shop-cream text-xs text-gray-400">
              Could not load photo
            </div>
            <figcaption class="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500">
              <span>{{ photo.label }}</span>
              <span v-if="photo.caption" class="truncate text-gray-400">{{ photo.caption }}</span>
            </figcaption>
          </figure>
        </div>
        <p v-else class="mt-5 rounded-md bg-market-orange/10 px-4 py-3 text-xs text-market-orange">
          No selfie or ID yet. This account was created before verification was required; they will be asked to send photos when they sign in.
        </p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface PendingUser {
  id: string
  full_name: string
  email: string
  role: string
  approval_status: string
  created_at: string
  id_type: string | null
  verification_submitted_at: string | null
  selfie_url: string | null
  id_document_url: string | null
}

const api = useApiFetch()
const actingId = ref<string | null>(null)

const { data, pending, refresh } = await useAsyncData(
  'admin:approvals',
  () => api<{ users: PendingUser[] }>('/api/admin/approvals'),
  { server: false },
)

const pendingUsers = computed(() => data.value?.users ?? [])

const stats = computed(() => [
  { label: 'Pending', value: pendingUsers.value.length, icon: 'heroicons:clock' },
  { label: 'Buyers', value: countByRole('buyer'), icon: 'heroicons:shopping-cart' },
  { label: 'Sellers', value: countByRole('seller'), icon: 'heroicons:building-storefront' },
  { label: 'Riders', value: countByRole('delivery'), icon: 'heroicons:truck' },
])

function countByRole(role: string) {
  return pendingUsers.value.filter(u => u.role === role).length
}

function roleLabel(role: string) {
  return role === 'delivery' ? 'rider' : role
}

function hasPhotos(u: PendingUser) {
  return !!(u.selfie_url || u.id_document_url || u.verification_submitted_at)
}

function photosOf(u: PendingUser) {
  return [
    { label: 'Selfie', url: u.selfie_url, caption: '' },
    { label: 'ID', url: u.id_document_url, caption: u.id_type ?? '' },
  ]
}

async function decide(applicant: PendingUser, approval_status: 'approved' | 'rejected') {
  let reason: string | undefined
  if (approval_status === 'rejected') {
    const answer = prompt(
      `Reject ${applicant.full_name}? Tell them why so they can send better photos (optional):`,
      'Selfie and ID photo do not match or are unclear.',
    )
    if (answer === null) return
    reason = answer.trim()
  }

  actingId.value = applicant.id
  try {
    await api(`/api/admin/users/${applicant.id}/approval`, {
      method: 'PATCH',
      body: { approval_status, reason },
    })
    await refresh()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    alert(e.data?.statusMessage ?? 'Failed to update approval status')
  }
  finally {
    actingId.value = null
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

useHead({ title: 'Approvals — NFWM Admin' })
</script>
