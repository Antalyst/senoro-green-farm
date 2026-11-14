<template>
  <div class="space-y-6 py-8 md:py-10">
    <UiPageHeader label="Accounts" title="Users" caption="Block, unblock, delete or restore accounts.">
      <button type="button" class="ui-btn-outline" :disabled="pending" @click="refresh()">
        {{ pending ? 'Refreshing…' : 'Refresh' }}
      </button>
    </UiPageHeader>

    <p
      v-if="data && !data.access_supported"
      class="rounded-md border border-market-orange/30 bg-shop-cream px-4 py-3 text-sm text-shop-ink"
    >
      Blocking and deleting accounts needs a database update. Run
      <b>supabase/018_reports_review_photos_user_block.sql</b> in the Supabase SQL editor, then refresh.
    </p>

    <!-- Filters -->
    <div class="space-y-3">
      <UiSlideSwitch v-model="statusFilter" :options="statusOptions" label="Account status" class="md:max-w-md" />
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <nav class="flex gap-5 overflow-x-auto border-b border-farm-leaf/15" aria-label="Filter by role">
          <button
            v-for="f in roleFilters"
            :key="f.value"
            type="button"
            class="ui-tab"
            :class="roleFilter === f.value ? 'ui-tab--active' : ''"
            @click="roleFilter = f.value"
          >
            {{ f.label }}
          </button>
        </nav>
        <input
          v-model="search"
          type="search"
          placeholder="Search name, email or shop"
          aria-label="Search users"
          class="ui-input sm:w-64"
        >
      </div>
    </div>

    <!-- List -->
    <div class="ui-card overflow-hidden">
      <p v-if="pending && !data" class="py-16 text-center text-sm text-gray-400">Loading…</p>
      <p v-else-if="error && !data" class="py-16 text-center text-sm text-gray-400">Could not load the accounts. Try Refresh.</p>
      <p v-else-if="!shown.length" class="py-16 text-center text-sm text-gray-400">
        {{ search ? 'No accounts match your search.' : 'No accounts here.' }}
      </p>

      <ul v-else class="divide-y divide-farm-leaf/10">
        <li v-for="u in shown" :key="u.id" class="flex items-center gap-3 px-4 py-3 md:px-5">
          <AccountAvatar :name="u.full_name" :url="u.avatar_url" class="h-10 w-10 flex-shrink-0 rounded-full bg-shop-mint text-sm text-farm-deep" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-shop-ink">{{ u.full_name }}</p>
            <p class="truncate text-xs text-gray-400">{{ u.email }}</p>
            <div class="mt-1 flex flex-wrap items-center gap-1.5">
              <span class="ui-pill ui-pill-gray">{{ roleLabel(u.role) }}</span>
              <span v-if="u.role === 'seller' && u.shop_name" class="truncate text-xs text-gray-500">{{ u.shop_name }}</span>
              <span :class="statusPill(u).class">{{ statusPill(u).label }}</span>
            </div>
          </div>
          <button
            v-if="u.role !== 'admin' && data?.access_supported"
            type="button"
            class="ui-btn-outline flex-shrink-0 !px-3"
            @click="openManage(u)"
          >
            Manage
          </button>
        </li>
      </ul>
    </div>

    <!-- Manage one account -->
    <UiSheet :open="!!selected" :title="selected?.full_name ?? ''" :caption="selected?.email" @close="closeManage">
      <div v-if="selected" class="space-y-4">
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-gray-500">Role</dt>
            <dd class="text-shop-ink">{{ roleLabel(selected.role) }}</dd>
          </div>
          <div v-if="selected.shop_name" class="flex justify-between gap-3">
            <dt class="text-gray-500">Shop</dt>
            <dd class="truncate text-shop-ink">{{ selected.shop_name }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-gray-500">Joined</dt>
            <dd class="text-shop-ink">{{ formatDate(selected.created_at) }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-gray-500">Status</dt>
            <dd><span :class="statusPill(selected).class">{{ statusPill(selected).label }}</span></dd>
          </div>
          <div v-if="selected.blocked_at" class="rounded bg-red-50 px-3 py-2 text-xs text-red-700">
            Blocked {{ formatDate(selected.blocked_at) }}<span v-if="selected.blocked_reason">: {{ selected.blocked_reason }}</span>
          </div>
          <div v-if="selected.deleted_at" class="rounded bg-gray-100 px-3 py-2 text-xs text-gray-600">
            Deleted {{ formatDate(selected.deleted_at) }}. Nothing was erased; restore brings the account back.
          </div>
        </dl>

        <!-- Deleted: only restore -->
        <template v-if="selected.deleted_at">
          <button type="button" class="ui-btn w-full" :disabled="busy" @click="runAction('restore')">
            {{ busy ? 'Saving…' : 'Restore account' }}
          </button>
        </template>

        <template v-else>
          <!-- Block / unblock -->
          <div v-if="!selected.blocked_at" class="space-y-2 rounded-md border border-farm-leaf/15 p-3">
            <p class="text-sm font-medium text-shop-ink">Block this account</p>
            <p class="text-xs text-gray-500">
              They are signed out and cannot sign in.<span v-if="selected.role === 'seller'"> Their products are hidden from buyers.</span>
              Unblock any time.
            </p>
            <textarea
              v-model="blockReason"
              rows="2"
              maxlength="300"
              placeholder="Reason (shown to the user), e.g. Fake orders"
              aria-label="Reason for blocking"
              class="ui-input resize-none"
            />
            <button type="button" class="ui-btn-accent w-full" :disabled="busy" @click="runAction('block')">
              {{ busy ? 'Saving…' : 'Block account' }}
            </button>
          </div>
          <button v-else type="button" class="ui-btn w-full" :disabled="busy" @click="runAction('unblock')">
            {{ busy ? 'Saving…' : 'Unblock account' }}
          </button>

          <!-- Soft delete (asks twice) -->
          <div class="rounded-md border border-red-200 p-3">
            <p class="text-sm font-medium text-red-700">Delete account</p>
            <p class="mt-0.5 text-xs text-gray-500">The account is hidden and cannot sign in. Orders, reviews and chats are kept, so you can restore it later.</p>
            <button
              v-if="!confirmDelete"
              type="button"
              class="mt-2 inline-flex min-h-[40px] w-full items-center justify-center rounded border border-red-300 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
              @click="confirmDelete = true"
            >
              Delete account
            </button>
            <div v-else class="mt-2 flex gap-2">
              <button type="button" class="ui-btn-outline flex-1" :disabled="busy" @click="confirmDelete = false">Cancel</button>
              <button
                type="button"
                class="inline-flex min-h-[40px] flex-1 items-center justify-center rounded bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                :disabled="busy"
                @click="runAction('delete')"
              >
                {{ busy ? 'Deleting…' : 'Yes, delete' }}
              </button>
            </div>
          </div>
        </template>

        <p v-if="actionError" role="alert" class="text-sm text-red-600">{{ actionError }}</p>
      </div>
    </UiSheet>

    <BuyerToast :show="toast.show" :message="toast.message" :type="toast.type" @close="toast.show = false" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface AdminUser {
  id: string
  full_name: string
  email: string
  role: string
  approval_status?: string | null
  avatar_url?: string | null
  shop_name?: string | null
  created_at: string
  blocked_at: string | null
  blocked_reason: string | null
  deleted_at: string | null
}

type StatusFilter = 'active' | 'blocked' | 'deleted'
type RoleFilter = 'all' | 'buyer' | 'seller' | 'delivery' | 'admin'
type Action = 'block' | 'unblock' | 'delete' | 'restore'

const api = useApiFetch()

const { data, pending, error, refresh } = await useAsyncData(
  'admin:users',
  () => api<{ users: AdminUser[]; access_supported: boolean }>('/api/admin/users'),
  { server: false },
)

const users = computed(() => data.value?.users ?? [])

const statusOf = (u: AdminUser): StatusFilter => (u.deleted_at ? 'deleted' : u.blocked_at ? 'blocked' : 'active')

const statusFilter = ref<StatusFilter>('active')
const statusOptions = computed<{ value: StatusFilter; label: string }[]>(() => {
  const count = (s: StatusFilter) => users.value.filter(u => statusOf(u) === s).length
  return [
    { value: 'active', label: `Active ${count('active')}` },
    { value: 'blocked', label: `Blocked ${count('blocked')}` },
    { value: 'deleted', label: `Deleted ${count('deleted')}` },
  ]
})

const roleFilter = ref<RoleFilter>('all')
const roleFilters: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'buyer', label: 'Buyers' },
  { value: 'seller', label: 'Sellers' },
  { value: 'delivery', label: 'Riders' },
  { value: 'admin', label: 'Admins' },
]

