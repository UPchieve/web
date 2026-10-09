import { describe, expect, it } from 'vitest'
import { useAppSidebarStore } from '@/stores/app/sidebar'

describe('`app/sidebar` store', () => {
  it.each([
    { action: 'show', isShown: true },
    { action: 'hide', isShown: false },
  ] as const)('$action collapses the drawer', ({ action, isShown }) => {
    const store = useAppSidebarStore()
    store.expand()

    store[action]()

    expect(store.isShown).toBe(isShown)
    expect(store.isCollapsed).toBe(true)
  })
})
