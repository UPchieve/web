import {
  getSharedStats,
  hasSharedInfo,
  SHORT_STAT_LABELS,
} from '@/utils/volunteer-shared-stats'
import { describe, expect, it } from 'vitest'

describe('getSharedStats', () => {
  it('returns only the shared stats, in display order', () => {
    expect(
      getSharedStats({ totalVolunteerHours: 1.75, numSessionsTutored: 3 })
    ).toEqual([
      { key: 'numSessionsTutored', value: 3, label: 'sessions' },
      { key: 'totalVolunteerHours', value: 1.75, label: 'hours tutored' },
    ])
  })

  it('uses singular labels for a value of 1 and keeps 0 values', () => {
    expect(
      getSharedStats(
        { numStudentsHelped: 1, numSessionsTutored: 0 },
        SHORT_STAT_LABELS
      ).map((stat) => `${stat.value} ${stat.label}`)
    ).toEqual(['0 sessions', '1 student'])
  })
})

describe('hasSharedInfo', () => {
  it.each([
    [undefined, false],
    [{}, false],
    [{ occupation: [] }, false],
    [{ occupation: ['Working full-time'] }, true],
    [{ numSessionsTutored: 0 }, true],
    [{ totalVolunteerHours: 2 }, true],
  ])('returns the right answer for %j', (info, expected) => {
    expect(hasSharedInfo(info)).toBe(expected)
  })
})
