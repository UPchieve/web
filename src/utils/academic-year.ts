import { dayjs } from '@/utils/time-utils'

export function getAcademicYear(): {
  yearStart: number
  yearEnd: number
  asString: string
} {
  // We want the most recent academic year that the student is in or has completed
  // to work with the grade level calculation on the backend. Consider July 1 the start of the school year.
  const today = dayjs()
  const JULY_MONTH = 6 // 0-indexed
  let yearStart: null | number
  let yearEnd: null | number
  if (today.month() >= JULY_MONTH) {
    yearStart = today.year()
    yearEnd = today.year() + 1
  } else {
    yearStart = today.year() - 1
    yearEnd = today.year()
  }

  return {
    asString: `${yearStart.toString()}-${yearEnd.toString()}`,
    yearStart,
    yearEnd,
  }
}
