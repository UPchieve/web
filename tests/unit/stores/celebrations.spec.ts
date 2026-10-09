import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCelebrationsStore } from '@/stores/celebrations'

describe('`celebrations` store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('removes a celebration once its duration elapses', () => {
    const store = useCelebrationsStore()
    store.celebrate(1000)
    expect(store.confettiCelebrations).toHaveLength(1)

    vi.advanceTimersByTime(1000)
    expect(store.confettiCelebrations).toHaveLength(0)
  })

  it('allows at most 3 concurrent celebrations', () => {
    const store = useCelebrationsStore()
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime(1)
      store.celebrate(1000)
    }
    expect(store.confettiCelebrations).toHaveLength(3)
  })
})
