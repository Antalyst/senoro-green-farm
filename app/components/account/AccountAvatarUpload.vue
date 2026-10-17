<template>
  <div class="relative flex-shrink-0">
    <AccountAvatar
      :name="user?.full_name"
      :url="user?.avatar_url"
      :class="avatarClass"
    />
    <label
      class="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-farm-leaf shadow ring-1 ring-gray-200 transition hover:bg-shop-mint"
      :class="uploading ? 'pointer-events-none opacity-70' : ''"
      :title="user?.avatar_url ? 'Change profile photo' : 'Add profile photo'"
    >
      <input type="file" class="sr-only" :accept="VERIFICATION_PHOTO_TYPES.join(',')" :disabled="uploading" @change="onChange">
      <Icon :name="uploading ? 'heroicons:arrow-path' : 'heroicons:camera'" class="h-4 w-4" :class="uploading ? 'animate-spin' : ''" />
      <span class="sr-only">{{ user?.avatar_url ? 'Change profile photo' : 'Add profile photo' }}</span>
    </label>
    <p v-if="error" role="alert" class="absolute left-0 top-full mt-2 w-56 text-xs text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
// Profile photo with a camera button; uploads right after a photo is picked.
defineProps<{ avatarClass?: string }>()

const { user, updateUser } = useAuth()
const api = useApiFetch()
const uploading = ref(false)
const error = ref('')

async function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!VERIFICATION_PHOTO_TYPES.includes(file.type)) {
    error.value = 'Use a JPG, PNG or WebP photo.'
    return
  }
  if (file.size > VERIFICATION_PHOTO_MAX_BYTES) {
    error.value = 'Photo must be 5 MB or smaller.'
    return
  }

  error.value = ''
  uploading.value = true
  try {
    const form = new FormData()
    form.append('image', file)
    const res = await api<{ avatar_url: string }>('/api/account/avatar', { method: 'POST', body: form })
    updateUser({ avatar_url: res.avatar_url })
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    error.value = e.data?.statusMessage ?? 'Could not upload your photo. Please try again.'
  }
  finally {
    uploading.value = false
  }
}
</script>
