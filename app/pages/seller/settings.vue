<template>
  <PageContainer class="space-y-12 py-8 md:py-12">
    <header class="border-b border-farm-light pb-8">
      <p class="text-[10px] font-extrabold tracking-[0.2em] uppercase text-farm-dark/45 mb-2">
        Configuration
      </p>
      <h1 class="text-2xl md:text-3xl font-light text-farm-dark tracking-tight">
        Shop Profile
      </h1>
      <p class="text-sm text-farm-dark/50 mt-2">Manage your storefront presence, branding, and identity.</p>
    </header>

    <form @submit.prevent="saveProfile" class="max-w-3xl space-y-10">
      
      <!-- Banner Section -->
      <section class="space-y-4">
        <div>
          <h2 class="text-xs font-extrabold uppercase tracking-[0.16em] text-farm-dark">Shop Banner</h2>
          <p class="text-xs text-farm-dark/50 mt-1">Recommended size: 1200x400 pixels.</p>
        </div>
        
        <div 
          class="relative h-40 w-full border-2 border-dashed border-farm-light bg-farm-light/20 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-farm-deep/50 transition-colors"
          @click="triggerFileInput('banner')"
        >
          <img 
            v-if="form.shop_banner_url" 
            :src="form.shop_banner_url" 
            alt="Shop Banner" 
            class="absolute inset-0 w-full h-full object-cover"
          />
          <div 
            class="absolute inset-0 bg-farm-dark/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            :class="{ 'opacity-100 bg-white/80': uploadingBanner }"
          >
            <Icon v-if="uploadingBanner" name="heroicons:arrow-path" class="w-8 h-8 text-farm-deep animate-spin" />
            <span v-else class="text-xs font-bold uppercase tracking-[0.12em] text-white flex items-center gap-2">
              <Icon name="heroicons:photo" class="w-5 h-5" />
              Change Banner Image
            </span>
          </div>
          
          <div v-if="!form.shop_banner_url && !uploadingBanner" class="text-center text-farm-dark/40">
            <Icon name="heroicons:photo" class="w-8 h-8 mx-auto mb-2" />
            <span class="text-xs font-bold uppercase tracking-[0.1em]">Upload Banner</span>
          </div>
        </div>
      </section>

      <!-- Profile Details Section -->
      <section class="grid md:grid-cols-[auto_1fr] gap-8 md:gap-12">
        
        <!-- Avatar Section -->
        <div class="space-y-4 flex flex-col items-center md:items-start">
          <div class="text-center md:text-left w-full">
            <h2 class="text-xs font-extrabold uppercase tracking-[0.16em] text-farm-dark">Avatar</h2>
          </div>
          
          <div 
            class="relative w-24 h-24 rounded-full border border-farm-light bg-farm-light/30 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-farm-deep/50 transition-colors flex-shrink-0"
            @click="triggerFileInput('avatar')"
          >
            <img 
              v-if="form.shop_avatar_url" 
              :src="form.shop_avatar_url" 
              alt="Shop Avatar" 
              class="absolute inset-0 w-full h-full object-cover"
            />
            <div v-else class="absolute inset-0 flex items-center justify-center text-farm-dark/30 bg-farm-light/20">
              <span class="text-3xl font-extrabold uppercase">{{ fallbackInitials }}</span>
            </div>
            
            <div 
              class="absolute inset-0 bg-farm-dark/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              :class="{ 'opacity-100 bg-white/80': uploadingAvatar }"
            >
              <Icon v-if="uploadingAvatar" name="heroicons:arrow-path" class="w-6 h-6 text-farm-deep animate-spin" />
              <Icon v-else name="heroicons:camera" class="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <!-- Form Fields -->
        <div class="space-y-6 flex-1">
          <div class="space-y-2">
            <label class="text-[10px] font-extrabold tracking-[0.16em] uppercase text-farm-dark/45">Shop Name</label>
            <input
              v-model="form.shop_name"
              type="text"
              required
              placeholder="Enter your shop name"
              class="w-full border border-farm-light px-4 py-3 text-sm font-medium text-farm-dark outline-none focus:border-farm-deep transition-colors bg-white"
            >
          </div>
          
          <div class="space-y-2">
            <label class="text-[10px] font-extrabold tracking-[0.16em] uppercase text-farm-dark/45">Registered Owner</label>
            <input
              v-model="form.full_name"
              type="text"
              disabled
              class="w-full border border-farm-light px-4 py-3 text-sm font-medium text-farm-dark/50 bg-farm-light/20 outline-none cursor-not-allowed"
            >
          </div>
        </div>
      </section>

      <!-- Actions -->
      <div class="pt-6 border-t border-farm-light flex items-center justify-end gap-4">
        <button
          type="submit"
          :disabled="saving"
          class="bg-farm-deep text-white px-8 py-3 text-xs font-extrabold tracking-[0.12em] uppercase hover:bg-farm-leaf transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Icon v-if="saving" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
          <span>Save Changes</span>
        </button>
      </div>

    </form>

    <!-- Hidden File Inputs -->
    <input 
      ref="avatarInput" 
      type="file" 
      accept="image/*" 
      class="hidden" 
      @change="handleImageUpload($event, 'avatar')" 
    />
    <input 
      ref="bannerInput" 
      type="file" 
      accept="image/*" 
      class="hidden" 
      @change="handleImageUpload($event, 'banner')" 
    />

    <BuyerToast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '~/components/ui/PageContainer.vue'
