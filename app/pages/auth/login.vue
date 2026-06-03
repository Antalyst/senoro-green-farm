<template>
  <div class="min-h-screen grid grid-cols-1 lg:grid-cols-2">
    <!-- Editorial left panel -->
    <aside class="hidden lg:flex flex-col justify-between items-center text-center relative text-white p-8 md:p-12 overflow-hidden">
      <!-- Background Matrix -->
      <img src="https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1200&q=80" alt="Night Market" class="absolute inset-0 w-full h-full object-cover opacity-80" />
      <div class="absolute inset-0 bg-farm-leaf/40 backdrop-blur-[2px]"></div>
      
      <!-- Top Layer: Isolated Navigation Action Hook -->
      <div class="w-full relative z-10 flex justify-start">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-white bg-farm-dark/40 border border-white/20 px-4 py-2 hover:bg-farm-dark/70 text-xs font-bold uppercase tracking-wider backdrop-blur-sm transition-all shadow-md">
          <Icon name="heroicons:arrow-left" class="w-4 h-4 stroke-2" />
          Back to home
        </NuxtLink>
      </div>

      <!-- Center Layer: Perfectly Balanced Brand Canvas Content -->
      <div class="my-auto relative z-10 flex flex-col items-center max-w-md">
        <img src="/logo2.png" alt="Senoro" class="h-60 w-60 object-contain mb-8 opacity-100 drop-shadow-xl animate-fade-in">
        <h1 class="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
          Sizzle & Harvest.<br>
          Where local street food cravings meet fresh farm abundance. Step into Bacolod City's ultimate culinary crossroads.
        </h1>
        <p class="text-base text-gray-100 mt-5 font-medium leading-relaxed max-w-sm drop-shadow-md">
          Connecting you directly to the finest neighborhood kitchens and organic fields, all in one premium digital hub.
        </p>
      </div>

      <!-- Bottom Layer: Footer Meta Summary -->
      <div class="w-full relative z-10">
        <p class="text-center text-[11px] text-white/90 tracking-widest font-bold uppercase drop-shadow-sm">
          © {{ new Date().getFullYear() }} Senoro Green Farm
        </p>
      </div>
    </aside>

    <!-- Form sheet -->
    <main class="flex flex-col justify-center px-6 py-12 md:px-12 lg:px-16 xl:px-20 bg-white">
      <div class="w-full max-w-md mx-auto">
        <div class="lg:hidden mb-10 flex items-center gap-3">
          <NuxtLink to="/" class="p-2 border border-farm-light text-farm-dark/50 hover:text-farm-dark" title="Back to home">
            <Icon name="heroicons:arrow-left" class="w-4 h-4" />
          </NuxtLink>
          <div>
            <p class="text-[10px] font-bold tracking-[0.2em] uppercase text-farm-dark/70">Señoro Hub</p>
          </div>
        </div>

        <header class="mb-10">
          <h2 class="text-3xl md:text-4xl font-black text-farm-dark tracking-tight">Sign In</h2>
          <p class="text-sm text-farm-dark/60 mt-2 font-medium">Access your digital bazaar workspace</p>
        </header>

        <div
          v-if="errorMsg"
          class="mb-6 px-4 py-3 border border-red-200 bg-red-50/50 text-red-800 text-sm"
        >
          {{ errorMsg }}
        </div>

        <form class="space-y-8" @submit.prevent="handleLogin">
          <div class="relative group">
            <label for="login-email" class="block text-xs font-bold text-farm-dark/70 uppercase tracking-widest mb-2">Email address</label>
            <input 
              id="login-email" 
              v-model="form.email" 
              type="email" 
              placeholder="you@example.com" 
              class="w-full bg-transparent border-b border-farm-light px-0 py-3 text-farm-dark font-semibold placeholder-farm-dark/30 focus:outline-none focus:border-market-orange transition-colors"
            >
          </div>

          <div class="relative group">
            <label for="login-password" class="block text-xs font-bold text-farm-dark/70 uppercase tracking-widest mb-2">Password</label>
            <div class="relative">
              <input 
                id="login-password" 
                v-model="form.password" 
                :type="showPassword ? 'text' : 'password'" 
                placeholder="Enter your password" 
                class="w-full bg-transparent border-b border-farm-light px-0 py-3 text-farm-dark font-semibold placeholder-farm-dark/30 focus:outline-none focus:border-market-orange transition-colors"
              >
              <button
                type="button"
                class="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-farm-dark/40 hover:text-farm-dark"
                @click="showPassword = !showPassword"
              >
                <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            id="btn-login"
            type="submit"
            class="w-full py-4 bg-market-orange text-white text-xs font-extrabold tracking-[0.16em] uppercase hover:bg-[#D35400] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-market-orange/20"
            :disabled="loading"
          >
            <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {{ loading ? 'Signing in…' : 'Sign in to Bazaar' }}
          </button>
        </form>

        <!-- Quick test roles -->
        <div class="mt-12 pt-8 border-t border-farm-light">
          <p class="text-[10px] font-bold tracking-[0.16em] uppercase text-farm-dark/40 mb-4">
            Quick test access
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="role in quickRoles"
              :key="role.label"
              type="button"
              class="px-3 py-2.5 border border-farm-light text-left hover:border-market-orange hover:bg-farm-light/30 transition-colors"
              @click="fillQuickRole(role)"
            >
              <span class="text-[11px] font-bold text-farm-dark/80">{{ role.label }}</span>
            </button>
          </div>
        </div>

        <p class="mt-10 text-sm text-farm-dark/60 text-center font-medium">
          No account?
          <NuxtLink to="/auth/register" class="text-market-orange font-bold hover:underline ml-1">
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