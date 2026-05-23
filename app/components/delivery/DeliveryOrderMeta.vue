<template>
  <div class="space-y-4">
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
    addresses?: { full_name: string } | null
    users?: { full_name?: string } | null
    order_items?: { quantity: number; products?: { name?: string } | null }[]
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
