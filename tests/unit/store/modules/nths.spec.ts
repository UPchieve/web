import { describe, it, expect, vi, beforeEach } from 'vitest'
import { storeOptions } from '@/store'
import LoggerService from '@/services/LoggerService'

vi.mock('../../../../src/services/NetworkService')
vi.mock('@/services/LoggerService', () => ({
  default: { noticeError: vi.fn() },
}))

const refreshAfterProfileChange = (storeOptions.modules as any).nths.actions
  .refreshAfterProfileChange

describe('nths/refreshAfterProfileChange', () => {
  beforeEach(() => vi.mocked(LoggerService.noticeError).mockClear())

  it('refetches so the sidebar and route guards see the new eligibility', async () => {
    const dispatch = vi.fn().mockResolvedValue([])
    await refreshAfterProfileChange({ dispatch })
    expect(dispatch).toHaveBeenCalledWith('fetchNthsData')
  })

  // The profile itself saved. Surfacing this would tell the coach their change
  // did not take, and the caller has no way to distinguish the two.
  it('reports a failed refetch rather than rejecting', async () => {
    const boom = new Error('network down')
    const dispatch = vi.fn().mockRejectedValue(boom)

    await expect(
      refreshAfterProfileChange({ dispatch })
    ).resolves.toBeUndefined()
    expect(LoggerService.noticeError).toHaveBeenCalledWith(
      boom,
      'Could not refresh NTHS data after a profile change'
    )
  })
})
