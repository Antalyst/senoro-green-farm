<template>
  <div class="farm-line-input">
    <label
      :for="inputId"
      class="block text-[10px] font-medium tracking-[0.16em] uppercase text-farm-dark/50 mb-2"
    >
      {{ label }}
    </label>
    <div class="flex items-center gap-2 border-b border-gray-200 focus-within:border-farm-deep transition-colors min-h-[44px]">
      <slot name="icon" />
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :autocomplete="autocomplete"
        :placeholder="placeholder"
        class="flex-1 w-full min-w-0 py-2.5 text-sm text-farm-dark bg-transparent outline-none rounded-none placeholder:text-farm-dark/30"
        @input="onInput"
        @keyup.enter="$emit('enter')"
      >
      <slot name="suffix" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  label: string
  type?: string
  placeholder?: string
  autocomplete?: string
  inputId?: string
}>(), {
  type: 'text',
  placeholder: '',
  autocomplete: 'off',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  enter: []
}>()

const inputId = computed(() => props.inputId ?? `farm-input-${Math.random().toString(36).slice(2, 9)}`)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>
