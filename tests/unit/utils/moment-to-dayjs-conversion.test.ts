import { dayjs } from '@/utils/time-utils'
import moment from 'moment-timezone'
import { describe, expect, it } from 'vitest'

//github.com/you-dont-need/You-Dont-Need-Momentjs?tab=readme-ov-file

const createdAt = '2025-04-12T12:48:24.738Z'

describe('moment to dayjs guide', () => {
  it('format - no plugin', () => {
    expect(moment(createdAt).format('h:mm a')).toEqual(
      dayjs(createdAt).format('h:mm a')
    )
    expect(moment(createdAt).format('MM/DD/YYYY')).toEqual(
      dayjs(createdAt).format('MM/DD/YYYY')
    )

    expect(moment().format('MMMM_D')).toEqual(dayjs().format('MMMM_D'))
  })
  it('elapsed months', () => {
    expect(moment().diff(moment(createdAt), 'months')).toEqual(
      dayjs().diff(dayjs(createdAt), 'months')
    )
  })

  it('time utils usage', () => {
    const aug1mo = moment().month('August').date(1)
    const aug1day = dayjs().month(7).date(1)
    expect(aug1mo.date()).toEqual(aug1day.date())

    expect(moment().isBefore(aug1mo, 'day')).toEqual(
      dayjs().isBefore(aug1day, 'day')
    )
    expect(aug1mo.subtract(1, 'year').date()).toEqual(
      aug1day.subtract(1, 'year').date()
    )
  })

  it('relative time plugin', () => {
    expect(moment(createdAt).fromNow()).toEqual(dayjs(createdAt).fromNow())
  })
  it('manipulation', () => {
    expect(moment(createdAt).add(1, 'day').endOf('day').toDate()).toEqual(
      dayjs(createdAt).add(1, 'day').endOf('day').toDate()
    )
    expect(moment().add(7, 'days').endOf('day').format('YYYY-MM-DD')).toEqual(
      dayjs().add(7, 'days').endOf('day').format('YYYY-MM-DD')
    )
    expect(moment(createdAt).endOf('day').toDate(), 'endOf').toEqual(
      dayjs(createdAt).endOf('day').toDate()
    )
    expect(moment(createdAt).startOf('day').toDate(), 'startOf').toEqual(
      dayjs(createdAt).startOf('day').toDate()
    )

    expect(moment().subtract(7, 'days').format('YYYY-MM-DD')).toEqual(
      dayjs().subtract(7, 'days').format('YYYY-MM-DD')
    )
  })

  it('advancedFormat plugin', () => {
    expect(moment(createdAt).local().format('MMMM Do, YYYY')).toEqual(
      dayjs(createdAt).format('MMMM Do, YYYY')
    )
  })

  it('localizedFormat plugin', () => {
    expect(moment(createdAt).local().format('LT')).toEqual(
      dayjs(createdAt).format('LT')
    )
    expect(moment(createdAt).format('l, h:mm a')).toEqual(
      dayjs(createdAt).format('l, h:mm a')
    )
    expect(moment(createdAt).format('l, h:mm:ss a')).toEqual(
      dayjs(createdAt).format('l, h:mm:ss a')
    )
    expect(moment(createdAt).format('l @ h:mm A')).toEqual(
      dayjs(createdAt).format('l @ h:mm A')
    )
  })

  it('timezones plugin', () => {
    const estUtcOffset = moment.tz.zone('America/New_York').parse(Date.now())
    const userUtcOffset = moment.tz
      .zone('America/Mexico_City')
      .parse(Date.now())
    const offset = (estUtcOffset - userUtcOffset) / 60

    const estUtcDayjsOffset = dayjs
      .tz(Date.now(), 'America/Mexico_City')
      .utcOffset()
    const userUtcDayOffset = dayjs
      .tz(Date.now(), 'America/New_York')
      .utcOffset()
    const dayjsOffset = (estUtcDayjsOffset - userUtcDayOffset) / 60

    expect(offset).toEqual(dayjsOffset)

    expect(
      moment(createdAt).utc().startOf('day').format('MM-DD-YYYY hh:mm:ss')
    ).toEqual(
      dayjs(createdAt).utc().startOf('day').format('MM-DD-YYYY hh:mm:ss')
    )
  })

  it('relative', () => {
    expect(moment(createdAt).isAfter(moment())).toBe(false)
    expect(moment(createdAt).isBefore(moment())).toBe(true)
    expect(moment(createdAt).isSameOrAfter(moment())).toBe(false)
    expect(moment(createdAt).isSameOrBefore(moment())).toBe(true)

    expect(dayjs(createdAt).isAfter(dayjs())).toBe(false)
    expect(dayjs(createdAt).isBefore(dayjs())).toBe(true)
    expect(
      dayjs(createdAt).isSame(dayjs()) || dayjs(createdAt).isAfter(dayjs())
    ).toBe(false)
    expect(
      dayjs(createdAt).isSame(dayjs()) || dayjs(createdAt).isBefore(dayjs())
    ).toBe(true)

    expect(moment(createdAt).diff(moment())).toEqual(
      dayjs(createdAt).diff(dayjs())
    )
  })
  it('validity', () => {
    expect(moment('10-26-1982', 'MM-DD-YYYY', true).isValid()).toBe(true)
    expect(moment('13-26-1982', 'MM-DD-YYYY', true).isValid()).toBe(false)
    expect(moment('10/26/1982', 'MM-DD-YYYY', true).isValid()).toBe(false)

    expect(dayjs('10-26-1982', 'MM-DD-YYYY', undefined, true).isValid()).toBe(
      true
    )
    expect(dayjs('13-26-1982', 'MM-DD-YYYY', undefined, true).isValid()).toBe(
      false
    )
    expect(dayjs('10/26/1982', 'MM-DD-YYYY', undefined, true).isValid()).toBe(
      false
    )
    expect(moment('10/22/2024', 'MM/DD/YYYY').valueOf()).toEqual(
      dayjs('10/22/2024', 'MM/DD/YYYY').valueOf()
    )
    expect(
      moment('10/22/2025', 'MM/DD/YYYY').diff(
        moment('10/23/2024', 'MM/DD/YYYY')
      )
    ).toEqual(
      dayjs('10/22/2025', 'MM/DD/YYYY').diff(dayjs('10/23/2024', 'MM/DD/YYYY'))
    )
  })
  it('compares', () => {
    const threshold = moment(null)
    const studentSignUpDate = moment(createdAt)

    expect(studentSignUpDate >= threshold).toBe(false)
    const dthreshold = dayjs(null)
    const dstudentSignUpDate = dayjs(createdAt)

    expect(dstudentSignUpDate >= dthreshold).toBe(false)
  })
})
