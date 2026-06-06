import type { RealtimeChannel } from '@supabase/supabase-js'
import { computed, onUnmounted, ref, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import type { OrderStatus } from './useOrderTimeline'

export interface OrderMessage {
  id: string
  order_id: string
  sender_id: string
  receiver_id: string
  message_text: string
  created_at: string
}

export interface OrderChatContext {
  id: string
  status: OrderStatus | string
  buyer_id: string | null
  delivery_rider_id: string | null
}

const ACTIVE_STATUSES = ['ready_for_pickup', 'out_for_delivery']

function appendMessage(messages: OrderMessage[], incoming: OrderMessage) {
  if (!messages.some(m => m.id === incoming.id)) {
    messages.push(incoming)
  }
}

export const useOrderChat = (orderIdInput: MaybeRefOrGetter<string | null>) => {
  const supabase = useSupabaseClient()
  const api = useApiFetch()
  const orderId = computed(() => toValue(orderIdInput))
  const messages = ref<OrderMessage[]>([])
  const isPending = ref(false)
  const isSending = ref(false)
  const orderStatus = ref<OrderStatus | string>('pending')
  const orderContext = ref<OrderChatContext | null>(null)
  let chatChannel: RealtimeChannel | null = null
  let subscribedOrderId: string | null = null

  const isChatActive = computed(() =>
    ACTIVE_STATUSES.includes(orderStatus.value)
    && !!orderContext.value?.delivery_rider_id,
  )

  const fetchChatHistory = async () => {
    const id = orderId.value
    if (!id) return

    isPending.value = true
    try {
      const data = await api<{
        order: OrderChatContext
        messages: OrderMessage[]
      }>(`/api/chat/${id}/messages`)

      orderContext.value = data.order
      orderStatus.value = data.order.status
      messages.value = data.messages ?? []
    }
    catch (err) {
      console.error('Failed loading chat history:', err)
    }
    finally {
      isPending.value = false
    }
  }

  const sendMessage = async (messageText: string, receiverId: string) => {
    const id = orderId.value
    const trimmed = messageText.trim()
    if (!id || !trimmed || isSending.value) return false

    isSending.value = true
    try {
      const result = await api<{ success: boolean; data: OrderMessage }>('/api/chat/send', {
        method: 'POST',
        body: {
          order_id: id,
          message_text: trimmed,
          receiver_id: receiverId,
        },
      })

      if (result.data) {
        appendMessage(messages.value, result.data)
      }
      return true
    }
    catch (err) {
      console.error('Failed sending message:', err)
      return false
    }
    finally {
      isSending.value = false
    }
  }

  const disconnectLiveSync = () => {
    if (chatChannel) {
      supabase.removeChannel(chatChannel)
      chatChannel = null
      subscribedOrderId = null
    }
  }

  const startLiveSync = () => {
    const id = orderId.value
    if (!id) return
    if (chatChannel && subscribedOrderId === id) return

    disconnectLiveSync()
    subscribedOrderId = id

    chatChannel = supabase
      .channel(`realtime-order-chat:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `order_id=eq.${id}`,
        },
        (payload) => {
          appendMessage(messages.value, payload.new as OrderMessage)
        },
      )
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        appendMessage(messages.value, payload as OrderMessage)
      })
      .subscribe()
  }

  watch(orderId, (newId, oldId) => {
    if (oldId && newId !== oldId) {
      disconnectLiveSync()
      messages.value = []
      orderContext.value = null
      orderStatus.value = 'pending'
    }
  })

  onUnmounted(() => {
    disconnectLiveSync()
  })

  return {
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
  }
}
