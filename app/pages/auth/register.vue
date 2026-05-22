<template>
  <div class="min-h-screen bg-farm-gradient flex flex-col items-center justify-center px-6 py-12">

    <!-- Back + Brand -->
    <div class="w-full max-w-sm flex items-center gap-3 mb-6">
      <NuxtLink to="/auth/login" class="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
        <Icon name="heroicons:arrow-left" class="w-5 h-5 text-white" />
      </NuxtLink>
      <div>
        <h1 class="text-white font-extrabold text-lg">Create Account</h1>
        <p class="text-white/60 text-xs">Senoro Green Farm</p>
      </div>
    </div>

    <!-- Register Card -->
    <div class="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
      <div class="px-6 py-5 space-y-4">

        <!-- Error -->
        <div v-if="errorMsg" class="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <Icon name="heroicons:exclamation-circle" class="w-4 h-4 text-red-500 flex-shrink-0" />
          <p class="text-red-600 text-sm">{{ errorMsg }}</p>
        </div>

        <!-- Success -->
        <div v-if="successMsg" class="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <Icon name="heroicons:check-circle" class="w-4 h-4 text-green-500 flex-shrink-0" />
          <p class="text-green-700 text-sm">{{ successMsg }}</p>
        </div>

        <!-- Full Name -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
          <div class="flex items-center border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-farm-leaf focus-within:ring-2 focus-within:ring-farm-leaf/20 transition-all">
            <Icon name="heroicons:user" class="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              id="reg-fullname"
              v-model="form.full_name"
              type="text"
              placeholder="Juan dela Cruz"
              class="flex-1 py-3 text-sm text-gray-900 outline-none bg-transparent placeholder-gray-400"
            />
          </div>
        </div>

        <!-- Email -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
          <div class="flex items-center border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-farm-leaf focus-within:ring-2 focus-within:ring-farm-leaf/20 transition-all">
            <Icon name="heroicons:envelope" class="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              id="reg-email"
              v-model="form.email"
              type="email"
              placeholder="you@example.com"
              class="flex-1 py-3 text-sm text-gray-900 outline-none bg-transparent placeholder-gray-400"
              autocomplete="email"
            />
          </div>
        </div>

        <!-- Password -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
          <div class="flex items-center border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-farm-leaf focus-within:ring-2 focus-within:ring-farm-leaf/20 transition-all">
            <Icon name="heroicons:lock-closed" class="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              id="reg-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Min. 6 characters"
              class="flex-1 py-3 text-sm text-gray-900 outline-none bg-transparent placeholder-gray-400"
            />
            <button class="p-1" @click="showPassword = !showPassword">
              <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        <!-- Role -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Account Role</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="r in roles"
              :key="r.value"
              :class="[
                'flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all',
                form.role === r.value
                  ? 'border-farm-leaf bg-farm-light text-farm-deep'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300',
              ]"
              @click="form.role = r.value"
            >
              <Icon :name="r.icon" class="w-4 h-4 flex-shrink-0" />
              <span class="text-xs font-semibold">{{ r.label }}</span>
            </button>
          </div>
        </div>

        <!-- Submit -->
        <button
          id="btn-register"
          class="w-full py-3.5 bg-farm-gradient rounded-2xl text-white font-bold text-sm tracking-wide shadow-farm-glow hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          :disabled="loading"
          @click="handleRegister"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>{{ loading ? 'Creating Account...' : 'Create Account' }}</span>
        </button>
      </div>

      <div class="border-t border-gray-100 px-6 py-4 flex justify-center">
        <p class="text-sm text-gray-500">
          Already have an account?
          <NuxtLink to="/auth/login" class="text-farm-leaf font-semibold hover:text-farm-deep transition-colors ml-1">
            Sign In →
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

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
  { label: 'Admin',    value: 'admin',    icon: 'heroicons:shield-check' },
  { label: 'Seller',   value: 'seller',   icon: 'heroicons:shopping-bag' },
  { label: 'Buyer',    value: 'buyer',    icon: 'heroicons:user' },
  { label: 'Delivery', value: 'delivery', icon: 'heroicons:truck' },
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
    successMsg.value = `Account created! Redirecting...`
    setTimeout(() => router.push(dashboardRoute(user.role)), 800)
  }
  catch (e: any) {
    errorMsg.value = e?.data?.statusMessage ?? 'Registration failed. Please try again.'
  }
  finally {
    loading.value = false
  }
}

useHead({ title: 'Create Account — Senoro Green Farm' })
</script>
