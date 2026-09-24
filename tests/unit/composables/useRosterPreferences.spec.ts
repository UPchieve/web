import { useRosterPreferences } from '@/composables/useRosterPreferences'
import { DEFAULT_ROSTER_SORT } from '@/services/NTHSRosterService'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const USER_ID = 'president-1'
const STORAGE_KEY = `${USER_ID}-nths-roster-view`

beforeEach(() => localStorage.clear())
afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('useRosterPreferences', () => {
  it('starts a viewer with no earlier choice on this week and the default sort', () => {
    const { period, sort } = useRosterPreferences(USER_ID)

    expect(period.value).toBe('thisWeek')
    expect(sort.value).toEqual(DEFAULT_ROSTER_SORT)
  })

  it("does not show one user's saved choice to another user on the same browser", async () => {
    const first = useRosterPreferences(USER_ID)
    first.period.value = 'allTime'
    first.sort.value = { key: 'hours', direction: 'asc' }
    await nextTick()

    const { period, sort } = useRosterPreferences('other-user')
    expect(period.value).toBe('thisWeek')
    expect(sort.value).toEqual(DEFAULT_ROSTER_SORT)
  })

  it.each([
    [
      'an unknown period and sort',
      JSON.stringify({
        period: 'lastYear',
        sort: { key: 'unknown', direction: 'asc' },
      }),
    ],
    ['malformed JSON', '{period: thisMonth'],
  ])('falls back to the default for %s', (_, stored) => {
    localStorage.setItem(STORAGE_KEY, stored)

    const { period, sort } = useRosterPreferences(USER_ID)

    expect(period.value).toBe('thisWeek')
    expect(sort.value).toEqual(DEFAULT_ROSTER_SORT)
  })

  it('keeps a valid stored period when the stored sort is invalid', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ period: 'allTime', sort: { key: 'unknown' } })
    )

    const { period, sort } = useRosterPreferences(USER_ID)

    expect(period.value).toBe('allTime')
    expect(sort.value).toEqual(DEFAULT_ROSTER_SORT)
  })

  it('uses the defaults and keeps working when storage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    const { period, sort } = useRosterPreferences(USER_ID)
    expect(period.value).toBe('thisWeek')
    expect(sort.value).toEqual(DEFAULT_ROSTER_SORT)

    const consoleError = vi.spyOn(console, 'error')
    period.value = 'thisMonth'
    await nextTick()
    expect(period.value).toBe('thisMonth')
    expect(consoleError).not.toHaveBeenCalled()
  })
})
