<template>
  <div class="relative">
    <button
      v-if="canScroll"
      type="button"
      class="arrow-btn -left-4"
      aria-label="Previous categories"
      @click="scrollBy(-1)"
    >
      <Icon name="heroicons:chevron-left" class="h-5 w-5" />
    </button>

    <div
      ref="track"
      class="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
      :class="canScroll ? '' : 'justify-center'"
      @scroll.passive="updateScrollState"
    >
      <button
        v-for="cat in categories"
        :key="cat.name"
        type="button"
        data-reveal
        class="group flex w-[150px] flex-shrink-0 snap-start flex-col items-center rounded-lg px-3 pb-4 pt-4 text-center transition-colors sm:w-[190px]"
        :class="cat.name === active ? 'bg-market-orange' : 'bg-farm-light hover:bg-shop-mint'"
        @click="$emit('select', cat.name)"
      >
        <span class="block aspect-[4/5] w-full overflow-hidden rounded-t-full bg-white">
          <img :src="cat.image" :alt="cat.name" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110">
        </span>
        <span class="font-display mt-3 line-clamp-1 text-lg font-bold text-shop-ink">{{ cat.name }}</span>
        <span class="text-[13px]" :class="cat.name === active ? 'text-farm-dark' : 'text-gray-600'">{{ cat.count }} {{ cat.count === 1 ? 'Product' : 'Products' }}</span>
      </button>
    </div>

    <button
      v-if="canScroll"
      type="button"
      class="arrow-btn -right-4"
      aria-label="Next categories"
      @click="scrollBy(1)"
    >
      <Icon name="heroicons:chevron-right" class="h-5 w-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
export interface CategoryTile {
  name: string
  count: number
  image: string
}

const props = defineProps<{ categories: CategoryTile[]; active?: string | null }>()
defineEmits<{ select: [name: string] }>()

const track = ref<HTMLElement | null>(null)
const canScroll = ref(false)

function updateScrollState() {
  const el = track.value
  canScroll.value = !!el && el.scrollWidth > el.clientWidth + 4
}

function scrollBy(direction: 1 | -1) {
  const el = track.value
  if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
}

onMounted(() => {
  updateScrollState()
  window.addEventListener('resize', updateScrollState)
})
onBeforeUnmount(() => window.removeEventListener('resize', updateScrollState))
watch(() => props.categories.length, () => nextTick(updateScrollState))
</script>

<style scoped>
.arrow-btn {
  @apply absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-farm-deep text-white transition-colors hover:bg-market-orange hover:text-farm-dark md:flex;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  scrollbar-width: none;
}
</style>
