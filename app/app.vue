<template>
  <ion-app>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp } from '@ionic/vue'

const { fetchUser } = useAuth()

// Rehydrate session on app mount
onMounted(async () => {
  await fetchUser()
})

</script>
