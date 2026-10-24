<template>
  <div class="grid min-h-screen grid-cols-1 gap-6 bg-white p-0 lg:grid-cols-2 lg:p-6 lg:h-screen lg:overflow-hidden">
    <AuthShowcase
      title="Join Negros' online farmers' market"
      text="Shop fresh food from local farmers, open your own stall, or deliver orders in your area."
      image="/images/campaign/street-food-hero.png"
      class="hidden lg:block lg:h-full"
    />

    <main class="flex flex-col px-6 py-8 sm:px-10 lg:px-16 lg:h-full lg:overflow-y-auto">
      <!-- Top bar -->
      <div class="flex items-center justify-between">
        <NuxtLink to="/" class="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-shop-ink">
          <Icon name="heroicons:arrow-left" class="h-4 w-4" />
          Back to shop
        </NuxtLink>
        <p class="text-sm text-gray-500">
          Have an account?
          <NuxtLink :to="{ path: '/auth/login', query: loginQuery }" class="font-semibold text-farm-leaf hover:underline">Sign in</NuxtLink>
        </p>
      </div>

      <div class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
        <NuxtLink to="/" class="mb-8 flex items-center gap-2 lg:hidden">
          <img src="/logo2.png" alt="" class="h-10 w-10 object-contain">
          <span class="text-lg font-bold text-shop-ink">NFWM</span>
        </NuxtLink>

        <h1 class="text-3xl font-bold tracking-tight text-shop-ink">Create your account</h1>
        <p class="mt-2 text-sm text-gray-500">It only takes a minute.</p>

        <div
          v-if="errorMsg"
          role="alert"
          class="mt-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <Icon name="heroicons:exclamation-circle" class="mt-0.5 h-5 w-5 flex-shrink-0" />
          {{ errorMsg }}
        </div>

        <form class="mt-8 space-y-5" novalidate @submit.prevent="handleRegister">
          <!-- Role -->
          <fieldset>
            <legend class="field-label">I want to</legend>
            <div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label
                v-for="r in roles"
                :key="r.value"
                class="relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition sm:flex-col sm:gap-2"
                :class="form.role === r.value
                  ? 'border-farm-leaf bg-shop-mint/60 ring-1 ring-farm-leaf'
                  : 'border-gray-200 hover:border-gray-300'"
              >
                <input v-model="form.role" type="radio" name="role" :value="r.value" class="sr-only">
                <span
                  class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                  :class="form.role === r.value ? 'bg-farm-leaf text-white' : 'bg-gray-100 text-gray-500'"
                >
                  <Icon :name="r.icon" class="h-5 w-5" />
                </span>
                <span>
                  <span class="block text-sm font-semibold text-shop-ink">{{ r.label }}</span>
                  <span class="block text-xs leading-snug text-gray-500">{{ r.description }}</span>
                </span>
                <Icon
                  v-if="form.role === r.value"
                  name="heroicons:check-circle-solid"
                  class="absolute right-2 top-2 h-5 w-5 text-farm-leaf"
                />
              </label>
            </div>
          </fieldset>

          <label class="block">
            <span class="field-label">Full name</span>
            <span class="relative mt-1.5 block">
              <Icon name="heroicons:user" class="field-icon" />
              <input
                id="reg-fullname"
                v-model="form.full_name"
                type="text"
                autocomplete="name"
                placeholder="Juan Dela Cruz"
                class="field-input pl-10"
                :class="showErrors && !form.full_name.trim() ? 'field-input--error' : ''"
              >
            </span>
          </label>

          <label class="block">
            <span class="field-label">Email address</span>
            <span class="relative mt-1.5 block">
              <Icon name="heroicons:envelope" class="field-icon" />
              <input
                id="reg-email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                inputmode="email"
                placeholder="you@example.com"
                class="field-input pl-10"
                :class="showErrors && !emailValid ? 'field-input--error' : ''"
              >
            </span>
          </label>

          <label class="block">
            <span class="field-label">Password</span>
            <span class="relative mt-1.5 block">
              <Icon name="heroicons:lock-closed" class="field-icon" />
              <input
                id="reg-password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="At least 6 characters"
                class="field-input px-10"
                :class="showErrors && !passwordValid ? 'field-input--error' : ''"
              >
              <button
                type="button"
                class="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="h-[18px] w-[18px]" />
              </button>
            </span>
            <span
              class="mt-1.5 flex items-center gap-1.5 text-xs"
              :class="passwordValid ? 'text-farm-leaf' : 'text-gray-400'"
            >
              <Icon :name="passwordValid ? 'heroicons:check-circle-solid' : 'heroicons:minus-circle'" class="h-4 w-4" />
              At least 6 characters
            </span>
          </label>

          <!-- Identity verification -->
          <fieldset class="space-y-4 rounded-xl border border-gray-200 p-4">
            <legend class="px-1 text-sm font-semibold text-shop-ink">Verify your identity</legend>
            <p class="-mt-1 flex items-start gap-2 text-xs leading-relaxed text-gray-500">
              <Icon name="heroicons:lock-closed" class="mt-px h-4 w-4 flex-shrink-0 text-farm-leaf" />
              To keep the market safe from fake accounts, an admin checks every new {{ selectedRole.account }} account.
              Your selfie and ID are used only for this check and are never shown publicly.
            </p>

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
              <span class="field-label">2. Type of ID</span>
              <span class="relative mt-1.5 block">
                <Icon name="heroicons:identification" class="field-icon" />
                <select
                  id="reg-id-type"
                  v-model="form.id_type"
                  class="field-input appearance-none pl-10 pr-9"
                  :class="showErrors && !form.id_type ? 'field-input--error' : ''"
                >
                  <option value="" disabled>Choose your ID</option>
                  <option v-for="t in ID_TYPES" :key="t" :value="t">{{ t }}</option>
                </select>
                <Icon name="heroicons:chevron-down" class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </span>
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
          </fieldset>

          <button
            id="btn-register"
            type="submit"
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-farm-leaf py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-farm-deep disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
          >
            <Icon v-if="loading" name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
            {{ loading ? 'Creating account…' : selectedRole.cta }}
          </button>
        </form>
      </div>

      <p class="pb-4 text-center text-xs text-gray-400">© {{ year }} NFWM · Negros Farmers Weekend Market</p>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { register, homeRoute } = useAuth()
