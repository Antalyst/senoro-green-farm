import { provide, ref } from 'vue'

/**
 * Chat drawer state for a layout (buyer, seller, delivery).
 * Pages open it with inject('triggerChatModal')(orderId, otherPersonId, label),
 * and can watch inject('chatPaymentVersion') to refresh when a payment changes in the chat.
 */
export function useLayoutChatDrawer() {
  const chat = useOrderChat()
  const isOpen = ref(false)
  const label = ref('Order chat')

  async function openChatModal(orderId: string, partnerId?: string | null, chatLabel = 'Order chat') {
    label.value = chatLabel
    isOpen.value = true
    await chat.open(orderId, partnerId ?? null)
  }

  function closeChatModal() {
    chat.close()
    isOpen.value = false
  }

  provide('triggerChatModal', openChatModal)
  provide('chatPaymentVersion', chat.paymentVersion)

  return { ...chat, isOpen, label, openChatModal, closeChatModal }
}
