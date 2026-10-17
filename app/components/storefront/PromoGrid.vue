<template>
  <!-- 3+ tiles: two small stacked on the left, one large on the right (reference layout) -->
  <div v-if="tiles.length >= 3" class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.35fr]">
    <div class="grid gap-4">
      <StorefrontPromoTile :tile="tiles[0]!" class="h-48 lg:h-[188px]" />
      <StorefrontPromoTile :tile="tiles[1]!" class="h-48 lg:h-[188px]" />
    </div>
    <StorefrontPromoTile :tile="tiles[2]!" large class="h-56 lg:h-[392px]" />
  </div>

  <div v-else class="grid grid-cols-1 gap-4" :class="tiles.length === 2 ? 'sm:grid-cols-2' : ''">
    <StorefrontPromoTile
      v-for="tile in tiles"
      :key="tile.to"
      :tile="tile"
      :large="tiles.length === 1"
      class="h-56 sm:h-64"
    />
  </div>
</template>

<script setup lang="ts">
import type { PromoTileData } from '~/components/storefront/PromoTile.vue'

defineProps<{ tiles: PromoTileData[] }>()
</script>
