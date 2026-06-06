import { computed, ref } from 'vue'

export function useLayoutChatDrawer() {
  const { user } = useAuth()

  const isChatModalOpen = ref(false)
  const chatOrderId = ref<string | null>(null)
  const chatReceiverId = ref<string | null>(null)
  const chatLabel = ref('Order chat')
  const textInput = ref('')

  const computedUserId = computed(() => user.value?.id ?? null)

  const {
    messages,
    isPending,
    isSending,
    orderStatus,
    orderContext,
    isChatActive,
    fetchChatHistory,
    sendMessage,
    startLiveSync,
    disconnectLiveSync,
  } = useOrderChat(chatOrderId)

  const isChatLocked = computed(() => !isChatActive.value)

  function resolveReceiverId(explicit?: string | null) {
    if (explicit) return explicit

    const ctx = orderContext.value
    const uid = computedUserId.value
    if (!ctx || !uid) return null

    if (uid === ctx.buyer_id) return ctx.delivery_rider_id
    if (uid === ctx.delivery_rider_id) return ctx.buyer_id
    return null
  }

  const openChatModal = async (
    orderId: string,
    receiverId?: string | null,
    label = 'Order chat',
  ) => {
    if (isChatModalOpen.value) {
      disconnectLiveSync()
    }

    chatOrderId.value = orderId
    chatLabel.value = label
    isChatModalOpen.value = true

    await fetchChatHistory()
    chatReceiverId.value = resolveReceiverId(receiverId)
    startLiveSync()
  }

  const closeChatModal = () => {
    disconnectLiveSync()
    isChatModalOpen.value = false
    chatOrderId.value = null
    chatReceiverId.value = null
    textInput.value = ''
  }

  provide('triggerChatModal', openChatModal)

  const handleSend = async () => {
    if (!textInput.value.trim() || isSending.value || !chatReceiverId.value) return

    const ok = await sendMessage(textInput.value, chatReceiverId.value)
    if (ok) {
      textInput.value = ''
    }
    else {
      alert('Failed to send message. The chat may be locked for this order.')
    }
  }

  function formatTime(value: string) {
    return new Intl.DateTimeFormat('en-PH', { timeStyle: 'short' }).format(new Date(value))
  }

  return {
    isChatModalOpen,
    chatLabel,
    textInput,
    computedUserId,
    messages,
    isPending,
    isSending,
    orderStatus,
    isChatLocked,
    openChatModal,
    closeChatModal,
    handleSend,
    formatTime,
  }
}
