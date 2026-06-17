import { afterEach } from 'vitest'
import { dayjs } from '../../../src/utils/time-utils'
import { getAcademicYear } from '../../../src/utils/academic-year'

describe('getAcademicYear', () => {
  type TestCase = {
    currentDate: Date
    expected: {
      yearStart: number
      yearEnd: number
      asString: string
    }
  }
  const testCases: TestCase[] = [
    // January 2026 is 2025-2026
    {
      currentDate: dayjs().set('year', 2026).set('month', 0),
      expected: {
        yearStart: 2025,
        yearEnd: 2026,
        asString: '2025-2026',
      },
    },
    // June 30, 2026 is 2025-2026
    {
      currentDate: dayjs().set('year', 2026).set('month', 5).set('date', 30),
      expected: {
        yearStart: 2025,
        yearEnd: 2026,
        asString: '2025-2026',
      },
    },
    // July 1, 2026 is 2026-2027
    {
      currentDate: dayjs().set('year', 2026).set('month', 6).set('date', 1),
      expected: {
        yearStart: 2026,
        yearEnd: 2027,
        asString: '2026-2027',
      },
    },
    // November 1, 2026 is 2026-2027
    {
      currentDate: dayjs().set('year', 2026).set('month', 11).set('date', 1),
      expected: {
        yearStart: 2026,
        yearEnd: 2027,
        asString: '2026-2027',
      },
    },
  ]

  afterEach(() => {
    vitest.useRealTimers().setSystemTime(vitest.getRealSystemTime())
  })

  it.each(testCases)(
    'calculates the correct academic year with a June 30 cutoff',
    (testCase) => {
      vitest.useFakeTimers().setSystemTime(testCase.currentDate)
      const actual = getAcademicYear()
      expect(actual).toEqual(testCase.expected)
    }
  )
})
