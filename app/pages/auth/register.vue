<template>
  <div class="min-h-screen grid grid-cols-1 lg:grid-cols-2">
    <aside class="hidden lg:flex flex-col justify-between bg-farm-deep text-white p-12 xl:p-16">
      <div>
        <NuxtLink to="/auth/login" class="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs mb-12 transition-colors">
          <Icon name="heroicons:arrow-left" class="w-4 h-4" />
          Back to sign in
        </NuxtLink>
        <p class="text-[10px] font-medium tracking-[0.28em] uppercase text-white/50 mb-6">
          Join the network
        </p>
        <h1 class="text-3xl xl:text-4xl font-light leading-[1.2] tracking-tight max-w-md">
          Grow with Bago City's digital harvest marketplace.
        </h1>
        <p class="mt-6 text-sm text-white/55 leading-relaxed max-w-sm font-light">
          Register as a buyer, seller, or logistics partner — one elegant platform for the entire farm ecosystem.
        </p>
      </div>
      <p class="text-[11px] text-white/35 tracking-wide">
        © {{ new Date().getFullYear() }} Senoro Green Farm
      </p>
    </aside>

    <main class="flex flex-col justify-center px-6 py-12 md:px-12 lg:px-16 xl:px-20 bg-white overflow-y-auto">
      <div class="w-full max-w-md mx-auto">
        <div class="lg:hidden mb-8 flex items-center gap-3">
          <NuxtLink to="/auth/login" class="p-2 border border-farm-light text-farm-dark/50">
            <Icon name="heroicons:arrow-left" class="w-4 h-4" />
          </NuxtLink>
          <p class="text-sm font-medium text-farm-dark">Create account</p>
        </div>

        <header class="mb-8">
          <h2 class="text-2xl font-light text-farm-dark tracking-tight">Register</h2>
          <p class="text-sm text-farm-dark/50 mt-2">Set up your Senoro workspace</p>
        </header>

        <div v-if="errorMsg" class="mb-6 px-4 py-3 border border-red-200 bg-red-50/50 text-red-800 text-sm">
          {{ errorMsg }}
        </div>
        <div v-if="successMsg" class="mb-6 px-4 py-3 border border-farm-light bg-farm-light/50 text-farm-deep text-sm">
          {{ successMsg }}
        </div>

        <form class="space-y-7" @submit.prevent="handleRegister">
          <FarmLineInput
            input-id="reg-fullname"
            v-model="form.full_name"
            label="Full name"
            placeholder="Juan dela Cruz"
          />

          <FarmLineInput
            input-id="reg-email"
            v-model="form.email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
          />

          <FarmLineInput
            input-id="reg-password"
            v-model="form.password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Min. 6 characters"
          >
            <template #suffix>
              <button type="button" class="p-1 text-farm-dark/35" @click="showPassword = !showPassword">
                <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-4 h-4" />
              </button>
            </template>
          </FarmLineInput>

          <div>
            <p class="text-[10px] font-medium tracking-[0.16em] uppercase text-farm-dark/45 mb-3">
              Account role
            </p>
            <div class="grid grid-cols-2 gap-px bg-farm-light border border-farm-light">
              <button
                v-for="r in roles"
                :key="r.value"
                type="button"
                class="py-3 px-3 text-[11px] font-medium tracking-wide uppercase bg-white transition-colors"
                :class="form.role === r.value
                  ? 'text-farm-deep ring-1 ring-inset ring-farm-deep'
                  : 'text-farm-dark/50 hover:bg-farm-light/30'"
                @click="form.role = r.value"
              >
                {{ r.label }}
              </button>
            </div>
          </div>

          <button
            id="btn-register"
            type="submit"
            class="w-full py-4 bg-farm-deep text-white text-xs font-medium tracking-[0.16em] uppercase hover:bg-farm-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            :disabled="loading"
          >
            <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {{ loading ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="mt-10 text-sm text-farm-dark/50 text-center">
          Already registered?
          <NuxtLink to="/auth/login" class="text-farm-deep font-medium hover:underline ml-1">
            Sign in
          </NuxtLink>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import FarmLineInput from '~/components/ui/FarmLineInput.vue'

definePageMeta({ layout: 'auth' })

const { register, dashboardRoute } = useAuth()
const router = useRouter()

const form = reactive({
  full_name: '',
  email: '',
  password: '',
  role: 'buyer',
})
const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)

const roles = [
  { label: 'Admin', value: 'admin' },
  { label: 'Seller', value: 'seller' },
  { label: 'Buyer', value: 'buyer' },
  { label: 'Delivery', value: 'delivery' },
]

async function handleRegister() {
  if (!form.full_name || !form.email || !form.password || !form.role) {
    errorMsg.value = 'Please fill in all fields.'
    return
  }
  if (form.password.length < 6) {
    errorMsg.value = 'Password must be at least 6 characters.'
    return
  }
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const user = await register(form.full_name, form.email, form.password, form.role)
    successMsg.value = 'Account created. Redirecting…'
    setTimeout(() => router.push(dashboardRoute(user.role)), 800)
  }
  catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    errorMsg.value = err?.data?.statusMessage ?? 'Registration failed. Please try again.'
  }
  finally {
    loading.value = false
  }
}

useHead({ title: 'Create Account — Senoro Green Farm' })
</script>
