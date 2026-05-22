<template>
  <div>
    <!-- Welcome Banner -->
    <div class="bg-farm-gradient-dark px-5 pt-5 pb-8">
      <p class="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">Welcome back</p>
      <h2 class="text-white text-2xl font-extrabold">{{ user?.full_name }}</h2>
      <p class="text-white/50 text-sm mt-0.5">{{ today }}</p>
    </div>

    <div class="px-4 -mt-4 space-y-5 pb-8">
      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="farm-card p-4"
        >
          <div class="flex items-start justify-between mb-3">
            <div :class="`w-9 h-9 rounded-xl flex items-center justify-center ${stat.iconBg}`">
              <Icon :name="stat.icon" class="w-5 h-5" :class="stat.iconColor" />
            </div>
            <span :class="`text-xs font-semibold px-2 py-0.5 rounded-full ${stat.badgeClass}`">
              {{ stat.change }}
            </span>
          </div>
          <p class="text-2xl font-extrabold text-gray-900">{{ stat.value }}</p>
          <p class="text-xs text-gray-500 mt-0.5 font-medium">{{ stat.label }}</p>
        </div>
      </div>

      <!-- User Management -->
      <div class="farm-card overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 class="font-bold text-gray-900 text-sm">All Users</h3>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">{{ users.length }} total</span>
            <button
              class="p-1.5 rounded-lg bg-farm-light hover:bg-farm-leaf/20 transition-colors"
              @click="loadUsers"
            >
              <Icon name="heroicons:arrow-path" class="w-4 h-4 text-farm-leaf" :class="{ 'animate-spin': loadingUsers }" />
            </button>
          </div>
        </div>

        <!-- Filter tabs -->
        <div class="flex gap-1 px-4 py-2 border-b border-gray-100 bg-gray-50">
          <button
            v-for="f in ['all', 'admin', 'seller', 'buyer', 'delivery']"
            :key="f"
            :class="[
              'px-3 py-1 rounded-full text-xs font-semibold transition-all capitalize',
              activeFilter === f
                ? 'bg-farm-deep text-white'
                : 'text-gray-500 hover:bg-gray-200',
            ]"
            @click="activeFilter = f"
          >
            {{ f }}
          </button>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loadingUsers" class="divide-y divide-gray-100">
          <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-4 py-3">
            <div class="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            <div class="flex-1 space-y-1.5">
              <div class="h-3 bg-gray-200 rounded animate-pulse w-32" />
              <div class="h-2.5 bg-gray-100 rounded animate-pulse w-44" />
            </div>
          </div>
        </div>

        <!-- User list -->
        <div v-else class="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
          <div
            v-for="u in filteredUsers"
            :key="u.id"
            class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div :class="`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${roleColor(u.role)}`">
              {{ u.full_name.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ u.full_name }}</p>
              <p class="text-xs text-gray-500 truncate">{{ u.email }}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span :class="`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${roleBadge(u.role)}`">
                {{ u.role }}
              </span>
              <span class="text-[10px] text-gray-400">{{ formatDate(u.created_at) }}</span>
            </div>
          </div>

          <div v-if="filteredUsers.length === 0" class="py-12 text-center">
            <Icon name="heroicons:users" class="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p class="text-gray-400 text-sm">No users found</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { user } = useAuth()

const users = ref<any[]>([])
const loadingUsers = ref(false)
const activeFilter = ref('all')

const today = computed(() => {
  return new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
})

const stats = computed(() => {
  const total = users.value.length
  const byRole = (r: string) => users.value.filter(u => u.role === r).length
  return [
    {
      label: 'Total Users',
      value: total,
      icon: 'heroicons:users-solid',
      iconBg: 'bg-farm-light',
      iconColor: 'text-farm-deep',
      badgeClass: 'bg-farm-light text-farm-deep',
      change: 'All',
    },
    {
      label: 'Active Sellers',
      value: byRole('seller'),
      icon: 'heroicons:shopping-bag-solid',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      badgeClass: 'bg-orange-50 text-orange-600',
      change: 'Seller',
    },
    {
      label: 'Active Buyers',
      value: byRole('buyer'),
      icon: 'heroicons:user-group-solid',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      badgeClass: 'bg-blue-50 text-blue-600',
      change: 'Buyer',
    },
    {
      label: 'Delivery Riders',
      value: byRole('delivery'),
      icon: 'heroicons:truck-solid',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-500',
      badgeClass: 'bg-purple-50 text-purple-600',
      change: 'Rider',
    },
  ]
})

const filteredUsers = computed(() => {
  if (activeFilter.value === 'all') return users.value
  return users.value.filter(u => u.role === activeFilter.value)
})

function roleColor(role: string): string {
  const map: Record<string, string> = {
    admin: 'bg-farm-deep',
    seller: 'bg-orange-500',
    buyer: 'bg-blue-500',
    delivery: 'bg-purple-500',
  }
  return map[role] ?? 'bg-gray-400'
}

function roleBadge(role: string): string {
  const map: Record<string, string> = {
    admin: 'bg-farm-light text-farm-deep',
    seller: 'bg-orange-50 text-orange-700',
    buyer: 'bg-blue-50 text-blue-700',
    delivery: 'bg-purple-50 text-purple-700',
  }
  return map[role] ?? 'bg-gray-100 text-gray-600'
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function loadUsers() {
  loadingUsers.value = true
  try {
    const data = await $fetch<{ users: any[] }>('/api/admin/users')
    users.value = data.users
  }
  catch {
    // silently fail — user sees empty state
  }
  finally {
    loadingUsers.value = false
  }
}

onMounted(loadUsers)

useHead({ title: 'Admin Dashboard — Senoro Green Farm' })
</script>
