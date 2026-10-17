<template>
  <div class="flex min-h-screen flex-col bg-gray-50">
    <header class="border-b border-gray-200 bg-white">
      <div class="mx-auto flex h-16 max-w-xl items-center justify-between px-4">
        <span class="flex items-center gap-2">
          <img src="/logo2.png" alt="" class="h-9 w-9 object-contain">
          <span class="text-base font-bold text-shop-ink">NFWM</span>
        </span>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-red-600"
          :disabled="loggingOut"
          @click="handleLogout"
        >
          <Icon name="heroicons:arrow-right-on-rectangle" class="h-4 w-4" />
          Sign out
        </button>
      </div>
    </header>

    <main class="mx-auto w-full max-w-xl flex-1 px-4 py-8 md:py-12">
      <div v-if="loadingStatus" class="space-y-4">
        <div class="h-40 animate-pulse rounded-2xl bg-white" />
        <div class="h-24 animate-pulse rounded-2xl bg-white" />
      </div>

      <template v-else>
        <!-- Status -->
        <section class="rounded-2xl bg-white p-6 text-center ring-1 ring-gray-100 md:p-8">
          <span
            class="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            :class="isRejected ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'"
          >
            <Icon :name="isRejected ? 'heroicons:x-circle' : 'heroicons:clock'" class="h-8 w-8" />
          </span>
          <p
            class="mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            :class="isRejected ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'"
          >
            {{ isRejected ? 'Not approved' : 'Pending verification' }}
          </p>
          <h1 class="mt-3 text-2xl font-bold tracking-tight text-shop-ink">
            {{ headline }}
          </h1>
          <p class="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
            {{ subline }}
          </p>

          <div
            v-if="isRejected && status?.rejection_reason"
            class="mx-auto mt-5 max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-800"
          >
            <p class="text-xs font-semibold uppercase tracking-wide text-red-600">Reason from the admin</p>
            <p class="mt-1">{{ status.rejection_reason }}</p>
          </div>

          <button
            v-if="!needsPhotos"
            type="button"
            class="mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-shop-ink transition hover:border-farm-leaf hover:text-farm-leaf disabled:opacity-60"
            :disabled="checking"
            @click="checkAgain"
          >
            <Icon name="heroicons:arrow-path" class="h-4 w-4" :class="checking ? 'animate-spin' : ''" />
            {{ checking ? 'Checking…' : 'Check status' }}
          </button>
          <p v-if="checkedMessage" class="mt-2 text-xs text-gray-500">{{ checkedMessage }}</p>
        </section>

        <!-- What was submitted -->
        <section v-if="!needsPhotos" class="mt-4 rounded-2xl bg-white p-5 ring-1 ring-gray-100 md:p-6">
          <h2 class="text-sm font-semibold text-shop-ink">What you sent</h2>
          <ul class="mt-3 space-y-2 text-sm">
            <li class="flex items-center gap-2 text-gray-600">
              <Icon name="heroicons:check-circle-solid" class="h-5 w-5 text-farm-leaf" />
              Photo of yourself
            </li>
            <li class="flex items-center gap-2 text-gray-600">
              <Icon name="heroicons:check-circle-solid" class="h-5 w-5 text-farm-leaf" />
              Photo of your ID<span v-if="status?.id_type" class="text-gray-400">· {{ status.id_type }}</span>
            </li>
          </ul>
          <p v-if="status?.submitted_at" class="mt-3 text-xs text-gray-400">Sent {{ formatDate(status.submitted_at) }}</p>
          <p class="mt-3 flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-500">
            <Icon name="heroicons:lock-closed" class="mt-px h-4 w-4 flex-shrink-0 text-farm-leaf" />
            Your photos are stored privately and only an admin can view them to check your identity.
          </p>
        </section>

        <!-- Send (again) -->
        <section v-if="needsPhotos || isRejected" class="mt-4 rounded-2xl bg-white p-5 ring-1 ring-gray-100 md:p-6">
          <h2 class="text-base font-semibold text-shop-ink">
            {{ isRejected ? 'Send new photos' : 'Send your verification photos' }}
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            {{ isRejected ? 'Fix the issue above and send clear photos. Your account goes back to the review queue.' : 'An admin needs a photo of you and of your ID before approving your account.' }}
          </p>

          <div
            v-if="submitError"
            role="alert"
            class="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <Icon name="heroicons:exclamation-circle" class="mt-0.5 h-5 w-5 flex-shrink-0" />
            {{ submitError }}
          </div>

          <form class="mt-5 space-y-4" novalidate @submit.prevent="submitPhotos">
            <AccountVerificationPhotoInput
              v-model="selfie"
              label="1. Photo of yourself"
              placeholder="Take or upload a selfie"
              hint="Clear photo of your face, no sunglasses or mask"
              icon="heroicons:user-circle"
              capture="user"
              :invalid="showErrors && !selfie"
            />

            <label class="block">
              <span class="block text-sm font-medium text-gray-700">2. Type of ID</span>
              <select
                v-model="idType"
                class="mt-1.5 block w-full rounded-lg border bg-white px-3 py-3 text-sm text-shop-ink outline-none transition focus:border-farm-leaf focus:ring-2 focus:ring-farm-leaf/20"
                :class="showErrors && !idType ? 'border-red-300' : 'border-gray-300'"
              >
                <option value="" disabled>Choose your ID</option>
                <option v-for="t in ID_TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </label>

            <AccountVerificationPhotoInput
              v-model="idDocument"
              label="3. Photo of your ID"
              placeholder="Upload the front of your ID"
              hint="Whole card visible, name and photo readable"
              icon="heroicons:identification"
              capture="environment"
              :invalid="showErrors && !idDocument"
            />

            <button
              type="submit"
              class="flex w-full items-center justify-center gap-2 rounded-lg bg-farm-leaf py-3 text-sm font-semibold text-white transition hover:bg-farm-deep disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="submitting"
            >
              <Icon v-if="submitting" name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
              {{ submitting ? 'Sending…' : 'Send for review' }}
            </button>
          </form>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

