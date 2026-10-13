import { describe, expect, it } from 'vitest'
import { useNotificationsStore } from '@/stores/notifications'

describe('`notifications` store', () => {
  it('removes only the notification with the given id', () => {
    const store = useNotificationsStore()
    store.add({ id: 'a', title: 'A' })
    store.add({ id: 2, title: 'B' })

    store.remove('a')

    expect(store.notifications.map(({ id }) => id)).toEqual([2])
  })

  it('removes only the first of two notifications sharing an id', () => {
    const store = useNotificationsStore()
    store.add({ id: 'a', title: 'first' })
    store.add({ id: 'a', title: 'second' })

    store.remove('a')

    expect(store.notifications).toEqual([{ id: 'a', title: 'second' }])
  })

  it('updates the title of an existing notification and ignores unknown ids', () => {
    const store = useNotificationsStore()
    store.add({ id: 'rollup-alert', title: 'old' })

    store.updateTitle({ notificationId: 'rollup-alert', title: 'new' })
    store.updateTitle({ notificationId: 'missing', title: 'nope' })

    expect(store.notifications).toEqual([{ id: 'rollup-alert', title: 'new' }])
  })

  it('types do not allow in-place mutation', () => {
    const store = useNotificationsStore()

    // @ts-expect-error `notifications` is a readonly array
    void (() => store.notifications.push({ id: 'b', title: 'B' }))

    void (() => {
      // @ts-expect-error items are `Readonly<Notification>`
      store.notifications[0].title = 'x'
    })
  })

  it('warns and ignores direct assignment to `notifications`', () => {
    const store = useNotificationsStore()
    store.add({ id: 'a', title: 'A' })

    expect(() => (store.notifications = [])).toThrow(
      '`notifications` is read-only. Use the store actions.'
    )
  })
})
