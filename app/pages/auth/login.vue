<template>
  <div class="grid min-h-screen grid-cols-1 gap-6 bg-white p-0 lg:grid-cols-2 lg:p-6">
    <AuthShowcase />

    <main class="flex flex-col px-6 py-8 sm:px-10 lg:px-16">
      <!-- Top bar -->
      <div class="flex items-center justify-between">
        <NuxtLink to="/" class="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-shop-ink">
          <Icon name="heroicons:arrow-left" class="h-4 w-4" />
          Back to shop
        </NuxtLink>
        <p class="text-sm text-gray-500">
          New here?
          <NuxtLink :to="{ path: '/auth/register', query: route.query }" class="font-semibold text-farm-leaf hover:underline">Create account</NuxtLink>
        </p>
      </div>

      <div class="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
        <NuxtLink to="/" class="mb-8 flex items-center gap-2 lg:hidden">
          <img src="/logo2.png" alt="" class="h-10 w-10 object-contain">
          <span class="text-lg font-bold text-shop-ink">NFWM</span>
        </NuxtLink>

        <h1 class="text-3xl font-bold tracking-tight text-shop-ink">Welcome back</h1>
        <p class="mt-2 text-sm text-gray-500">Sign in to shop, sell or deliver with NFWM.</p>

        <div
          v-if="errorMsg"
          role="alert"
          class="mt-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <Icon name="heroicons:exclamation-circle" class="mt-0.5 h-5 w-5 flex-shrink-0" />
          {{ errorMsg }}
        </div>

        <form class="mt-8 space-y-5" novalidate @submit.prevent="handleLogin">
          <label class="block">
            <span class="field-label">Email address</span>
            <span class="relative mt-1.5 block">
              <Icon name="heroicons:envelope" class="field-icon" />
              <input
                id="login-email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                inputmode="email"
                placeholder="you@example.com"
                class="field-input pl-10"
                :class="errorMsg && !form.email ? 'field-input--error' : ''"
              >
            </span>
          </label>

          <label class="block">
            <span class="field-label">Password</span>
            <span class="relative mt-1.5 block">
              <Icon name="heroicons:lock-closed" class="field-icon" />
              <input
                id="login-password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Enter your password"
                class="field-input px-10"
                :class="errorMsg && !form.password ? 'field-input--error' : ''"
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
          </label>

          <button
            id="btn-login"
            type="submit"
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-farm-leaf py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-farm-deep disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
          >
            <Icon v-if="loading" name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="mt-6 text-center text-xs text-gray-400">
          Sellers and riders can sign in after admin approval.
        </p>

        <!-- Dev only: seed accounts (never shown on the live site) -->
        <div v-if="isDev" class="mt-10 rounded-xl border border-dashed border-gray-300 p-4">
          <p class="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <Icon name="heroicons:beaker" class="h-4 w-4" />
            Test accounts (development only)
          </p>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              v-for="role in quickRoles"
              :key="role.label"
              type="button"
              class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:border-farm-leaf hover:text-farm-leaf"
              @click="fillQuickRole(role)"
            >
              <Icon :name="role.icon" class="h-4 w-4" />
              {{ role.label }}
            </button>
          </div>
        </div>
      </div>

      <p class="text-center text-xs text-gray-400">© {{ year }} NFWM · Negros Farmers Weekend Market</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { AuthUser } from '~/composables/useAuth'

definePageMeta({ layout: 'auth' })

const { login, dashboardRoute, homeRoute, isVerified } = useAuth()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)
const isDev = import.meta.dev
const year = new Date().getFullYear()

const quickRoles = [
  { label: 'Admin', icon: 'heroicons:shield-check', email: 'admin@senoro.com', password: 'admin123' },
  { label: 'Seller', icon: 'heroicons:building-storefront', email: 'seller@senoro.com', password: 'seller123' },
  { label: 'Buyer', icon: 'heroicons:shopping-bag', email: 'buyer@senoro.com', password: 'buyer123' },
  { label: 'Delivery', icon: 'heroicons:truck', email: 'delivery@senoro.com', password: 'delivery123' },
]

function fillQuickRole(role: typeof quickRoles[0]) {
  form.email = role.email
  form.password = role.password
  errorMsg.value = ''
}

function afterLoginRoute(user: AuthUser) {
  if (!isVerified.value) return homeRoute(user)
  return (user.role === 'buyer' && buyerReturnPath(route.query)) || dashboardRoute(user.role)
}

async function handleLogin() {
  if (!form.email.trim() || !form.password) {
    errorMsg.value = 'Please enter your email and password.'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const user = await login(form.email.trim(), form.password)
    await router.push(afterLoginRoute(user))
  }
  catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    errorMsg.value = err?.data?.statusMessage ?? 'Login failed. Check your email and password.'
  }
  finally {
    loading.value = false
  }
}

useHead({ title: 'Sign in — NFWM' })
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
