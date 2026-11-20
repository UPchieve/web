import { describe, expect, it } from 'vitest'
import {
  contributionBar,
  minutesToOvertake,
  rankMembers,
  topMembersBoard,
} from '@/services/NTHSTopMembersService'
import { member, NO_PERIOD_ACTIVITY } from '../fixtures/nths'

function tutor(
  userId: string,
  hours: number,
  sessions = 1,
  overrides: Parameters<typeof member>[0] = {}
) {
  return member({
    userId,
    firstName: userId,
    lastInitial: '',
    periodHours: { ...NO_PERIOD_ACTIVITY, thisSchoolYear: hours },
    periodSessions: { ...NO_PERIOD_ACTIVITY, thisSchoolYear: sessions },
    ...overrides,
  })
}

describe('rankMembers', () => {
  it.each([
    {
      label: 'hours, then sessions, then userId',
      members: [
        tutor('d', 1, 5),
        tutor('b', 2, 1),
        tutor('c', 2, 3),
        tutor('a', 2, 3, { roleName: 'admin', title: 'President' }),
        tutor('e', 2, 3),
      ],
      expected: ['a', 'c', 'e', 'b', 'd'],
    },
    {
      label: 'zero hours and closed accounts left out',
      members: [
        tutor('a', 0),
        tutor('b', 3, 1, { accountClosed: true }),
        tutor('c', 1),
      ],
      expected: ['c'],
    },
  ])('orders by $label', ({ members, expected }) => {
    expect(rankMembers(members).map((m) => m.userId)).toEqual(expected)
  })
})

describe('minutesToOvertake', () => {
  it.each([
    { target: 2, viewer: 1.25, expected: '46m' },
    { target: 2, viewer: 2, expected: '2m' },
    { target: 2.01, viewer: 1, expected: '1h 2m' },
    { target: 1.51, viewer: 1.5, expected: '2m' },
    { target: 2, viewer: 1.02, expected: '1h 0m' },
    { target: 1.1, viewer: 1, expected: '7m' },
  ])('gives $expected from $viewer to $target hours', (c) => {
    expect(minutesToOvertake(c.target, c.viewer)).toBe(c.expected)
  })
})

describe('contributionBar', () => {
  it.each([
    { label: 'under the goal', args: [5, 20, 40], expected: [12.5, 37.5, 15] },
    {
      label: 'chapter past the goal',
      args: [10, 60, 40],
      expected: [50 / 3, 250 / 3, 50],
    },
    {
      label: 'member alone past the goal',
      args: [50, 50, 40],
      expected: [100, 0, 0],
    },
    { label: 'zero hours', args: [0, 0, 40], expected: [0, 0, 0] },
    { label: 'own above chapter', args: [8, 5, 40], expected: [20, 0, 0] },
  ])('splits the bar for $label', ({ args, expected }) => {
    const [own, chapter, goal] = args
    const bar = contributionBar(own, chapter, goal)
    const actual = [bar.ownWidth, bar.restWidth, bar.restHours]
    actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 9))
  })
})

describe('topMembersBoard', () => {
  const FOUR = [
    tutor('a', 4.25),
    tutor('b', 2.5),
    tutor('c', 1.75),
    tutor('d', 0.75),
  ]

  it('lists at most three rows, hours as hours and minutes', () => {
    const { rows } = topMembersBoard(FOUR, 'nobody')

    expect(rows.map((r) => [r.name, r.hours, r.place])).toEqual([
      ['a', '4h 15m', 1],
      ['b', '2h 30m', 2],
      ['c', '1h 45m', 3],
    ])
  })

  it.each([
    { viewer: 'a', name: 'a (you)', line: undefined },
    { viewer: 'b', name: 'b (you)', line: 'Log 1h 46m more to reach #1.' },
    { viewer: 'c', name: 'c (you)', line: 'Log 46m more to reach #2.' },
  ])('marks a listed viewer $viewer on their own row', (c) => {
    const { rows, viewerRow } = topMembersBoard(FOUR, c.viewer)

    const row = rows.find((r) => r.userId === c.viewer)
    expect([row?.name, row?.line]).toEqual([c.name, c.line])
    expect(viewerRow).toBeUndefined()
  })

  it('gives an unlisted viewer with hours a row with their place', () => {
    const { viewerRow } = topMembersBoard(FOUR, 'd')

    expect(viewerRow).toEqual({
      userId: 'd',
      name: 'd (you)',
      hours: '0h 45m',
      place: 4,
      line: 'Log 1h 1m more to reach the top 3.',
    })
  })

  it('tells an unlisted viewer with no hours to log a session, with no place', () => {
    const { viewerRow } = topMembersBoard([...FOUR, tutor('z', 0)], 'z')

    expect(viewerRow).toMatchObject({ place: undefined, hours: '0h 0m' })
    expect(viewerRow?.line).toBe('Log 1h 46m more to reach the top 3.')
  })

  it('tells the viewer to join when the board has fewer than three rows', () => {
    const { rows, viewerRow } = topMembersBoard(
      [tutor('a', 1), tutor('z', 0)],
      'z'
    )

    expect(rows).toHaveLength(1)
    expect(viewerRow?.line).toBe('Log a session to join the top 3.')
    expect(viewerRow?.place).toBeUndefined()
  })

  it.each([
    { label: 'an empty board', members: [tutor('z', 0)], viewer: 'z' },
    { label: 'a viewer with no roster row', members: FOUR, viewer: 'ghost' },
    {
      label: 'a viewer whose account is closed',
      members: [...FOUR, tutor('z', 0, 1, { accountClosed: true })],
      viewer: 'z',
    },
  ])('gives no viewer row for $label', ({ members, viewer }) => {
    expect(topMembersBoard(members, viewer).viewerRow).toBeUndefined()
  })
})
