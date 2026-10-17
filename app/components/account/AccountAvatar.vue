<template>
  <span class="flex flex-shrink-0 items-center justify-center overflow-hidden font-semibold">
    <img v-if="url && !failed" :src="url" :alt="name ?? 'Profile photo'" class="h-full w-full object-cover" @error="failed = true">
    <template v-else>{{ initial }}</template>
  </span>
</template>

<script setup lang="ts">
// Profile photo, or the first letter of the name when there is none.
// Size, shape and colors come from the class on the component.
const props = defineProps<{
  name?: string | null
  url?: string | null
  fallback?: string
}>()

const failed = ref(false)
watch(() => props.url, () => { failed.value = false })

const initial = computed(() => props.name?.trim().charAt(0).toUpperCase() || props.fallback || '?')
</script>
