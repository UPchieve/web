import { describe, expect, it, vi } from 'vitest'
import NetworkService from '@/services/NetworkService'
import { useProductFlagsStore } from '@/stores/product-flags'

describe('`productFlags` store', () => {
  it('loads flags from the server, defaulting to an empty object', async () => {
    const store = useProductFlagsStore()
    const getFlags = vi.spyOn(NetworkService, 'getUserProductFlags')

    getFlags.mockResolvedValueOnce({
      data: { flags: { impactStudyEnrollmentAt: '2026-01-01' } },
    })
    await store.getUserProductFlags()
    expect(store.flags).toEqual({ impactStudyEnrollmentAt: '2026-01-01' })

    getFlags.mockResolvedValueOnce({ data: {} })
    await store.getUserProductFlags()
    expect(store.flags).toEqual({})
  })

  it('merges new flags into the existing ones', () => {
    const store = useProductFlagsStore()
    store.addToProductFlags({ impactStudyCampaigns: {} })
    store.addToProductFlags({ impactStudyEnrollmentAt: '2026-02-01' })

    expect(store.flags).toEqual({
      impactStudyCampaigns: {},
      impactStudyEnrollmentAt: '2026-02-01',
    })
  })

  it('is not loaded until the first fetch finishes', async () => {
    const store = useProductFlagsStore()
    expect(store.isLoaded).toBe(false)
    vi.spyOn(NetworkService, 'getUserProductFlags').mockResolvedValueOnce({
      data: { flags: {} },
    })
    await store.getUserProductFlags()
    expect(store.isLoaded).toBe(true)
  })

  it("doesn't keep the previous user's flags while the next user's load", async () => {
    const store = useProductFlagsStore()
    const getFlags = vi.spyOn(NetworkService, 'getUserProductFlags')
    getFlags.mockResolvedValueOnce({
      data: {
        flags: { shareInfoModalDismissedAt: '2026-11-01T00:00:00.000Z' },
      },
    })
    await store.getUserProductFlags()

    let resolve: (v: unknown) => void = () => {}
    getFlags.mockReturnValueOnce(new Promise((r) => (resolve = r)) as any)
    const pending = store.getUserProductFlags()

    expect(store.isLoaded).toBe(false)
    expect(store.flags.shareInfoModalDismissedAt).toBeUndefined()
    resolve({ data: { flags: {} } })
    await pending
    expect(store.isLoaded).toBe(true)
  })

  it('keeps a dismissal made while the flags were loading', async () => {
    const store = useProductFlagsStore()
    vi.spyOn(
      NetworkService,
      'setShareInfoModalDismissed'
    ).mockResolvedValueOnce({
      shareInfoModalDismissedAt: '2026-11-04T12:00:00.000Z',
    })
    let resolve: (v: unknown) => void = () => {}
    vi.spyOn(NetworkService, 'getUserProductFlags').mockReturnValueOnce(
      new Promise((r) => (resolve = r)) as any
    )

    const pending = store.getUserProductFlags()
    await store.markShareInfoModalDismissed()
    resolve({ data: { flags: { impactStudyEnrollmentAt: '2026-01-01' } } })
    await pending

    expect(store.flags).toEqual({
      impactStudyEnrollmentAt: '2026-01-01',
      shareInfoModalDismissedAt: '2026-11-04T12:00:00.000Z',
    })
  })

  describe('markShareInfoModalDismissed', () => {
    it('marks it right away, then keeps the time the server saved', async () => {
      const store = useProductFlagsStore()
      let resolve: (v: unknown) => void = () => {}
      const post = vi
        .spyOn(NetworkService, 'setShareInfoModalDismissed')
        .mockReturnValueOnce(new Promise((r) => (resolve = r)) as any)

      const pending = store.markShareInfoModalDismissed()
      expect(store.flags.shareInfoModalDismissedAt).toBeTruthy()

      resolve({ shareInfoModalDismissedAt: '2026-11-01T00:00:00.000Z' })
      await pending
      expect(post).toHaveBeenCalledTimes(1)
      expect(store.flags.shareInfoModalDismissedAt).toBe(
        '2026-11-01T00:00:00.000Z'
      )
    })

    it('does not post again once dismissed', async () => {
      const store = useProductFlagsStore()
      store.addToProductFlags({
        shareInfoModalDismissedAt: '2026-11-01T00:00:00.000Z',
      })
      const post = vi.spyOn(NetworkService, 'setShareInfoModalDismissed')
      post.mockClear()

      await store.markShareInfoModalDismissed()
      expect(post).not.toHaveBeenCalled()
    })

    it('stays dismissed for this visit if the request fails', async () => {
      const store = useProductFlagsStore()
      vi.spyOn(
        NetworkService,
        'setShareInfoModalDismissed'
      ).mockRejectedValueOnce(new Error('offline'))

      await store.markShareInfoModalDismissed()
      expect(store.flags.shareInfoModalDismissedAt).toBeTruthy()
    })
  })
})
