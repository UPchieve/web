export function hoursToHoursAndMinutes(
  totalHours: number,
  formatFn?: ({ hours, minutes }: { hours: number; minutes: number }) => string
) {
  const hours = Math.floor(totalHours)
  const minutes = Math.round((totalHours - hours) * 60)
  return formatFn ? formatFn({ hours, minutes }) : { hours, minutes }
}
