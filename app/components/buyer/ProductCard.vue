<template>
  <article
    class="group flex flex-col bg-white border border-gray-100 hover:border-farm-leaf transition-all duration-300"
  >
    <NuxtLink :to="`/buyer/product/${product.id}`" class="block">
      <div class="relative aspect-square bg-farm-light overflow-hidden">
        <img
          v-if="product.image_url"
          :src="product.image_url"
          :alt="product.name"
          class="w-full h-full object-cover"
        >
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-4xl text-farm-dark/20"
        >
          {{ visualEmoji }}
        </div>
        <span
          v-if="product.stock === 0"
          class="absolute inset-0 bg-farm-dark/40 flex items-center justify-center text-[10px] font-medium tracking-[0.2em] uppercase text-white"
        >
          Sold Out
        </span>
      </div>
    </NuxtLink>

    <div class="p-4 flex flex-col flex-1 border-t border-farm-light">
      <p class="text-[10px] font-medium tracking-[0.18em] uppercase text-farm-dark/50 mb-1">
        {{ product.category }}
      </p>
      <NuxtLink :to="`/buyer/product/${product.id}`">
        <h3 class="text-sm font-medium text-farm-dark leading-snug line-clamp-2 group-hover:text-farm-deep transition-colors">
          {{ product.name }}
        </h3>
      </NuxtLink>

      <NuxtLink
        v-if="product.users?.id"
        :to="`/buyer/shop/${product.users.id}`"
        class="mt-2 text-[11px] text-farm-dark/45 hover:text-farm-leaf transition-colors truncate"
        @click.stop
      >
        {{ product.users?.full_name ?? 'Senoro Seller' }}
      </NuxtLink>

      <div class="mt-auto pt-4 flex items-end justify-between gap-2">
        <div>
          <p class="text-base font-medium text-farm-leaf tracking-tight">
            ₱{{ formattedPrice }}
          </p>
          <p v-if="showSavingsHint" class="text-[10px] text-farm-dark/40 mt-0.5">
            Save 12% this week
          </p>
        </div>
        <button
          type="button"
          class="w-9 h-9 border border-farm-deep text-farm-deep flex items-center justify-center hover:bg-farm-deep hover:text-white transition-colors duration-300 disabled:opacity-30 disabled:pointer-events-none"
          :disabled="product.stock === 0"
          aria-label="Add to cart"
          @click.stop="$emit('add-to-cart', product)"
        >
          <Icon name="heroicons:plus" class="w-4 h-4 stroke-[2]" />
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
export interface BuyerProduct {
  id: string
  name: string
  price: string | number
  stock: number
  category: string
  image_url?: string | null
  users?: { id?: string; full_name?: string }
}

const props = defineProps<{
  product: BuyerProduct
  showSavingsHint?: boolean
}>()

defineEmits<{
  'add-to-cart': [product: BuyerProduct]
}>()

const categoryVisuals: Record<string, string> = {
  Vegetables: '🥬',
  Fruits: '🍎',
  Organic: '🌱',
  Herbs: '🌿',
  Dairy: '🥛',
  Grains: '🌾',
}

const visualEmoji = computed(() => categoryVisuals[props.product.category] ?? '🌱')

const formattedPrice = computed(() =>
  parseFloat(String(props.product.price ?? 0)).toFixed(2),
)
</script>
