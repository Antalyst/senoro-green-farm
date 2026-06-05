<template>
  <div class="min-h-screen grid grid-cols-1 lg:grid-cols-2">
    <!-- Editorial left panel -->
    <aside class="hidden lg:flex flex-col justify-between items-center text-center relative text-white p-8 md:p-12 overflow-hidden">
      <!-- Background Matrix (Updated Unsplash photo to look more like a bustling local market) -->
      <img src="https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?auto=format&fit=crop&w=1200&q=80" alt="Negros Farmers Weekend Market" class="absolute inset-0 w-full h-full object-cover opacity-80" />
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
        <img src="/logo2.png" alt="Negros Farmers Weekend Market" class="h-52 w-52 object-contain mb-6 opacity-100 drop-shadow-xl animate-fade-in">
        <h1 class="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md text-center">
          From the Farm,<br>To Your Table.
        </h1>
        <p class="text-base text-white/80 mt-4 font-medium leading-relaxed text-center drop-shadow-md">
          Negros' one-stop digital market — connecting you directly to fresh harvests, street food stalls, and local farmers every weekend.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <span class="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-bold px-4 py-2 rounded-full">
            <span class="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
            100+ Local Sellers
          </span>
          <span class="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-bold px-4 py-2 rounded-full">
            <span class="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>
            Fresh Every Weekend
          </span>
          <span class="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-bold px-4 py-2 rounded-full">
            <span class="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>
            Farm-to-Door Delivery
          </span>
        </div>
      </div>

      <!-- Bottom Layer: Footer Meta Summary -->
      <div class="w-full relative z-10">
        <p class="text-center text-[11px] text-white/90 tracking-widest font-bold uppercase drop-shadow-sm">
          © {{ new Date().getFullYear() }} Negros Farmers Weekend Market
        </p>
      </div>
    </aside>

    <!-- Form sheet -->
    <main class="flex flex-col justify-center px-6 py-12 md:px-12 lg:px-16 xl:px-20 bg-white overflow-y-auto">
      <div class="w-full max-w-md mx-auto">
        <div class="lg:hidden mb-8 flex items-center gap-3">
          <NuxtLink to="/" class="p-2 border border-farm-light text-farm-dark/50 hover:text-farm-dark" title="Back to home">
            <Icon name="heroicons:arrow-left" class="w-4 h-4" />
          </NuxtLink>
          <p class="text-sm font-medium text-farm-dark">Create account</p>
        </div>

        <header class="mb-8">
          <h2 class="text-3xl md:text-4xl font-black text-farm-dark tracking-tight">Register</h2>
          <p class="text-sm text-farm-dark/60 mt-2 font-medium">Set up your digital bazaar workspace</p>
        </header>

        <div v-if="errorMsg" class="mb-6 px-4 py-3 border border-red-200 bg-red-50/50 text-red-800 text-sm">
          {{ errorMsg }}
        </div>
        <div v-if="successMsg" class="mb-6 px-4 py-3 border border-farm-light bg-farm-light/50 text-farm-deep text-sm">
          {{ successMsg }}
        </div>

        <form class="space-y-7" @submit.prevent="handleRegister">
          <div class="relative group">
            <label for="reg-fullname" class="block text-xs font-bold text-farm-dark/70 uppercase tracking-widest mb-2">Full name</label>
            <input 
              id="reg-fullname" 
              v-model="form.full_name" 
              type="text" 
              placeholder="Juan dela Cruz" 
              class="w-full bg-transparent border-b border-farm-light px-0 py-3 text-farm-dark font-semibold placeholder-farm-dark/30 focus:outline-none focus:border-market-orange transition-colors"
            >
          </div>

          <div class="relative group">
            <label for="reg-email" class="block text-xs font-bold text-farm-dark/70 uppercase tracking-widest mb-2">Email address</label>
            <input 
              id="reg-email" 
              v-model="form.email" 
              type="email" 
              placeholder="you@example.com" 
              class="w-full bg-transparent border-b border-farm-light px-0 py-3 text-farm-dark font-semibold placeholder-farm-dark/30 focus:outline-none focus:border-market-orange transition-colors"
            >
          </div>

          <div class="relative group">
            <label for="reg-password" class="block text-xs font-bold text-farm-dark/70 uppercase tracking-widest mb-2">Password</label>
            <div class="relative">
              <input 
                id="reg-password" 
                v-model="form.password" 
                :type="showPassword ? 'text' : 'password'" 
                placeholder="Min. 6 characters" 
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

          <div>
            <p class="text-[10px] font-medium tracking-[0.16em] uppercase text-farm-dark/45 mb-3">
              Account role
            </p>
            <div class="grid grid-cols-3 gap-px bg-farm-light border border-farm-light">
              <button
                v-for="r in roles"
                :key="r.value"
                type="button"
                class="py-3 px-3 text-[11px] font-medium tracking-wide uppercase bg-white transition-colors"
                :class="form.role === r.value
                  ? 'text-farm-deep ring-1 ring-inset ring-farm-deep font-bold bg-farm-light/10'
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
            class="w-full py-4 bg-market-orange text-white text-xs font-extrabold tracking-[0.16em] uppercase hover:bg-[#D35400] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-market-orange/20"
            :disabled="loading"
          >
            <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {{ loading ? 'Creating account…' : 'Join the Bazaar' }}
          </button>
        </form>

        <p class="mt-10 text-sm text-farm-dark/50 text-center">
          Already registered?
          <NuxtLink to="/auth/login" class="text-market-orange font-bold hover:underline ml-1">
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