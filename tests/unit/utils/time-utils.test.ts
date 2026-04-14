import { describe, it, expect, vi } from 'vitest'
import {
  hoursToHoursAndMinutes,
  minutesToHoursAndMinutes,
  getCurrentSchoolYearStartDate,
} from '../../../src/utils/time-utils'
import { dayjs } from '@/utils/time-utils'

describe('hoursToHoursAndMinutes', () => {
  it.each([
    [1, { hours: 1, minutes: 0 }],
    [1.5, { hours: 1, minutes: 30 }],
    [2.25, { hours: 2, minutes: 15 }],
    [0.75, { hours: 0, minutes: 45 }],
    [3.1, { hours: 3, minutes: 6 }],
  ])('converts %f hours to hours and minutes', (input, expected) => {
    expect(hoursToHoursAndMinutes(input)).toEqual(expected)
  })

  it('formats output using provided format function', () => {
    const formatFn = ({ hours, minutes }: { hours: number; minutes: number }) =>
      `${hours}h ${minutes}m`
    expect(hoursToHoursAndMinutes(2.5, formatFn)).toBe('2h 30m')
  })
})

describe('minutesToHoursAndMinutes', () => {
  it.each([
    [60, { hours: 1, minutes: 0 }],
    [90, { hours: 1, minutes: 30 }],
    [135, { hours: 2, minutes: 15 }],
    [45, { hours: 0, minutes: 45 }],
    [186, { hours: 3, minutes: 6 }],
  ])('converts %i minutes to hours and minutes', (input, expected) => {
    expect(minutesToHoursAndMinutes(input)).toEqual(expected)
  })

  it('formats output using provided format function', () => {
    const formatFn = ({ hours, minutes }: { hours: number; minutes: number }) =>
      `${hours}h ${minutes}m`
    expect(minutesToHoursAndMinutes(150, formatFn)).toBe('2h 30m')
  })
})

describe('getCurrentSchoolYearStartDate', () => {
  it('returns August 1st of current year when before August 1st', () => {
    const mockDate = dayjs('2025-07-15')
    vi.setSystemTime(mockDate.toDate())

    const result = getCurrentSchoolYearStartDate()
    expect(result.format('YYYY-MM-DD')).toBe('2024-08-01')
  })

  it('returns August 1st of current year when after August 1st', () => {
    const mockDate = dayjs('2025-09-15')
    vi.setSystemTime(mockDate.toDate())

    const result = getCurrentSchoolYearStartDate()
    expect(result.format('YYYY-MM-DD')).toBe('2025-08-01')
  })

  it('returns August 1st of current year when exactly on August 1st', () => {
    const mockDate = dayjs('2025-08-01')
    vi.setSystemTime(mockDate.toDate())

    const result = getCurrentSchoolYearStartDate()
    expect(result.format('YYYY-MM-DD')).toBe('2025-08-01')
  })
})
