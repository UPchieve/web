import { describe, expect, it } from 'vitest'
import { topTutorDetail, viewerHoursLine } from '@/services/NTHSTopTutorService'
import { topTutor } from '../fixtures/nths'

describe('topTutorDetail', () => {
  it.each([
    ['pluralizes hours and sessions', {}, '4.5 hours · 3 sessions this month'],
    [
      'singularizes hour and session at exactly one',
      { hoursTutored: 1, sessionsCompleted: 1 },
      '1 hour · 1 session this month',
    ],
    [
      'uses the <0.1 label, not "0 hours", under the rounding floor',
      { hoursTutored: 0.02 },
      '<0.1 hours · 3 sessions this month',
    ],
  ])('%s', (_label, overrides, expected) => {
    expect(topTutorDetail(topTutor(overrides))).toBe(expected)
  })
})

describe('viewerHoursLine', () => {
  it.each([
    ['pluralizes hours', 1.5, 'You: 1.5 hours this month'],
    ['singularizes hour at exactly one', 1, 'You: 1 hour this month'],
    [
      'uses a clear zero wording rather than "0 hours"',
      0,
      'You: no hours yet this month',
    ],
  ])('%s', (_label, hours, expected) => {
    expect(viewerHoursLine(hours)).toBe(expected)
  })
})
