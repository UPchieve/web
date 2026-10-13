import { describe, expect, it, vi } from 'vitest'
import NetworkService from '@/services/NetworkService'
import { useProductFlagsStore } from '@/stores/product-flags'

describe('`productFlags` store', () => {
  it('loads flags from the server, defaulting to an empty object', async () => {
    const store = useProductFlagsStore()
    const getFlags = vi.spyOn(NetworkService, 'getUserProductFlags')

    getFlags.mockResolvedValueOnce({
      data: { flags: { fallIncentiveEnrollmentAt: '2026-01-01' } },
    })
    await store.getUserProductFlags()
    expect(store.flags).toEqual({ fallIncentiveEnrollmentAt: '2026-01-01' })

    getFlags.mockResolvedValueOnce({ data: {} })
    await store.getUserProductFlags()
    expect(store.flags).toEqual({})
  })

  it('merges new flags into the existing ones', () => {
    const store = useProductFlagsStore()
    store.addToProductFlags({ fallIncentiveEnrollmentAt: '2026-01-01' })
    store.addToProductFlags({ impactStudyEnrollmentAt: '2026-02-01' })

    expect(store.flags).toEqual({
      fallIncentiveEnrollmentAt: '2026-01-01',
      impactStudyEnrollmentAt: '2026-02-01',
    })
  })
})
