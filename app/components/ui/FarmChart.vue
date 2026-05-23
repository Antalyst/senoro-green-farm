<template>
  <ClientOnly>
    <div ref="containerRef" class="w-full" :style="{ height: `${height}px` }" />
    <template #fallback>
      <div
        class="w-full flex items-center justify-center bg-farm-light/30 border border-farm-light"
        :style="{ height: `${height}px` }"
      >
        <span class="text-[11px] text-farm-dark/40 tracking-wide">Loading chart…</span>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { Options } from 'highcharts'

const props = withDefaults(defineProps<{
  options: Options
  height?: number
}>(), {
  height: 280,
})

const containerRef = ref<HTMLElement | null>(null)
let chartInstance: { destroy: () => void } | null = null

async function renderChart() {
  if (!import.meta.client || !containerRef.value) return

  const Highcharts = (await import('highcharts')).default
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  chartInstance = Highcharts.chart(containerRef.value, props.options)
}

watch(() => props.options, () => {
  nextTick(() => renderChart())
}, { deep: true })

onMounted(() => {
  nextTick(() => renderChart())
})

onBeforeUnmount(() => {
  chartInstance?.destroy()
  chartInstance = null
})
</script>
