<template>
  <!-- Ionic locks the body (position: fixed), so this layout must be its own scroll area. -->
  <div class="fixed inset-0 overflow-y-auto bg-white pb-[var(--safe-bottom)] pt-[var(--safe-top)]">
    <slot />
  </div>
</template>

<script setup lang="ts">
// Phone status-bar icons in the app (white page).
usePageStatusBar('dark')
</script>
