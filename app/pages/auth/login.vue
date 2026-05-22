<template>
  <div class="min-h-screen bg-farm-gradient flex flex-col items-center justify-center px-6 py-12">

    <!-- Logo + Brand -->
    <div class="flex flex-col items-center mb-10">
      <div class="w-24 h-24 rounded-3xl overflow-hidden shadow-farm-glow mb-4 border-2 border-white/20">
        <img src="/logo.png" class="w-full h-full object-cover" alt="Senoro Green Farm" />
      </div>
      <h1 class="text-white text-2xl font-extrabold tracking-tight">Senoro Green Farm</h1>
      <p class="text-white/60 text-sm mt-1">Fresh from the field, right to your door.</p>
    </div>

    <!-- Login Card -->
    <div class="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
      <!-- Card header -->
      <div class="px-6 pt-6 pb-4 border-b border-gray-100">
        <h2 class="text-gray-900 text-xl font-bold">Sign In</h2>
        <p class="text-gray-500 text-sm mt-0.5">Access your dashboard</p>
      </div>

      <div class="px-6 py-5 space-y-4">
        <!-- Error message -->
        <div v-if="errorMsg" class="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <Icon name="heroicons:exclamation-circle" class="w-4 h-4 text-red-500 flex-shrink-0" />
          <p class="text-red-600 text-sm">{{ errorMsg }}</p>
        </div>

        <!-- Email -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
          <div class="flex items-center border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-farm-leaf focus-within:ring-2 focus-within:ring-farm-leaf/20 transition-all">
            <Icon name="heroicons:envelope" class="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              id="login-email"
              v-model="form.email"
              type="email"
              placeholder="you@example.com"
              class="flex-1 py-3 text-sm text-gray-900 outline-none bg-transparent placeholder-gray-400"
              autocomplete="email"
              @keyup.enter="handleLogin"
            />
          </div>
        </div>

        <!-- Password -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
          <div class="flex items-center border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-farm-leaf focus-within:ring-2 focus-within:ring-farm-leaf/20 transition-all">
            <Icon name="heroicons:lock-closed" class="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              id="login-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="flex-1 py-3 text-sm text-gray-900 outline-none bg-transparent placeholder-gray-400"
              autocomplete="current-password"
              @keyup.enter="handleLogin"
            />
            <button class="p-1" @click="showPassword = !showPassword">
              <Icon
                :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'"
                class="w-4 h-4 text-gray-400"
              />
            </button>
          </div>
        </div>

        <!-- Sign In Button -->
        <button
          id="btn-login"
          class="w-full py-3.5 bg-farm-gradient rounded-2xl text-white font-bold text-sm tracking-wide shadow-farm-glow hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-1"
          :disabled="loading"
          @click="handleLogin"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>{{ loading ? 'Signing in...' : 'Sign In' }}</span>
        </button>
      </div>

      <!-- Quick Role Login — Testing Helper -->
      <div class="px-6 pb-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="flex-1 h-px bg-gray-100" />
          <span class="text-gray-400 text-xs font-medium">Quick Test Login</span>
          <div class="flex-1 h-px bg-gray-100" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="role in quickRoles"
            :key="role.label"
            class="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-farm-leaf hover:bg-farm-light transition-all group"
            @click="fillQuickRole(role)"
          >
            <Icon :name="role.icon" class="w-4 h-4 text-gray-400 group-hover:text-farm-leaf" />
            <span class="text-gray-600 text-xs font-semibold group-hover:text-farm-deep">{{ role.label }}</span>
          </button>
        </div>
      </div>

      <!-- Register link -->
      <div class="border-t border-gray-100 px-6 py-4 flex justify-center">
        <p class="text-sm text-gray-500">
          No account?
          <NuxtLink to="/auth/register" class="text-farm-leaf font-semibold hover:text-farm-deep transition-colors ml-1">
            Create one →
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { login, dashboardRoute } = useAuth()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)

const quickRoles = [
  { label: 'Admin',    email: 'admin@senoro.com',    password: 'admin123',    icon: 'heroicons:shield-check' },
  { label: 'Seller',   email: 'seller@senoro.com',   password: 'seller123',   icon: 'heroicons:shopping-bag' },
  { label: 'Buyer',    email: 'buyer@senoro.com',    password: 'buyer123',    icon: 'heroicons:user' },
  { label: 'Delivery', email: 'delivery@senoro.com', password: 'delivery123', icon: 'heroicons:truck' },
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
  catch (e: any) {
    errorMsg.value = e?.data?.statusMessage ?? 'Login failed. Check your credentials.'
  }
  finally {
    loading.value = false
  }
}

useHead({ title: 'Sign In — Senoro Green Farm' })
</script>
