<template>
  <div class="app-shell min-h-full w-full flex justify-center" :class="[paddingClass, bgClass]">
    <div class="w-full max-w-[1200px] px-4 md:px-8 min-h-full" :class="bgClass">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  withTabBar?: boolean
  /** Light green page background (admin and seller workspaces) instead of white. */
  tinted?: boolean
}>(), {
  withTabBar: false,
  tinted: false,
})

const paddingClass = computed(() =>
  props.withTabBar ? 'pb-24 md:pb-8' : 'pb-8',
)

const bgClass = computed(() => (props.tinted ? 'bg-farm-light' : 'bg-white'))
</script>
