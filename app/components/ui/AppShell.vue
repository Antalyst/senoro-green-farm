<template>
  <div class="app-shell min-h-full w-full bg-farm-light flex justify-center" :class="paddingClass">
    <div class="w-full max-w-page px-4 md:px-8 bg-white min-h-full">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** Extra bottom space when a fixed tab bar is present */
  withTabBar?: boolean
}>(), {
  withTabBar: false,
})

const paddingClass = computed(() =>
  props.withTabBar ? 'pb-24' : 'pb-8',
)
</script>
