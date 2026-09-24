import { useChapterRoster } from '@/composables/useChapterRoster'
import LoggerService from '@/services/LoggerService'
import { rosterPeriodStarts } from '@/services/NTHSRosterService'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { member, rosterResponse, topTutor } from '../fixtures/nths'

const getNTHSChapterRoster = vi.fn()
vi.mock('@/services/NetworkService', () => ({
  default: {
    getNTHSChapterRoster: (...args: unknown[]) => getNTHSChapterRoster(...args),
  },
}))

const NOW = new Date('2026-10-15T12:00:00.000Z')

const MEMBERS = [member()]

function periodStartRejection() {
  return Object.assign(new Error('period start too far off'), { status: 422 })
}

beforeEach(() => {
  getNTHSChapterRoster.mockReset()
  vi.spyOn(LoggerService, 'noticeError').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('useChapterRoster', () => {
  it('retries once without period starts when the server rejects them (422), and the data still shows', async () => {
    getNTHSChapterRoster
      .mockRejectedValueOnce(periodStartRejection())
      .mockResolvedValueOnce(rosterResponse(MEMBERS))
    const { members, isLoading, loadFailed, load } = useChapterRoster()

    await load('group-1', NOW)

    expect(getNTHSChapterRoster).toHaveBeenCalledTimes(2)
    expect(getNTHSChapterRoster.mock.calls[0][1]).toEqual(
      rosterPeriodStarts(NOW)
    )
    expect(getNTHSChapterRoster.mock.calls[1]).toEqual(['group-1'])
    expect(loadFailed.value).toBe(false)
    expect(isLoading.value).toBe(false)
    expect(members.value).toEqual(MEMBERS)
  })

  it('does not retry, and reports failure, for a rejection that is not the period-start 422', async () => {
    getNTHSChapterRoster.mockRejectedValueOnce(new Error('network down'))
    const { loadFailed, load } = useChapterRoster()

    await load('group-1', NOW)

    expect(getNTHSChapterRoster).toHaveBeenCalledTimes(1)
    expect(loadFailed.value).toBe(true)
  })

  it('still reports failure when the retry itself fails', async () => {
    getNTHSChapterRoster
      .mockRejectedValueOnce(periodStartRejection())
      .mockRejectedValueOnce(new Error('still down'))
    const { loadFailed, load } = useChapterRoster()

    await load('group-1', NOW)

    expect(getNTHSChapterRoster).toHaveBeenCalledTimes(2)
    expect(loadFailed.value).toBe(true)
  })

  describe('refresh', () => {
    it('updates members and the top tutor without flipping isLoading, so a caller can refetch in the background', async () => {
      getNTHSChapterRoster.mockResolvedValue(rosterResponse(MEMBERS))
      const { members, topTutorThisMonth, isLoading, load, refresh } =
        useChapterRoster()
      await load('group-1', NOW)

      const newTopTutor = topTutor()
      getNTHSChapterRoster.mockResolvedValueOnce(
        rosterResponse([], { topTutorThisMonth: newTopTutor })
      )
      const refreshPromise = refresh('group-1', NOW)
      expect(isLoading.value).toBe(false)
      await refreshPromise

      expect(members.value).toEqual([])
      expect(topTutorThisMonth.value).toEqual(newTopTutor)
      expect(isLoading.value).toBe(false)
    })

    it('keeps the newest refresh when an older one resolves after it', async () => {
      let resolveOlder!: (value: unknown) => void
      getNTHSChapterRoster
        .mockReturnValueOnce(new Promise((resolve) => (resolveOlder = resolve)))
        .mockResolvedValueOnce(rosterResponse([member({ roleName: 'admin' })]))
      const { members, refresh } = useChapterRoster()

      const olderRefresh = refresh('group-1', NOW)
      await refresh('group-1', NOW)
      resolveOlder(rosterResponse([member({ roleName: 'member' })]))
      await olderRefresh

      expect(members.value.map((m) => m.roleName)).toEqual(['admin'])
    })
  })
})
