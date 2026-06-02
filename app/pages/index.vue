<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { isLoggedIn, user, dashboardRoute } = useAuth()
const router = useRouter()

onMounted(() => {
  if (isLoggedIn.value && user.value) {
    router.replace(dashboardRoute(user.value.role))
  }
  else {
    router.replace('/buyer/dashboard')
  }
})
</script>
