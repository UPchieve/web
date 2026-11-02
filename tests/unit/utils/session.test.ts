import { dayjs } from '@/utils/time-utils'
import { getWaitTimeDisplay } from '@/utils/session'

describe('getWaitTimeDisplay', () => {
  const ONE_HOUR = dayjs.duration(1, 'hour')
  const ONE_HOUR_20_MINUTES = dayjs.duration(80, 'minutes')
  const THREE_SECONDS = dayjs.duration(3, 'seconds')
  const FIFTEEN_SECONDS = dayjs.duration(15, 'seconds')
  const ONE_MINUTE_TWENTY_SECONDS = dayjs.duration(80, 'seconds')
  const FIFTEEN_MINUTES_THREE_SECONDS = dayjs.duration(15 * 60 + 3, 'seconds')
  it.each([
    [ONE_HOUR, '1hr+'],
    [ONE_HOUR_20_MINUTES, '1hr+'],
    [THREE_SECONDS, '0:03'],
    [FIFTEEN_SECONDS, '0:15'],
    [ONE_MINUTE_TWENTY_SECONDS, '1:20'],
    [FIFTEEN_MINUTES_THREE_SECONDS, '15:03'],
  ])('Formats the duration into the correct string', (createdAgo, expected) => {
    const now = dayjs()
    const createdAt = now.subtract(createdAgo).toDate()
    expect(getWaitTimeDisplay({ createdAt })).toEqual(expected)
  })
})
