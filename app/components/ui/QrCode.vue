<template>
  <!-- eslint-disable-next-line vue/no-v-html -- SVG generated locally by the qrcode library -->
  <div class="qr-code" role="img" :aria-label="label" v-html="svg" />
</template>

<script setup lang="ts">
import QRCode from 'qrcode'

const props = withDefaults(defineProps<{ value: string; label?: string }>(), { label: 'QR code' })
const emit = defineEmits<{ ready: [] }>()

const svg = ref('')

watchEffect(async () => {
  svg.value = await QRCode.toString(props.value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })
  await nextTick()
  emit('ready')
})
</script>

<style scoped>
.qr-code :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}
</style>
