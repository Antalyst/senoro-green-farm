<template>
  <div class="space-y-10 py-8 md:py-12">
    <header class="border-b border-farm-light pb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-market-orange mb-2">
          User acceptance
        </p>
        <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight">
          Approval queue
        </h1>
        <p class="text-sm text-farm-dark/45 mt-2">
          Review seller and delivery registrations before they can sign in.
        </p>
      </div>
      <button
        type="button"
        class="self-start text-[10px] font-medium tracking-[0.12em] uppercase text-farm-deep border-b border-farm-deep pb-0.5 hover:text-farm-dark transition-colors flex items-center gap-1"
        :disabled="pending"
        @click="refresh()"
      >
        <Icon name="heroicons:arrow-path" class="w-3.5 h-3.5" :class="{ 'animate-spin': pending }" />
        Refresh queue
      </button>
    </header>

    <section class="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="border border-farm-light bg-white p-5">
        <p class="text-[10px] font-medium tracking-[0.16em] uppercase text-farm-dark/45 mb-1">Pending</p>
        <p class="text-3xl font-light text-market-orange tabular-nums">{{ pendingUsers.length }}</p>
      </div>
      <div class="border border-farm-light bg-white p-5">
        <p class="text-[10px] font-medium tracking-[0.16em] uppercase text-farm-dark/45 mb-1">Sellers waiting</p>
        <p class="text-3xl font-light text-farm-dark tabular-nums">{{ sellerCount }}</p>
      </div>
      <div class="border border-farm-light bg-white p-5 col-span-2 lg:col-span-1">
        <p class="text-[10px] font-medium tracking-[0.16em] uppercase text-farm-dark/45 mb-1">Riders waiting</p>
        <p class="text-3xl font-light text-farm-dark tabular-nums">{{ deliveryCount }}</p>
      </div>
    </section>

    <section class="border border-farm-light bg-white">
      <div v-if="pending && !pendingUsers.length" class="p-16 text-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-farm-leaf border-t-transparent mx-auto" />
        <p class="text-sm text-farm-dark/45 mt-4">Loading approval queue…</p>
      </div>

      <div v-else-if="!pendingUsers.length" class="p-16 text-center">
        <Icon name="heroicons:check-badge" class="w-12 h-12 text-farm-leaf/40 mx-auto mb-3" />
        <p class="text-sm font-medium text-farm-dark">No pending registrations</p>
        <p class="text-xs text-farm-dark/45 mt-1">New seller and delivery signups will appear here.</p>
      </div>

      <div v-else class="divide-y divide-farm-light">
        <article
          v-for="applicant in pendingUsers"
          :key="applicant.id"
          class="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-sm font-medium text-farm-dark">{{ applicant.full_name }}</h2>
              <span class="text-[10px] font-medium tracking-[0.12em] uppercase text-farm-deep border border-farm-light px-2 py-0.5">
                {{ applicant.role }}
              </span>
            </div>
            <p class="text-[11px] text-farm-dark/45 truncate mt-1">{{ applicant.email }}</p>
            <p class="text-[10px] text-farm-dark/35 mt-2 uppercase tracking-wider">
              Applied {{ formatDate(applicant.created_at) }}
            </p>
          </div>

          <div class="flex gap-2 flex-shrink-0">
            <button
              type="button"
              class="px-4 py-2.5 bg-farm-leaf text-white text-[10px] font-black uppercase tracking-[0.12em] hover:bg-farm-deep transition-colors disabled:opacity-50"
              :disabled="actingId === applicant.id"
              @click="decide(applicant.id, 'approved')"
            >
              {{ actingId === applicant.id ? 'Saving…' : 'Approve' }}
            </button>
            <button
              type="button"
              class="px-4 py-2.5 border border-red-200 text-red-700 text-[10px] font-black uppercase tracking-[0.12em] hover:bg-red-50 transition-colors disabled:opacity-50"
              :disabled="actingId === applicant.id"
              @click="decide(applicant.id, 'rejected')"
            >
              Reject
            </button>
          </div>
        </article>
      </div>
    </section>
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
}

const api = useApiFetch()
const actingId = ref<string | null>(null)

const { data, pending, refresh } = await useAsyncData(
  'admin:approvals',
  () => api<{ users: PendingUser[] }>('/api/admin/approvals'),
  { server: false },
)

const pendingUsers = computed(() => data.value?.users ?? [])
const sellerCount = computed(() => pendingUsers.value.filter(u => u.role === 'seller').length)
const deliveryCount = computed(() => pendingUsers.value.filter(u => u.role === 'delivery').length)

async function decide(userId: string, approval_status: 'approved' | 'rejected') {
  actingId.value = userId
  try {
    await api(`/api/admin/users/${userId}/approval`, {
      method: 'PATCH',
      body: { approval_status },
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

useHead({ title: 'User Approvals — Senoro Admin' })
</script>
