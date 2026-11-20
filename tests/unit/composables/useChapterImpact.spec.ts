import { useChapterImpact } from '@/composables/useChapterImpact'
import LoggerService from '@/services/LoggerService'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { impact } from '../fixtures/nths'

const getNTHSChapterImpact = vi.fn()
vi.mock('@/services/NetworkService', () => ({
  default: {
    getNTHSChapterImpact: (...args: unknown[]) => getNTHSChapterImpact(...args),
  },
}))

const IMPACT = impact({
  groupId: 'group-1',
  schoolYearToDate: {
    studentsHelped: 1,
    sessionsCompleted: 1,
    hoursTutored: 1,
    membersTutoring: 1,
  },
  allTime: { studentsHelped: 1, sessionsCompleted: 1, hoursTutored: 1 },
})

beforeEach(() => {
  getNTHSChapterImpact.mockReset()
})

describe('useChapterImpact', () => {
  it('reports failure when the request fails', async () => {
    getNTHSChapterImpact.mockRejectedValueOnce(new Error('network down'))
    vi.spyOn(LoggerService, 'noticeError').mockImplementation(() => {})
    const { loadFailed, load } = useChapterImpact()

    await load('group-1')

    expect(loadFailed.value).toBe(true)
  })

  describe('refresh', () => {
    it('updates impact without flipping isLoading, so a caller can refetch in the background', async () => {
      getNTHSChapterImpact.mockResolvedValue({ data: { impact: IMPACT } })
      const { impact, isLoading, load, refresh } = useChapterImpact()
      await load('group-1')

      const updated = {
        ...IMPACT,
        schoolYearToDate: { ...IMPACT.schoolYearToDate, membersTutoring: 2 },
      }
      getNTHSChapterImpact.mockResolvedValueOnce({ data: { impact: updated } })
      const refreshPromise = refresh('group-1')
      expect(isLoading.value).toBe(false)
      await refreshPromise

      expect(impact.value).toEqual(updated)
      expect(isLoading.value).toBe(false)
    })

    it('keeps the newest refresh when an older one resolves after it', async () => {
      const newer = { ...IMPACT, groupId: 'newer' }
      let resolveOlder!: (value: unknown) => void
      getNTHSChapterImpact
        .mockReturnValueOnce(new Promise((resolve) => (resolveOlder = resolve)))
        .mockResolvedValueOnce({ data: { impact: newer } })
      const { impact, refresh } = useChapterImpact()

      const olderRefresh = refresh('group-1')
      await refresh('group-1')
      resolveOlder({ data: { impact: IMPACT } })
      await olderRefresh

      expect(impact.value).toEqual(newer)
    })
  })
})