const search = ref('')

const shown = computed(() => {
  const q = search.value.trim().toLowerCase()
  return users.value.filter((u) => {
    if (statusOf(u) !== statusFilter.value) return false
    if (roleFilter.value !== 'all' && u.role !== roleFilter.value) return false
    if (!q) return true
    return [u.full_name, u.email, u.shop_name].some(v => v?.toLowerCase().includes(q))
  })
})

const roleLabels: Record<string, string> = { buyer: 'Buyer', seller: 'Seller', delivery: 'Rider', admin: 'Admin' }
const roleLabel = (role: string) => roleLabels[role] ?? role

function statusPill(u: AdminUser) {
  if (u.deleted_at) return { label: 'Deleted', class: 'ui-pill ui-pill-gray' }
  if (u.blocked_at) return { label: 'Blocked', class: 'ui-pill ui-pill-red' }
  if (u.approval_status === 'pending') return { label: 'Pending', class: 'ui-pill ui-pill-orange' }
  if (u.approval_status === 'rejected') return { label: 'Rejected', class: 'ui-pill ui-pill-red' }
  return { label: 'Active', class: 'ui-pill ui-pill-green' }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Manage sheet
const selected = ref<AdminUser | null>(null)
const blockReason = ref('')
const confirmDelete = ref(false)
const busy = ref(false)
const actionError = ref('')

function openManage(u: AdminUser) {
  selected.value = u
  blockReason.value = ''
  confirmDelete.value = false
  actionError.value = ''
}

function closeManage() {
  if (!busy.value) selected.value = null
}

const DONE: Record<Action, string> = {
  block: 'Account blocked.',
  unblock: 'Account unblocked.',
  delete: 'Account deleted. You can restore it from the Deleted list.',
  restore: 'Account restored.',
}

async function runAction(action: Action) {
  const target = selected.value
  if (!target || busy.value) return
  busy.value = true
  actionError.value = ''
  try {
    const res = await api<{ user: AdminUser }>(`/api/admin/users/${target.id}/access`, {
      method: 'PATCH',
      body: { action, reason: action === 'block' ? blockReason.value.trim() : undefined },
    })
    // Update the row in place so the counts change at once.
    if (data.value) {
      data.value = {
        ...data.value,
        users: data.value.users.map(u => (u.id === target.id ? { ...u, ...res.user } : u)),
      }
    }
    selected.value = null
    showToast(DONE[action])
  }
  catch (err: unknown) {
    actionError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Could not update the account. Try again.'
  }
  finally {
    busy.value = false
  }
}

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })
let toastTimer: ReturnType<typeof setTimeout> | undefined
function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value.show = false }, 3500)
}
onBeforeUnmount(() => clearTimeout(toastTimer))

useHead({ title: 'Users — NFWM Farmers to Market Admin' })
</script>
