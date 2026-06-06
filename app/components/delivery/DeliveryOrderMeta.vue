<template>
  <div class="space-y-4">
    <div v-if="order.shops && order.shops.length > 0" class="border border-farm-light p-4 space-y-2 bg-farm-light/10">
      <p class="text-[10px] uppercase tracking-wider text-farm-dark/45">Pick up from</p>
      <div class="flex flex-wrap gap-3">
        <div
          v-for="shop in order.shops"
          :key="shop.id"
          class="flex items-center gap-2 border border-farm-light bg-white px-3 py-1.5 rounded-full"
        >
          <img
            v-if="shop.shop_avatar_url"
            :src="shop.shop_avatar_url"
            :alt="shop.shop_name"
            class="w-6 h-6 rounded-full object-cover border border-farm-light"
          />
          <div
            v-else
            class="w-6 h-6 rounded-full bg-farm-leaf text-white flex items-center justify-center text-[10px] font-black"
          >
            {{ shop.shop_name.slice(0, 1).toUpperCase() }}
          </div>
          <span class="text-xs font-medium text-farm-dark">{{ shop.shop_name }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="border border-farm-light p-4 space-y-2">
        <p class="text-[10px] uppercase tracking-wider text-farm-dark/45">Recipient</p>
        <p class="text-sm font-medium text-farm-dark">{{ recipientName }}</p>
        <p class="text-xs text-farm-dark/60">{{ order.addresses?.phone_number ?? 'No phone' }}</p>
      </div>
      <div class="border border-farm-light p-4 space-y-2">
        <p class="text-[10px] uppercase tracking-wider text-farm-dark/45">Destination</p>
        <p v-if="order.addresses" class="text-xs text-farm-dark/70 leading-relaxed">
          {{ order.addresses.detailed_address }}<br>
          Brgy. {{ order.addresses.barangay }}, {{ order.addresses.city }}
        </p>
        <p v-else class="text-xs text-farm-dark/45">No address on file</p>
      </div>
    </div>
    <div class="flex items-center justify-between text-sm border-t border-farm-light pt-3">
      <p class="text-farm-dark/60">{{ summary }}</p>
      <p class="font-medium text-farm-leaf tabular-nums">₱{{ total }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  order: {
    id: string
    total_amount: number | string
    addresses?: {
      full_name: string
      phone_number?: string
      barangay?: string
      city?: string
      detailed_address?: string
    } | null
    users?: { full_name?: string } | null
    order_items?: { quantity: number; products?: { name?: string } | null }[]
    shops?: { id: string; shop_name: string; shop_avatar_url: string | null }[]
  }
}>()

const recipientName = computed(
  () => props.order.addresses?.full_name ?? props.order.users?.full_name ?? '—',
)

const total = computed(() => parseFloat(String(props.order.total_amount ?? 0)).toFixed(2))

const summary = computed(() => {
  const items = props.order.order_items ?? []
  const count = items.reduce((s, i) => s + i.quantity, 0)
  const names = items.map(i => i.products?.name).filter(Boolean).slice(0, 2).join(', ')
  return `${count} item(s)${names ? ` — ${names}` : ''}`
})
</script>
