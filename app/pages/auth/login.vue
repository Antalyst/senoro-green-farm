<template>
  <div class="min-h-screen grid grid-cols-1 lg:grid-cols-2">
    <!-- Editorial left panel -->
    <aside class="hidden lg:flex flex-col justify-between bg-farm-deep text-white p-12 xl:p-16">
      <div>
        <img src="/logo.png" alt="Senoro" class="w-12 h-12 object-cover mb-10 opacity-95">
        <p class="text-[10px] font-medium tracking-[0.28em] uppercase text-white/50 mb-6">
          Senoro Green Farm
        </p>
        <h1 class="text-3xl xl:text-4xl font-light leading-[1.2] tracking-tight max-w-md">
          Connecting Bago City's finest harvests directly to you.
        </h1>
        <p class="mt-6 text-sm text-white/55 leading-relaxed max-w-sm font-light">
          A premium farm-to-table marketplace built for sellers, buyers, and communities across Negros Occidental.
        </p>
      </div>
      <p class="text-[11px] text-white/35 tracking-wide">
        © {{ new Date().getFullYear() }} Senoro Green Farm
      </p>
    </aside>

    <!-- Form sheet -->
    <main class="flex flex-col justify-center px-6 py-12 md:px-12 lg:px-16 xl:px-20 bg-white">
      <div class="w-full max-w-md mx-auto">
        <div class="lg:hidden mb-10">
          <img src="/logo.png" alt="Senoro" class="w-10 h-10 mb-4">
          <p class="text-[10px] font-medium tracking-[0.2em] uppercase text-farm-dark/45">Senoro Green Farm</p>
        </div>

        <header class="mb-10">
          <h2 class="text-2xl font-light text-farm-dark tracking-tight">Sign in</h2>
          <p class="text-sm text-farm-dark/50 mt-2">Access your workspace dashboard</p>
        </header>

        <div
          v-if="errorMsg"
          class="mb-6 px-4 py-3 border border-red-200 bg-red-50/50 text-red-800 text-sm"
        >
          {{ errorMsg }}
        </div>

        <form class="space-y-8" @submit.prevent="handleLogin">
          <FarmLineInput
            input-id="login-email"
            v-model="form.email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
          />

          <FarmLineInput
            input-id="login-password"
            v-model="form.password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter your password"
            autocomplete="current-password"
            @enter="handleLogin"
          >
            <template #suffix>
              <button
                type="button"
                class="p-1 text-farm-dark/35 hover:text-farm-dark"
                tabindex="-1"
                @click="showPassword = !showPassword"
              >
                <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-4 h-4" />
              </button>
            </template>
          </FarmLineInput>

          <button
            id="btn-login"
            type="submit"
            class="w-full py-4 bg-farm-deep text-white text-xs font-medium tracking-[0.16em] uppercase hover:bg-farm-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            :disabled="loading"
          >
            <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <!-- Quick test roles -->
        <div class="mt-12 pt-8 border-t border-farm-light">
          <p class="text-[10px] font-medium tracking-[0.16em] uppercase text-farm-dark/40 mb-4">
            Quick test access
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="role in quickRoles"
              :key="role.label"
              type="button"
              class="px-3 py-2.5 border border-farm-light text-left hover:border-farm-deep hover:bg-farm-light/40 transition-colors"
              @click="fillQuickRole(role)"
            >
              <span class="text-[11px] font-medium text-farm-dark">{{ role.label }}</span>
            </button>
          </div>
        </div>

        <p class="mt-10 text-sm text-farm-dark/50 text-center">
          No account?
          <NuxtLink to="/auth/register" class="text-farm-deep font-medium hover:underline ml-1">
            Create one
          </NuxtLink>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import FarmLineInput from '~/components/ui/FarmLineInput.vue'

definePageMeta({ layout: 'auth' })

const { login, dashboardRoute } = useAuth()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)

const quickRoles = [
  { label: 'Admin', email: 'admin@senoro.com', password: 'admin123' },
  { label: 'Seller', email: 'seller@senoro.com', password: 'seller123' },
  { label: 'Buyer', email: 'buyer@senoro.com', password: 'buyer123' },
  { label: 'Delivery', email: 'delivery@senoro.com', password: 'delivery123' },
]

function fillQuickRole(role: typeof quickRoles[0]) {
  form.email = role.email
  form.password = role.password
}

async function handleLogin() {
  if (!form.email || !form.password) {
    errorMsg.value = 'Please enter your email and password.'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const user = await login(form.email, form.password)
    router.push(dashboardRoute(user.role))
  }
  catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    errorMsg.value = err?.data?.statusMessage ?? 'Login failed. Check your credentials.'
  }
  finally {
    loading.value = false
  }
}

useHead({ title: 'Sign In — Senoro Green Farm' })
</script>
