import { useChapterImpact } from '@/composables/useChapterImpact'
import LoggerService from '@/services/LoggerService'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { impact } from '../fixtures/nths'

const getNTHSChapterImpact = vi.fn()
vi.mock('@/services/NetworkService', () => ({
  default: {
    getNTHSChapterImpact: (...args: unknown[]) => getNTHSChapterImpact(...args),
  },
}))

const NOW = new Date('2026-10-15T12:00:00.000Z')

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

function periodStartRejection() {
  return Object.assign(new Error('period start too far off'), { status: 422 })
}

beforeEach(() => {
  getNTHSChapterImpact.mockReset()
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('useChapterImpact', () => {
  it('retries once without monthStartsAt when the server rejects it (422), and the data still shows', async () => {
    getNTHSChapterImpact
      .mockRejectedValueOnce(periodStartRejection())
      .mockResolvedValueOnce({ data: { impact: IMPACT } })
    const { impact, isLoading, loadFailed, load } = useChapterImpact()

    await load('group-1', NOW)

    expect(getNTHSChapterImpact).toHaveBeenCalledTimes(2)
    expect(getNTHSChapterImpact.mock.calls[0][1]).not.toBeUndefined()
    expect(getNTHSChapterImpact.mock.calls[1]).toEqual(['group-1'])
    expect(loadFailed.value).toBe(false)
    expect(isLoading.value).toBe(false)
    expect(impact.value).toEqual(IMPACT)
  })

  it('does not retry, and reports failure, for a rejection that is not the period-start 422', async () => {
    getNTHSChapterImpact.mockRejectedValueOnce(new Error('network down'))
    vi.spyOn(LoggerService, 'noticeError').mockImplementation(() => {})
    const { loadFailed, load } = useChapterImpact()

    await load('group-1', NOW)

    expect(getNTHSChapterImpact).toHaveBeenCalledTimes(1)
    expect(loadFailed.value).toBe(true)
  })

  describe('refresh', () => {
    it('updates impact without flipping isLoading, so a caller can refetch in the background', async () => {
      getNTHSChapterImpact.mockResolvedValue({ data: { impact: IMPACT } })
      const { impact, isLoading, load, refresh } = useChapterImpact()
      await load('group-1', NOW)

      const updated = {
        ...IMPACT,
        schoolYearToDate: { ...IMPACT.schoolYearToDate, membersTutoring: 2 },
      }
      getNTHSChapterImpact.mockResolvedValueOnce({ data: { impact: updated } })
      const refreshPromise = refresh('group-1', NOW)
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

      const olderRefresh = refresh('group-1', NOW)
      await refresh('group-1', NOW)
      resolveOlder({ data: { impact: IMPACT } })
      await olderRefresh

      expect(impact.value).toEqual(newer)
    })
  })
})
