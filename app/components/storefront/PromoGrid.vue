<template>
  <!-- 3+ tiles: two small stacked on the left, one large on the right (reference layout) -->
  <div v-if="tiles.length >= 3" class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.35fr]">
    <div class="grid gap-4">
      <StorefrontPromoTile data-reveal :tile="tiles[0]!" class="h-64 lg:h-[232px]" />
      <StorefrontPromoTile data-reveal :tile="tiles[1]!" class="h-64 lg:h-[232px]" />
    </div>
    <StorefrontPromoTile data-reveal :tile="tiles[2]!" large class="h-72 lg:h-[480px]" />
  </div>

  <div v-else class="grid grid-cols-1 gap-4" :class="tiles.length === 2 ? 'sm:grid-cols-2' : ''">
    <StorefrontPromoTile
      v-for="tile in tiles"
      :key="tile.to"
      data-reveal
      :tile="tile"
      :large="tiles.length === 1"
      class="h-72 sm:h-80 lg:h-[420px]"
    />
  </div>
</template>

<script setup lang="ts">
import type { PromoTileData } from '~/components/storefront/PromoTile.vue'

defineProps<{ tiles: PromoTileData[] }>()
</script>