const router = useRouter()
const route = useRoute()

const roles = [
  { value: 'buyer', label: 'Buy', account: 'buyer', icon: 'heroicons:shopping-bag', description: 'Order fresh food', cta: 'Create account' },
  { value: 'seller', label: 'Sell', account: 'seller', icon: 'heroicons:building-storefront', description: 'Open your shop', cta: 'Apply as seller' },
  { value: 'delivery', label: 'Deliver', account: 'rider', icon: 'heroicons:truck', description: 'Ride and earn', cta: 'Apply as rider' },
] as const

// /auth/register?role=seller (footer "Become a seller") preselects the role.
const initialRole = roles.some(r => r.value === route.query.role) ? String(route.query.role) : 'buyer'

const form = reactive({
  full_name: '',
  email: '',
  password: '',
  role: initialRole,
  id_type: '',
})
const selfie = ref<File | null>(null)
const idDocument = ref<File | null>(null)
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showErrors = ref(false)
const year = new Date().getFullYear()

const selectedRole = computed(() => roles.find(r => r.value === form.role) ?? roles[0])
const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
const passwordValid = computed(() => form.password.length >= 6)

// Keep the return link when switching to sign in, but not the role.
const loginQuery = computed(() => ({ ...route.query, role: undefined }))

async function handleRegister() {
  showErrors.value = true
  if (!form.full_name.trim() || !form.email.trim() || !form.password) {
    errorMsg.value = 'Please fill in all fields.'
    return
  }
  if (!emailValid.value) {
    errorMsg.value = 'Please enter a valid email address.'
    return
  }
  if (!passwordValid.value) {
    errorMsg.value = 'Password must be at least 6 characters.'
    return
  }
  if (!selfie.value || !form.id_type || !idDocument.value) {
    errorMsg.value = 'Please add a photo of yourself, choose your ID type and upload a photo of your ID.'
    return
  }

  loading.value = true
  errorMsg.value = ''
  try {
    const body = new FormData()
    body.append('full_name', form.full_name.trim())
    body.append('email', form.email.trim())
    body.append('password', form.password)
    body.append('role', form.role)
    body.append('id_type', form.id_type)
    body.append('selfie', selfie.value)
    body.append('id_document', idDocument.value)

    // New accounts are pending, so this lands on the verification status page.
    const user = await register(body)
    await router.push(homeRoute(user))
  }
  catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    errorMsg.value = err?.data?.statusMessage ?? 'Registration failed. Please try again.'
  }
  finally {
    loading.value = false
  }
}

useHead({ title: 'Create account — NFWM' })
</script>

<style scoped>
.field-label {
  @apply block text-sm font-medium text-gray-700;
}
.field-icon {
  @apply pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400;
}
.field-input {
  @apply block w-full rounded-lg border border-gray-300 bg-white py-3 text-sm text-shop-ink outline-none transition placeholder:text-gray-400 focus:border-farm-leaf focus:ring-2 focus:ring-farm-leaf/20;
}
.field-input--error {
  @apply border-red-300 focus:border-red-400 focus:ring-red-100;
}
</style>
