<template>
  <div class="flex flex-wrap items-center gap-2">
    <div
      v-for="(photo, i) in items"
      :key="photo.url"
      class="relative h-16 w-16 overflow-hidden rounded border border-gray-200"
    >
      <img :src="photo.url" alt="" class="h-full w-full object-cover">
      <button
        type="button"
        class="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-bl bg-black/60 text-white"
        :aria-label="`Remove photo ${i + 1}`"
        @click="remove(i)"
      >
        <Icon name="heroicons:x-mark" class="h-4 w-4" />
      </button>
    </div>
    <label
      v-if="items.length < MAX_PHOTOS"
      class="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded border border-dashed border-farm-leaf/40 text-farm-leaf hover:bg-farm-light"
    >
      <Icon name="heroicons:camera" class="h-5 w-5" />
      <span class="text-[10px] font-medium">Add photo</span>
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple class="sr-only" @change="add">
    </label>
    <span class="text-xs text-gray-400">{{ items.length }}/{{ MAX_PHOTOS }} photos · JPG, PNG or WebP, up to 5 MB</span>
  </div>
</template>

<script setup lang="ts">
// Photo picker for reviews: up to 3 JPG/PNG/WebP photos, 5 MB each, with previews.
// v-model is the list of chosen files. Set it to [] to clear the previews after posting.
const props = defineProps<{ modelValue: File[] }>()
const emit = defineEmits<{
  'update:modelValue': [files: File[]]
  error: [message: string]
}>()

const MAX_PHOTOS = 3
const MAX_BYTES = 5 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

const items = ref<{ file: File; url: string }[]>([])

function publish() {
  emit('update:modelValue', items.value.map(item => item.file))
}

function add(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = '' // lets the same photo be picked again
  for (const file of files) {
    if (items.value.length >= MAX_PHOTOS) {
      emit('error', `You can add up to ${MAX_PHOTOS} photos.`)
      break
    }
    if (!TYPES.includes(file.type)) {
      emit('error', 'Use a JPG, PNG or WebP photo.')
      continue
    }
    if (file.size > MAX_BYTES) {
      emit('error', 'Each photo must be 5 MB or smaller.')
      continue
    }
    items.value.push({ file, url: URL.createObjectURL(file) })
  }
  publish()
}

function remove(index: number) {
  const [photo] = items.value.splice(index, 1)
  if (photo) URL.revokeObjectURL(photo.url)
  publish()
}

function clearAll() {
  for (const item of items.value) URL.revokeObjectURL(item.url)
  items.value = []
}

// The page cleared the list (after posting, or when a new review opens).
watch(() => props.modelValue, (files) => {
  if (!files.length && items.value.length) clearAll()
})

onBeforeUnmount(clearAll)
</script>
