<template>
  <div>
    <span class="block text-sm font-medium text-gray-700">{{ label }}</span>
    <label
      class="mt-1.5 flex cursor-pointer items-center gap-4 rounded-lg border border-dashed p-3 transition"
      :class="invalid || error
        ? 'border-red-300 bg-red-50/50'
        : modelValue ? 'border-farm-leaf/40 bg-shop-mint/40' : 'border-gray-300 hover:border-farm-leaf hover:bg-gray-50'"
    >
      <input
        :id="inputId"
        type="file"
        class="sr-only"
        :accept="VERIFICATION_PHOTO_TYPES.join(',')"
        :capture="capture"
        @change="onChange"
      >
      <span class="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-gray-200">
        <img v-if="previewUrl" :src="previewUrl" :alt="`${label} preview`" class="h-full w-full object-cover">
        <Icon v-else :name="icon" class="h-7 w-7 text-gray-400" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-medium text-shop-ink">
          {{ modelValue ? modelValue.name : placeholder }}
        </span>
        <span class="block text-xs" :class="error ? 'text-red-600' : 'text-gray-500'">{{ error || hint }}</span>
      </span>
      <span class="flex-shrink-0 text-sm font-semibold text-farm-leaf">{{ modelValue ? 'Change' : 'Upload' }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: File | null
  label: string
  placeholder: string
  hint: string
  icon: string
  /** Opens the front ("user") or back ("environment") camera on phones. */
  capture?: 'user' | 'environment'
  invalid?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [file: File | null] }>()

const inputId = useId()
const error = ref('')
const previewUrl = ref<string | null>(null)

watch(() => props.modelValue, (file) => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = file ? URL.createObjectURL(file) : null
}, { immediate: true })

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null
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
  emit('update:modelValue', file)
}
</script>