interface VerificationStatus {
  approval_status: 'pending' | 'approved' | 'rejected'
  has_selfie: boolean
  has_id_document: boolean
  id_type: string | null
  submitted_at: string | null
  rejection_reason: string | null
}

const { user, fetchUser, isVerified, homeRoute, logout } = useAuth()
const api = useApiFetch()
const router = useRouter()

const status = ref<VerificationStatus | null>(null)
const loadingStatus = ref(true)
const checking = ref(false)
const checkedMessage = ref('')
const loggingOut = ref(false)

const selfie = ref<File | null>(null)
const idDocument = ref<File | null>(null)
const idType = ref('')
const showErrors = ref(false)
const submitting = ref(false)
const submitError = ref('')

const isRejected = computed(() => status.value?.approval_status === 'rejected')
// Accounts made before verification existed may be pending without photos.
const needsPhotos = computed(() => !!status.value && !isRejected.value && (!status.value.has_selfie || !status.value.has_id_document))

const accountLabel = computed(() => ({ seller: 'seller', delivery: 'rider', buyer: 'buyer' } as Record<string, string>)[user.value?.role ?? ''] ?? '')

const headline = computed(() => {
  if (isRejected.value) return 'We could not verify your account'
  if (needsPhotos.value) return 'Verify your identity'
  return 'Your account is being reviewed'
})

const subline = computed(() => {
  if (isRejected.value) return 'Your verification photos were not accepted. You can send new ones below.'
  if (needsPhotos.value) return `Send a photo of yourself and your ID so an admin can approve your ${accountLabel.value} account.`
  return `Thanks, ${user.value?.full_name?.split(' ')[0] ?? ''}! An admin is checking your photos. You can use your ${accountLabel.value} account as soon as it is approved.`
})

async function loadStatus() {
  try {
    status.value = await api<VerificationStatus>('/api/account/verification')
  }
  catch {
    status.value = null
  }
}

async function goHomeIfApproved() {
  await fetchUser(true)
  if (isVerified.value) {
    await router.replace(homeRoute(user.value))
    return true
  }
  return false
}

async function checkAgain() {
  checking.value = true
  checkedMessage.value = ''
  try {
    if (await goHomeIfApproved()) return
    await loadStatus()
    checkedMessage.value = isRejected.value ? '' : 'Still waiting for review. Please check back later.'
  }
  finally {
    checking.value = false
  }
}

async function submitPhotos() {
  showErrors.value = true
  if (!selfie.value || !idType.value || !idDocument.value) {
    submitError.value = 'Please add a photo of yourself, choose your ID type and upload a photo of your ID.'
    return
  }

  submitting.value = true
  submitError.value = ''
  try {
    const body = new FormData()
    body.append('id_type', idType.value)
    body.append('selfie', selfie.value)
    body.append('id_document', idDocument.value)
    await api('/api/account/verification', { method: 'POST', body })

    selfie.value = null
    idDocument.value = null
    idType.value = ''
    showErrors.value = false
    await fetchUser(true)
    await loadStatus()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    submitError.value = e.data?.statusMessage ?? 'Could not send your photos. Please try again.'
  }
  finally {
    submitting.value = false
  }
}

async function handleLogout() {
  loggingOut.value = true
  await logout()
  await router.push('/auth/login')
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

onMounted(async () => {
  // The admin may have approved the account since the last visit.
  if (!(await goHomeIfApproved())) await loadStatus()
  loadingStatus.value = false
})

useHead({ title: 'Account verification — NFWM' })
</script>
