import { useChapterImpact } from '@/composables/useChapterImpact'
import LoggerService from '@/services/LoggerService'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { impact } from '../fixtures/nths'

const getNTHSChapterImpact = vi.fn()
vi.mock('@/services/NetworkService', () => ({
  getNTHSChapterImpact: (...args: unknown[]) => getNTHSChapterImpact(...args),
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
  vi.spyOn(LoggerService, 'noticeError').mockImplementation(() => {})
})

function pending() {
  let settle!: { resolve: (v: unknown) => void; reject: (e: unknown) => void }
  const promise = new Promise(
    (resolve, reject) => (settle = { resolve, reject })
  )
  return { promise, settle }
}

describe('useChapterImpact', () => {
  it('reports failure when the first load fails', async () => {
    getNTHSChapterImpact.mockRejectedValueOnce(new Error('network down'))
    const { loadFailed, load } = useChapterImpact()

    await load('group-1')

    expect(loadFailed.value).toBe(true)
  })

  it('keeps the shown numbers and reports no failure when a later load fails', async () => {
    getNTHSChapterImpact
      .mockResolvedValueOnce({ impact: IMPACT })
      .mockRejectedValueOnce(new Error('network down'))
    const { impact, loadFailed, load } = useChapterImpact()

    await load('group-1')
    await load('group-1')

    expect(impact.value).toEqual(IMPACT)
    expect(loadFailed.value).toBe(false)
  })

  it('clears an earlier failure when the next load starts, then shows its numbers', async () => {
    const next = pending()
    getNTHSChapterImpact
      .mockRejectedValueOnce(new Error('network down'))
      .mockReturnValueOnce(next.promise)
    const { impact, loadFailed, load } = useChapterImpact()
    await load('group-1')

    const nextLoad = load('group-1')
    expect(loadFailed.value).toBe(false)
    next.settle.resolve({ impact: IMPACT })
    await nextLoad

    expect(impact.value).toEqual(IMPACT)
  })

  it('keeps the newest numbers when an older load resolves after it', async () => {
    const newer = { ...IMPACT, groupId: 'newer' }
    const older = pending()
    getNTHSChapterImpact
      .mockReturnValueOnce(older.promise)
      .mockResolvedValueOnce({ impact: newer })
    const { impact, load } = useChapterImpact()

    const olderLoad = load('group-1')
    await load('group-1')
    older.settle.resolve({ impact: IMPACT })
    await olderLoad

    expect(impact.value).toEqual(newer)
  })

  it('reports no failure when an older load fails while a newer one is in flight', async () => {
    const older = pending()
    getNTHSChapterImpact
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(new Promise(() => {}))
    const { loadFailed, load } = useChapterImpact()

    const olderLoad = load('group-1')
    void load('group-1')
    older.settle.reject(new Error('network down'))
    await olderLoad

    expect(loadFailed.value).toBe(false)
  })

  it("shows an older load's numbers when the newer one failed with none shown", async () => {
    const older = pending()
    getNTHSChapterImpact
      .mockReturnValueOnce(older.promise)
      .mockRejectedValueOnce(new Error('network down'))
    const { impact, loadFailed, load } = useChapterImpact()

    const olderLoad = load('group-1')
    await load('group-1')
    older.settle.resolve({ impact: IMPACT })
    await olderLoad

    expect(impact.value).toEqual(IMPACT)
    expect(loadFailed.value).toBe(false)
  })
})
