import { memberStatus } from '@/services/NTHSMembersTableService'
import { describe, expect, it } from 'vitest'
import { member, NO_PERIOD_ACTIVITY } from '../fixtures/nths'

describe('memberStatus', () => {
  it.each([
    {
      trainingComplete: false,
      safetyApproved: false,
      thisWeek: 2,
      expected: 'needs-training',
    },
    {
      trainingComplete: false,
      safetyApproved: true,
      thisWeek: 2,
      expected: 'needs-training',
    },
    {
      trainingComplete: true,
      safetyApproved: false,
      thisWeek: 2,
      expected: 'needs-approval',
    },
    {
      trainingComplete: true,
      safetyApproved: true,
      thisWeek: 0.5,
      expected: 'active-this-week',
    },
    {
      trainingComplete: true,
      safetyApproved: true,
      thisWeek: 0,
      expected: 'no-hours-this-week',
    },
  ])(
    'is $expected for training $trainingComplete, approved $safetyApproved, $thisWeek hours this week',
    ({ trainingComplete, safetyApproved, thisWeek, expected }) => {
      const subject = member({
        trainingComplete,
        safetyApproved,
        periodHours: { ...NO_PERIOD_ACTIVITY, thisWeek },
      })

      expect(memberStatus(subject)).toBe(expected)
    }
  )
})
