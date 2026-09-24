import { describe, expect, it } from 'vitest'
import {
  allTimeLine,
  formatDecimalHours,
  formatProgressHours,
  meterPercent,
  standingFor,
} from '@/services/NTHSImpactService'
import { impact } from '../fixtures/nths'

describe('standingFor', () => {
  it.each([
    {
      name: 'in progress while the chapter is short of three members',
      yearToDate: {},
      standing: 'in-progress',
    },
    {
      name: 'members met once three have tutored but the hours are short',
      yearToDate: { membersTutoring: 3 },
      standing: 'members-met',
    },
    {
      name: 'requirements met once both numbers reach their goal',
      yearToDate: { membersTutoring: 4, hoursTutored: 42 },
      standing: 'requirements-met',
    },
  ])('is $name', ({ yearToDate, standing }) => {
    expect(
      standingFor(
        impact({
          schoolYearToDate: {
            studentsHelped: 2,
            sessionsCompleted: 4,
            hoursTutored: 3,
            membersTutoring: 2,
            ...yearToDate,
          },
        })
      )
    ).toBe(standing)
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

describe('allTimeLine', () => {
  it('reports all-time hours and students helped, not sessions', () => {
    const line = allTimeLine(
      impact({
        allTime: {
          hoursTutored: 12.5,
          studentsHelped: 7,
          sessionsCompleted: 31,
        },
      })
    )
    expect(line).toContain('12.5')
    expect(line).toContain('7')
    expect(line).not.toContain('31')
  })

  it.each([
    [0, 'All time: 0 hours'],
    [0.02, 'All time: <0.1 hours'],
  ])('shows %s all-time hours as "%s"', (hoursTutored, expected) => {
    expect(
      allTimeLine(
        impact({
          allTime: { studentsHelped: 2, sessionsCompleted: 6, hoursTutored },
        })
      )
    ).toContain(expected)
  })
})

describe('formatProgressHours', () => {
  it('rounds toward zero while short of the goal, so it never looks complete early', () => {
    expect(formatProgressHours(39.96, 40)).toBe('39.9')
  })

  it.each([
    [0, '0'],
    [0.02, '<0.1'],
  ])('shows %s hours short of the goal as %s', (hours, expected) => {
    expect(formatProgressHours(hours, 40)).toBe(expected)
  })

  it('rounds normally once the goal is met', () => {
    expect(formatProgressHours(40, 40)).toBe('40')
    expect(formatProgressHours(42.37, 40)).toBe('42.4')
  })
})

describe('meterPercent', () => {
  it('clamps an exceeded goal to a full bar', () => {
    expect(meterPercent(42, 40)).toBe(100)
    expect(meterPercent(20, 40)).toBe(50)
    expect(meterPercent(0, 40)).toBe(0)
  })
})
