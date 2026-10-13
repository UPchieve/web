import { computed, shallowRef, type Component } from 'vue'
import { defineStore } from 'pinia'

export type Notification = {
  id: string | number
  title: string
  icon?: Component
  description?: string
  cta?: {
    text: string
    action: () => void
  }
  type?: string
  duration?: number
}

export const useNotificationsStore = defineStore('notifications', () => {
  const _notifications = shallowRef<readonly Notification[]>([])

  // since we're using a `shallowRef`, we want to raise an error anytime
  // someone tries to re-assign `notifications` directly. this also gives
  // us type errors when someone tries to mutate it directly.
  const notifications = computed<ReadonlyArray<Readonly<Notification>>>({
    get: () => _notifications.value,
    set: () => {
      throw new Error('`notifications` is read-only. Use the store actions.')
    },
  })

  function add(notification: Notification) {
    _notifications.value = [..._notifications.value, notification]
  }

  function remove(notificationId: Notification['id']) {
    const index = _notifications.value.findIndex(
      ({ id }) => id === notificationId
    )
    if (index === -1) return
    _notifications.value = _notifications.value.filter((_, i) => i !== index)
  }

  function clear() {
    _notifications.value = []
  }

  function updateTitle({
    notificationId,
    title,
  }: {
    notificationId: Notification['id']
    title: string
  }) {
    const index = _notifications.value.findIndex(
      ({ id }) => id === notificationId
    )
    if (index === -1) return
    _notifications.value = _notifications.value.map((notification, i) =>
      i === index ? { ...notification, title } : notification
    )
  }

  return { notifications, add, remove, clear, updateTitle }
})
