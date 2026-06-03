<template>
  <div class="app-shell min-h-full w-full bg-white flex justify-center" :class="paddingClass">
    <div class="w-full max-w-[1200px] px-4 md:px-8 bg-white min-h-full">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  withTabBar?: boolean
}>(), {
  withTabBar: false,
})

const paddingClass = computed(() =>
  props.withTabBar ? 'pb-24 md:pb-8' : 'pb-8',
)
</script>

