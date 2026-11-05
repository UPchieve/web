import { dayjs } from '@/utils/time-utils'
import { getWaitTime } from '@/utils/session'

describe('getWaitTime', () => {
  const ONE_HOUR = dayjs.duration(1, 'hour')
  const ONE_HOUR_20_MINUTES = dayjs.duration(80, 'minutes')
  const TWENTY_FOUR_HOURS_FIVE_MINUTES = dayjs.duration(24 * 60 + 5, 'minutes')
  const TWENTY_FIVE_HOURS = dayjs.duration(25, 'hours')
  const THREE_SECONDS = dayjs.duration(3, 'seconds')
  const FIFTEEN_SECONDS = dayjs.duration(15, 'seconds')
  const ONE_MINUTE_TWENTY_SECONDS = dayjs.duration(80, 'seconds')
  const FIFTEEN_MINUTES_THREE_SECONDS = dayjs.duration(15 * 60 + 3, 'seconds')
  it.each([
    [ONE_HOUR, '1hr+'],
    [ONE_HOUR_20_MINUTES, '1hr+'],
    [TWENTY_FOUR_HOURS_FIVE_MINUTES, '24hr+'],
    [TWENTY_FIVE_HOURS, '25hr+'],
    [THREE_SECONDS, '0:03'],
    [FIFTEEN_SECONDS, '0:15'],
    [ONE_MINUTE_TWENTY_SECONDS, '1:20'],
    [FIFTEEN_MINUTES_THREE_SECONDS, '15:03'],
  ])('Formats the duration into the correct string', (createdAgo, expected) => {
    const now = dayjs()
    const createdAt = now.subtract(createdAgo).toDate()
    expect(getWaitTime({ createdAt }).displayValue).toEqual(expected)
  })
})
