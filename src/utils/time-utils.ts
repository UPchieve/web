import D, { type Dayjs } from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import advancedFormat from 'dayjs/plugin/advancedFormat'

D.extend(localizedFormat)
D.extend(relativeTime)
D.extend(customParseFormat)
D.extend(utc)
D.extend(timezone)
D.extend(advancedFormat)

export const dayjs = D

export function hoursToHoursAndMinutes(
  totalHours: number,
  formatFn?: ({ hours, minutes }: { hours: number; minutes: number }) => string
) {
  const hours = Math.floor(totalHours)
  const minutes = Math.round((totalHours - hours) * 60)
  return formatFn ? formatFn({ hours, minutes }) : { hours, minutes }
}

export function minutesToHoursAndMinutes(
  totalMinutes: number,
  formatFn?: ({ hours, minutes }: { hours: number; minutes: number }) => string
) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return formatFn ? formatFn({ hours, minutes }) : { hours, minutes }
}

const DAYJS_AUGUST_MONTH = 7
export function getCurrentSchoolYearStartDate(): Dayjs {
  const augustFirst = dayjs().month(DAYJS_AUGUST_MONTH).date(1)
  if (dayjs().isBefore(augustFirst, 'day')) {
    return augustFirst.subtract(1, 'year')
  }
  return augustFirst
}

export const secondsInMs = (second: number) => second * 1000
export const minutesInMs = (minute: number) => minute * secondsInMs(60)
export const hoursInMs = (hour: number) => hour * minutesInMs(60)
export const minutesInSeconds = (minutes: number) => minutes * 60
export const hoursInSeconds = (hour: number) => hour * minutesInSeconds(60)