import type { AuthUser } from '~/composables/useAuth'

definePageMeta({ layout: 'seller' })

const userState = useState<AuthUser | null>('auth:user')
const api = useApiFetch()

const avatarInput = ref<HTMLInputElement | null>(null)
const bannerInput = ref<HTMLInputElement | null>(null)

const uploadingAvatar = ref(false)
const uploadingBanner = ref(false)
const saving = ref(false)

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

const form = ref({
  shop_name: '',
  shop_avatar_url: '',
  shop_banner_url: '',
  full_name: '',
})

const fallbackInitials = computed(() => {
  const name = form.value.shop_name || form.value.full_name || 'Shop'
  return name.substring(0, 2)
})

onMounted(() => {
  if (userState.value) {
    form.value.shop_name = userState.value.shop_name || ''
    form.value.shop_avatar_url = userState.value.shop_avatar_url || ''
    form.value.shop_banner_url = userState.value.shop_banner_url || ''
    form.value.full_name = userState.value.full_name || ''
  }
})

function triggerFileInput(type: 'avatar' | 'banner') {
  if (type === 'avatar') avatarInput.value?.click()
  if (type === 'banner') bannerInput.value?.click()
}

async function handleImageUpload(event: Event, type: 'avatar' | 'banner') {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (type === 'avatar') uploadingAvatar.value = true
  if (type === 'banner') uploadingBanner.value = true

  try {
    const formData = new FormData()
    formData.append('image', file)

    // Route through the secure backend endpoint to use the configured IMGBB_API_KEY in .env
    const response = await api<{ url: string }>('/api/products/upload', {
      method: 'POST',
      body: formData,
    })

    if (response?.url) {
      if (type === 'avatar') form.value.shop_avatar_url = response.url
      if (type === 'banner') form.value.shop_banner_url = response.url
      triggerToast(`${type === 'avatar' ? 'Avatar' : 'Banner'} uploaded successfully.`)
    } else {
      throw new Error('Upload failed')
    }
  } catch (error) {
    console.error('ImgBB Upload Error:', error)
    triggerToast(`Failed to upload ${type}.`, 'error')
  } finally {
    if (type === 'avatar') uploadingAvatar.value = false
    if (type === 'banner') uploadingBanner.value = false
    input.value = '' // Reset input
  }
}

async function saveProfile() {
  saving.value = true
  try {
    const response = await api<{ success: boolean, data: any[] }>('/api/seller/profile/media', {
      method: 'PUT',
      body: {
        shop_name: form.value.shop_name,
        shop_avatar_url: form.value.shop_avatar_url,
        shop_banner_url: form.value.shop_banner_url
      }
    })

    // Instantly update global user state
    if (userState.value) {
      userState.value.shop_name = form.value.shop_name
      userState.value.shop_avatar_url = form.value.shop_avatar_url
      userState.value.shop_banner_url = form.value.shop_banner_url
    }

    triggerToast('Profile settings saved successfully.')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    triggerToast(e.data?.statusMessage || 'Failed to save profile', 'error')
  } finally {
    saving.value = false
  }
}

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 4000)
}

useHead({ title: 'Shop Settings - Senoro Green Farm' })
</script>
