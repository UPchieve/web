import {
  isProfileInfoField,
  toPublicProfileInfoShared,
} from '@/utils/build-share-info-message'
import { describe, expect, it } from 'vitest'

const COACH = {
  occupations: ['Working full-time'],
  numSessionsTutored: 12,
  numStudentsTutored: 7,
  totalHoursTutored: 9.5,
}

describe('toPublicProfileInfoShared', () => {
  it('includes only the fields the coach chose to share', () => {
    expect(
      toPublicProfileInfoShared(COACH, ['occupation', 'numStudentsHelped'])
    ).toEqual({ occupation: ['Working full-time'], numStudentsHelped: 7 })
  })

  it('leaves online status off the info card', () => {
    expect(
      toPublicProfileInfoShared(COACH, ['totalVolunteerHours', 'onlineStatus'])
    ).toEqual({ totalVolunteerHours: 9.5 })
    expect(toPublicProfileInfoShared(COACH, ['onlineStatus'])).toEqual({})
  })
})

describe('isProfileInfoField', () => {
  it('is true for card fields and false for online status', () => {
    expect(isProfileInfoField('occupation')).toBe(true)
    expect(isProfileInfoField('onlineStatus')).toBe(false)
  })
})
