import { isAppPath, tipForDay } from '@/services/NTHSGroupService'
import { describe, expect, it } from 'vitest'

describe('tipForDay', () => {
  const tips = ['a', 'b', 'c']

  it.each([
    { name: 'morning', date: new Date(2026, 10, 23, 0, 5), tip: 'c' },
    { name: 'late evening', date: new Date(2026, 10, 23, 23, 55), tip: 'c' },
    { name: 'next day', date: new Date(2026, 10, 24, 12), tip: 'a' },
    { name: 'day after, wrapped', date: new Date(2026, 10, 25, 12), tip: 'b' },
  ])('picks $tip for the local day ($name)', ({ date, tip }) => {
    expect(tipForDay(tips, date)).toBe(tip)
  })

  it('reads the local day when the UTC day is already tomorrow', () => {
    const easternEvening = Object.assign(new Date('2026-11-24T02:00:00Z'), {
      getFullYear: () => 2026,
      getMonth: () => 10,
      getDate: () => 23,
    })
    expect(tipForDay(tips, easternEvening)).toBe('c')
  })

  it('returns undefined without tips', () => {
    expect(tipForDay([], new Date(2026, 10, 23))).toBeUndefined()
  })
})

describe('isAppPath', () => {
  it.each([
    { link: '/groups/resources', expected: true },
    { link: '//evil.example', expected: false },
    { link: '/\\evil.example', expected: false },
    { link: '/\n/evil.example', expected: false },
    { link: 'https://nationaltutor.org', expected: false },
  ])('$link: $expected', ({ link, expected }) => {
    expect(isAppPath(link)).toBe(expected)
  })
})
