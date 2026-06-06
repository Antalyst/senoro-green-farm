export interface MarketplaceNotification {
  id: string
  user_id: string
  order_id: string | null
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export const useNotificationEngine = () => {
  const notifications = useState<MarketplaceNotification[]>('notif_list', () => [])
  const unreadCount = useState<number>('notif_unread_count', () => 0)
  const pending = useState<boolean>('notif_pending', () => false)

  const fetchNotifications = async () => {
    pending.value = true
    try {
      const data = await $fetch<{ list: MarketplaceNotification[]; unreadCount: number }>('/api/notifications')
      notifications.value = data.list ?? []
      unreadCount.value = data.unreadCount ?? 0
    }
    finally {
      pending.value = false
    }
  }

  const markAllAsRead = async () => {
    await $fetch('/api/notifications/read-all', { method: 'POST' })
    await fetchNotifications()
  }

  return {
    notifications,
    unreadCount,
    pending,
    fetchNotifications,
    markAllAsRead,
  }
}
