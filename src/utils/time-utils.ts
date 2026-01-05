import moment, { type Moment } from 'moment'

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

export function getCurrentSchoolYearStartDate(): Moment {
  const augustFirst = moment().month('August').date(1)
  if (moment().isBefore(augustFirst, 'day')) {
    augustFirst.subtract(1, 'year')
  }
  return augustFirst
}

export const secondsInMs = (second: number) => second * 1000
export const minutesInMs = (minute: number) => minute * secondsInMs(60)
export const hoursInMs = (hour: number) => hour * minutesInMs(60)
export const minutesInSeconds = (minutes: number) => minutes * 60
export const hoursInSeconds = (hour: number) => hour * minutesInSeconds(60)
