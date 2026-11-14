<template>
  <div
    class="relative grid rounded-full bg-white p-1 ring-1 ring-inset ring-farm-leaf/20"
    :style="{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }"
    role="tablist"
    :aria-label="label"
  >
    <!-- The orange pill slides under the chosen option. -->
    <span
      class="pointer-events-none absolute bottom-1 left-1 top-1 rounded-full bg-market-orange transition-transform duration-200 ease-out motion-reduce:transition-none"
      :style="{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${activeIndex * 100}%)` }"
      aria-hidden="true"
    />
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === option.value"
      class="relative z-[1] min-h-[40px] rounded-full px-2 text-sm font-semibold transition-colors"
      :class="modelValue === option.value ? 'text-white' : 'text-farm-deep hover:text-farm-leaf'"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
// Sliding switch for picking one option, e.g. Day / Week / Month / Year.
const props = defineProps<{
  modelValue: T
  options: { value: T; label: string }[]
  label?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

const activeIndex = computed(() => Math.max(0, props.options.findIndex(o => o.value === props.modelValue)))
</script>
