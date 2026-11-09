<template>
  <!-- Ionic locks the body (position: fixed), so this layout must be its own scroll area. -->
  <div class="fixed inset-0 overflow-y-auto bg-white">
    <slot />
  </div>
</template>
