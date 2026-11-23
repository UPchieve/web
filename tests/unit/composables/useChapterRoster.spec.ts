import { useChapterRoster } from '@/composables/useChapterRoster'
import LoggerService from '@/services/LoggerService'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { member, rosterResponse } from '../fixtures/nths'

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

describe('useChapterRoster', () => {
  it('retries once without period starts when the server rejects them (422), and the data still shows', async () => {
    getNTHSChapterRoster
      .mockRejectedValueOnce(periodStartRejection())
      .mockResolvedValueOnce(rosterResponse(MEMBERS))
    const { members, isLoading, loadFailed, load } = useChapterRoster()

    await load('group-1', NOW)

    expect(getNTHSChapterRoster).toHaveBeenCalledTimes(2)
    expect(getNTHSChapterRoster.mock.calls[0][1]).toEqual({
      thisWeek: new Date(2026, 9, 12),
      lastTwoWeeks: new Date(2026, 9, 5),
      thisMonth: new Date(2026, 9, 1),
    })
    expect(getNTHSChapterRoster.mock.calls[1]).toEqual(['group-1'])
    expect(loadFailed.value).toBe(false)
    expect(isLoading.value).toBe(false)
    expect(members.value).toEqual(MEMBERS)
  })

  it('keeps the rows on screen while a later load runs', async () => {
    getNTHSChapterRoster.mockResolvedValue(rosterResponse(MEMBERS))
    const { members, isLoading, isReloading, load } = useChapterRoster()
    await load('group-1', NOW)

    const pending = load('group-1', NOW)

    expect(isLoading.value).toBe(false)
    expect(isReloading.value).toBe(true)
    expect(members.value).toEqual(MEMBERS)
    await pending
    expect(isReloading.value).toBe(false)
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

  it('fails instead of retrying without the range, which would count 0 for everyone', async () => {
    getNTHSChapterRoster.mockRejectedValue(periodStartRejection())
    const { loadFailed, load } = useChapterRoster()

    await load('group-1', NOW, {
      startsAt: new Date('2026-10-01'),
      endsAt: NOW,
    })

    expect(getNTHSChapterRoster).toHaveBeenCalledTimes(1)
    expect(loadFailed.value).toBe(true)
  })

  it('asks for the range without the period starts', async () => {
    getNTHSChapterRoster.mockResolvedValue(rosterResponse(MEMBERS))
    const range = { startsAt: new Date('2026-10-01'), endsAt: NOW }

    await useChapterRoster().load('group-1', NOW, range)

    expect(getNTHSChapterRoster).toHaveBeenCalledWith(
      'group-1',
      undefined,
      range
    )
  })

  describe('refresh', () => {
    it('updates members without flipping isLoading, so a caller can refetch in the background', async () => {
      getNTHSChapterRoster.mockResolvedValue(rosterResponse(MEMBERS))
      const { members, isLoading, load, refresh } = useChapterRoster()
      await load('group-1', NOW)

      getNTHSChapterRoster.mockResolvedValueOnce(rosterResponse([]))
      const refreshPromise = refresh('group-1', NOW)
      expect(isLoading.value).toBe(false)
      await refreshPromise

      expect(members.value).toEqual([])
      expect(isLoading.value).toBe(false)
    })

    it('ends loading when a refresh supersedes the load in flight', async () => {
      let resolveLoad!: (value: unknown) => void
      getNTHSChapterRoster
        .mockReturnValueOnce(new Promise((resolve) => (resolveLoad = resolve)))
        .mockResolvedValueOnce(rosterResponse(MEMBERS))
      const { isLoading, load, refresh } = useChapterRoster()

      const loading = load('group-1', NOW)
      await refresh('group-1', NOW)
      resolveLoad(rosterResponse([]))
      await loading

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
