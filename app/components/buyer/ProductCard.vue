<template>
  <article
    class="group flex flex-col bg-white border border-farm-light hover:border-farm-deep/40 transition-colors duration-300"
  >
    <NuxtLink :to="`/buyer/product/${product.id}`" class="block">
      <div class="relative aspect-square bg-farm-light overflow-hidden">
        <img
          :src="product.image_url || fallbackImage"
          :alt="product.name"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        >
        <span
          v-if="product.stock === 0"
          class="absolute inset-0 bg-farm-dark/50 flex items-center justify-center text-[10px] font-semibold tracking-[0.2em] uppercase text-white"
        >
          Sold Out
        </span>
      </div>
    </NuxtLink>

    <div class="p-3 md:p-4 flex flex-col flex-1 border-t border-farm-light">
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
        class="mt-2 inline-flex items-center gap-1 text-[11px] text-farm-dark/45 hover:text-farm-leaf transition-colors truncate"
        @click.stop
      >
        <Icon name="heroicons:building-storefront" class="h-3.5 w-3.5 flex-shrink-0" />
        <span class="truncate">{{ product.users?.shop_name ?? product.users?.full_name ?? 'Senoro Seller' }}</span>
      </NuxtLink>

      <div class="mt-auto pt-4 space-y-3">
        <p class="text-base font-semibold text-farm-leaf tracking-tight">
          PHP {{ formattedPrice }}
        </p>
        <p v-if="showSavingsHint" class="text-[10px] text-farm-dark/40 -mt-2">
          Save 12% this week
        </p>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="min-h-9 px-2 border border-farm-deep text-farm-deep text-[10px] font-semibold tracking-[0.08em] uppercase hover:bg-farm-light transition-colors disabled:opacity-30 disabled:pointer-events-none"
            :disabled="product.stock === 0"
            @click.stop="$emit('add-to-cart', product)"
          >
            Cart
          </button>
          <button
            type="button"
            class="min-h-9 px-2 bg-farm-deep text-white text-[10px] font-semibold tracking-[0.08em] uppercase hover:bg-farm-dark transition-colors disabled:opacity-30 disabled:pointer-events-none"
            :disabled="product.stock === 0"
            @click.stop="$emit('buy-now', product)"
          >
            Buy
          </button>
        </div>
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
  category_id?: string | null
  image_url?: string | null
  users?: { id?: string; full_name?: string; shop_name?: string | null }
}

const props = defineProps<{
  product: BuyerProduct
  showSavingsHint?: boolean
}>()

defineEmits<{
  'add-to-cart': [product: BuyerProduct]
  'buy-now': [product: BuyerProduct]
}>()

const categoryImages: Record<string, string> = {
  Vegetables: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=700&q=80',
  Fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=700&q=80',
  Organic: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80',
  Herbs: 'https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?auto=format&fit=crop&w=700&q=80',
  Dairy: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=700&q=80',
  Grains: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=80',
}

const fallbackImage = computed(() =>
  categoryImages[props.product.category] ?? 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=700&q=80',
)

const formattedPrice = computed(() =>
  parseFloat(String(props.product.price ?? 0)).toFixed(2),
)
</script>
