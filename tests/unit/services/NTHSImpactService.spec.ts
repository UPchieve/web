import { describe, expect, it } from 'vitest'
import {
  formatDecimalHours,
  formatProgressHours,
  meterPercent,
  nextStepFor,
  standingFor,
} from '@/services/NTHSImpactService'
import { impact } from '../fixtures/nths'

describe('standingFor', () => {
  it.each([
    {
      name: 'pending when not official, even at the hours goal',
      official: false,
      hours: 40,
      standing: 'pending',
    },
    {
      name: 'official under the hours goal',
      official: true,
      hours: 39.9,
      standing: 'official',
    },
    {
      name: 'official in good standing exactly at the goal',
      official: true,
      hours: 40,
      standing: 'official-good-standing',
    },
  ])('is $name', ({ official, hours, standing }) => {
    expect(
      standingFor(
        impact({
          official,
          schoolYearToDate: {
            studentsHelped: 2,
            sessionsCompleted: 4,
            hoursTutored: hours,
            membersTutoring: 2,
          },
        })
      )
    ).toBe(standing)
  })
})

describe('nextStepFor', () => {
  it.each([
    {
      name: 'invite, 3 short with no members',
      members: 0,
      tutoring: 0,
      hours: 0,
      official: false,
      step: { kind: 'invite', gap: 3 },
    },
    {
      name: 'invite, 1 short',
      members: 2,
      tutoring: 2,
      hours: 30,
      official: true,
      step: { kind: 'invite', gap: 1 },
    },
    {
      name: 'first session, 2 short, ahead of hours',
      members: 3,
      tutoring: 1,
      hours: 5,
      official: true,
      step: { kind: 'first-session', gap: 2 },
    },
    {
      name: 'first session for a pending chapter',
      members: 5,
      tutoring: 2,
      hours: 1,
      official: false,
      step: { kind: 'first-session', gap: 1 },
    },
    {
      name: 'hours as minutes, exact',
      members: 3,
      tutoring: 3,
      hours: 22.75,
      official: true,
      step: { kind: 'hours', gap: 1035 },
    },
    {
      name: 'hours rounded up to the whole minute',
      members: 3,
      tutoring: 3,
      hours: 39.99,
      official: true,
      step: { kind: 'hours', gap: 1 },
    },
    {
      name: 'nothing once every goal is met',
      members: 3,
      tutoring: 3,
      hours: 40,
      official: true,
      step: null,
    },
    {
      name: 'nothing for a pending chapter with 3 tutoring',
      members: 3,
      tutoring: 3,
      hours: 2,
      official: false,
      step: null,
    },
  ])('gives $name', ({ members, tutoring, hours, official, step }) => {
    expect(
      nextStepFor(
        impact({
          official,
          schoolYearToDate: {
            studentsHelped: 2,
            sessionsCompleted: 4,
            hoursTutored: hours,
            membersTutoring: tutoring,
          },
        }),
        members
      )
    ).toEqual(step)
  })
})

describe('formatDecimalHours', () => {
  it('rounds to one decimal and drops a trailing zero', () => {
    expect(formatDecimalHours(1873.25)).toBe('1873.3')
    expect(formatDecimalHours(12.5)).toBe('12.5')
    expect(formatDecimalHours(30)).toBe('30')
    expect(formatDecimalHours(143.75)).toBe('143.8')
  })
})

describe('formatProgressHours', () => {
  it.each([
    [0, '0'],
    [0.02, '<0.1'],
    [39.96, '39.9'],
    [40, '40'],
    [158.97, '158.9'],
  ])('shows %s hours as %s, rounded toward zero', (hours, expected) => {
    expect(formatProgressHours(hours)).toBe(expected)
  })
})

describe('meterPercent', () => {
  it('clamps an exceeded goal to a full bar', () => {
    expect(meterPercent(42, 40)).toBe(100)
    expect(meterPercent(20, 40)).toBe(50)
    expect(meterPercent(0, 40)).toBe(0)
  })
})
