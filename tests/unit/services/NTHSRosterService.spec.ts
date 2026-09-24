import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NTHSRosterMemberPublic } from '@/services/NTHSGroupService'
import {
  downloadRosterCsv,
  formatActivity,
  formatHours,
  formatLastActive,
  formatSessions,
  hoursLabel,
  formatPeriodHours,
  rosterFilterCounts,
  rosterPeriodStarts,
  rosterStatus,
  roleLabel,
  roleTagLabel,
  DEFAULT_ROSTER_SORT,
  nextRosterSort,
  ROSTER_PERIODS,
  ROSTER_SORT_KEYS,
  sortRoster,
  type RosterPeriod,
  type RosterSort,
} from '@/services/NTHSRosterService'
import { member } from '../fixtures/nths'

const exportToCsv = vi.fn()
vi.mock('@/utils/export-to-csv', () => ({
  default: (...args: unknown[]) => exportToCsv(...args),
}))

beforeEach(() => exportToCsv.mockReset())

function csvRows(
  rows: NTHSRosterMemberPublic[],
  period: RosterPeriod
): Record<string, string | number>[] {
  exportToCsv.mockClear()
  downloadRosterCsv(rows, period)
  return exportToCsv.mock.calls[0][1]
}

const NOW = new Date('2026-10-15T00:00:00.000Z')
const YESTERDAY = '2026-10-14T00:00:00.000Z'

describe('rosterPeriodStarts', () => {
  // Built from local fields so the expectations hold in any process time zone.
  it.each([
    [
      'starts the week at the Monday it is, at local midnight',
      new Date(2026, 8, 14, 0, 0, 0, 0),
      new Date(2026, 8, 14),
      new Date(2026, 8, 7),
      new Date(2026, 8, 1),
    ],
    [
      'keeps a Sunday 23:59 in the week that began the Monday before',
      new Date(2026, 8, 20, 23, 59, 59, 999),
      new Date(2026, 8, 14),
      new Date(2026, 8, 7),
      new Date(2026, 8, 1),
    ],
    [
      // Thursday October 1st: the week began Monday September 28th.
      'reaches back into the previous month for a week that straddles it',
      new Date(2026, 9, 1, 12),
      new Date(2026, 8, 28),
      new Date(2026, 8, 21),
      new Date(2026, 9, 1),
    ],
  ])('%s', (_, input, thisWeek, lastTwoWeeks, thisMonth) => {
    expect(rosterPeriodStarts(input)).toEqual({
      thisWeek,
      lastTwoWeeks,
      thisMonth,
    })
  })
})

describe('rosterStatus', () => {
  it.each([
    [
      'ranks training ahead of every other gap',
      { trainingComplete: false, safetyApproved: false, sessionsThisYear: 0 },
      'training-incomplete',
    ],
    [
      'asks for safety approval once training is done',
      { safetyApproved: false },
      'needs-safety-approval',
    ],
    [
      'is ready to tutor once training and safety are done and they have never tutored',
      {
        sessionsThisYear: 0,
        periodHours: { thisWeek: 0, lastTwoWeeks: 0, thisMonth: 0 },
        lastActiveAt: undefined,
      },
      'ready-to-tutor',
    ],
    [
      'overrides every other gap for a closed account',
      { accountClosed: true, trainingComplete: false, safetyApproved: false },
      'account-closed',
    ],
  ])('%s', (_, overrides, expected) => {
    expect(rosterStatus(member(overrides))).toBe(expected)
  })
})

describe('rosterFilterCounts', () => {
  it('counts each chip, with a never-tutored member matching two chips', () => {
    const members = [
      member({ userId: 'a', trainingComplete: false, safetyApproved: false }),
      member({
        userId: 'b',
        sessionsThisYear: 0,
        lastActiveAt: undefined,
        periodHours: { thisWeek: 0, lastTwoWeeks: 0, thisMonth: 0 },
      }),
      member({
        userId: 'c',
        periodHours: { thisWeek: 0, lastTwoWeeks: 0, thisMonth: 2 },
      }),
      member({ userId: 'd' }),
    ]
    const counts = rosterFilterCounts(members, 'thisWeek')

    expect(counts.all).toBe(4)
    // One member matches both the training and the safety chip.
    expect(counts['training-incomplete']).toBe(1)
    expect(counts['safety-incomplete']).toBe(1)
    expect(counts['not-tutoring-yet']).toBe(1)
    expect(counts['not-tutored-in-period']).toBe(2)
    expect(
      rosterFilterCounts(members, 'thisMonth')['not-tutored-in-period']
    ).toBe(1)
  })

  it('counts a closed account only under All, even though it would match every other chip', () => {
    const closed = member({
      userId: 'closed',
      accountClosed: true,
      trainingComplete: false,
      safetyApproved: false,
      sessionsThisYear: 0,
      periodHours: { thisWeek: 0, lastTwoWeeks: 0, thisMonth: 0 },
    })
    const counts = rosterFilterCounts([closed], 'thisWeek')

    expect(counts.all).toBe(1)
    expect(counts['training-incomplete']).toBe(0)
    expect(counts['safety-incomplete']).toBe(0)
    expect(counts['not-tutoring-yet']).toBe(0)
    expect(counts['not-tutored-in-period']).toBe(0)
  })
})

describe('downloadRosterCsv', () => {
  it('downloads the roster file with the formula guard and a UTF-8 BOM', () => {
    downloadRosterCsv([member()], 'thisWeek')
    expect(exportToCsv).toHaveBeenCalledWith(
      'nths-chapter-members.csv',
      expect.any(Array),
      { guardFormulas: true, bom: true, lineEnding: '\r\n' }
    )
  })

  it('writes one row per member in the order given, in a fixed column order', () => {
    const rows = csvRows(
      [
        member({ userId: 'a', firstName: 'Alex' }),
        member({ userId: 'b', firstName: 'Sam', sessionsThisYear: 0 }),
      ],
      'thisWeek'
    )

    expect(rows).toHaveLength(2)
    expect(Object.values(rows[0]).slice(0, -1)).toEqual([
      'Alex R.',
      'Member',
      'Complete',
      'Approved',
      3,
      2.5,
      1,
    ])
    expect(rows[1].Sessions).toBe(0)
  })

  it('adds the selected period hours after Hours', () => {
    const row = member({
      periodHours: { thisWeek: 0, lastTwoWeeks: 0.25, thisMonth: 3.75 },
    })
    const periodColumn = (period: RosterPeriod) => {
      const [csvRow] = csvRows([row], period)
      const keys = Object.keys(csvRow)
      const key = keys[keys.indexOf('Hours') + 1]
      return { key, value: csvRow[key] }
    }

    const month = periodColumn('thisMonth')
    const twoWeeks = periodColumn('lastTwoWeeks')
    expect(month.value).toBe(3.75)
    expect(twoWeeks.value).toBe(0.25)
    expect(month.key).not.toBe(twoWeeks.key)
  })

  it('writes Last active as a local calendar date, blank for a member with none', () => {
    const lastNightLocal = new Date(2026, 9, 14, 20, 0).toISOString()
    const [active, neverActive] = csvRows(
      [
        member({ lastActiveAt: lastNightLocal }),
        member({ userId: 'b', sessionsThisYear: 0, lastActiveAt: undefined }),
      ],
      'thisWeek'
    )

    expect(active['Last active']).toBe('2026-10-14')
    expect(neverActive['Last active']).toBe('')
  })
})

describe('formatActivity', () => {
  it('reports sessions and hours when the member has tutored this year', () => {
    expect(formatActivity(member())).toBe('3 sessions · 2.5 hrs')
  })

  it('distinguishes never having tutored from having none yet this school year', () => {
    const neverTutored = member({
      sessionsThisYear: 0,
      lastActiveAt: undefined,
    })
    const returningMember = member({
      sessionsThisYear: 0,
      lastActiveAt: YESTERDAY,
    })
    expect(formatActivity(neverTutored)).toBe(formatLastActive(undefined, NOW))
    expect(formatActivity(neverTutored)).not.toBe(
      formatActivity(returningMember)
    )
  })
})

describe('column formatting', () => {
  it.each([
    [formatSessions, 0, '—'],
    [formatSessions, 3, '3'],
    [formatHours, 0, '—'],
    [formatHours, 1, '1 hr'],
    [formatHours, 12.5, '12.5 hrs'],
    [formatPeriodHours, 0, 'None'],
    [formatPeriodHours, 0.02, '<0.1 hrs'],
  ])('%o(%s) is %s', (fn, hours, expected) => {
    expect(fn(hours)).toBe(expected)
  })

  it.each([
    [0.02, '<0.1'],
    [0.083, '<0.1'],
    [0.1, '0.1'],
    [12.5, '12.5'],
  ])('labels %f hours as %s', (hours, expected) => {
    expect(hoursLabel(hours)).toBe(expected)
  })

  it('writes Last active relative to now', () => {
    const ago = (days: number) =>
      new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

    expect(formatLastActive(undefined, NOW)).toBe('No sessions yet')
    expect(formatLastActive(ago(0), NOW)).toBe('Today')
    expect(formatLastActive(ago(1), NOW)).toBe('Yesterday')
    expect(formatLastActive(ago(3), NOW)).toBe('3 days ago')
    expect(formatLastActive(ago(8), NOW)).toBe('Last week')
    expect(formatLastActive(ago(15), NOW)).toBe('2 weeks ago')
  })

  it.each([
    [
      '13 hours earlier on the previous local day',
      new Date(2026, 9, 14, 20, 0),
      new Date(2026, 9, 15, 9, 0),
      'Yesterday',
    ],
    [
      'two minutes apart across local midnight',
      new Date(2026, 9, 14, 23, 59),
      new Date(2026, 9, 15, 0, 1),
      'Yesterday',
    ],
    [
      'almost 24 hours apart on the same local day',
      new Date(2026, 9, 15, 0, 1),
      new Date(2026, 9, 15, 23, 59),
      'Today',
    ],
  ])('reads %s as a calendar day', (_, lastActive, now, expected) => {
    expect(formatLastActive(lastActive.toISOString(), now)).toBe(expected)
  })
})

describe('roleLabel and roleTagLabel', () => {
  const plainAdmin = member({ roleName: 'admin' })
  const plainMember = member({ roleName: 'member' })

  it('calls a titled admin something other than a plain admin', () => {
    const president = member({ roleName: 'admin', title: 'President' })
    expect(roleLabel(president)).not.toBe(roleLabel(plainAdmin))
    expect(roleTagLabel(president)).not.toBe(roleTagLabel(plainAdmin))
  })

  it('treats a founder demoted to member like any other member, title and all', () => {
    const demoted = member({ roleName: 'member', title: 'President' })
    expect(roleLabel(demoted)).toBe(roleLabel(plainMember))
    expect(roleTagLabel(demoted)).toBeUndefined()
    const [row, plainRow] = csvRows([demoted, plainMember], 'thisWeek')
    expect(row.Role).toBe(plainRow.Role)
  })
})

describe('sortRoster', () => {
  const ids = (members: NTHSRosterMemberPublic[]) =>
    members.map((m) => m.userId)
  const period: RosterPeriod = 'thisWeek'

  it('defaults to name A to Z, breaking name ties by userId', () => {
    const roster = [
      member({ userId: 'b', firstName: 'Sam' }),
      member({ userId: 'z', firstName: 'Alex' }),
      member({ userId: 'a', firstName: 'Alex' }),
    ]
    expect(ids(sortRoster(roster, DEFAULT_ROSTER_SORT, period))).toEqual([
      'a',
      'z',
      'b',
    ])
  })

  it('orders status training, then safety, then ready, with closed accounts last either way', () => {
    const roster = [
      member({ userId: 'closed', firstName: 'Aaron', accountClosed: true }),
      member({ userId: 'ready', firstName: 'Bea' }),
      member({ userId: 'safety', firstName: 'Cal', safetyApproved: false }),
      member({ userId: 'training', firstName: 'Dee', trainingComplete: false }),
    ]
    expect(
      ids(sortRoster(roster, { key: 'status', direction: 'asc' }, period))
    ).toEqual(['training', 'safety', 'ready', 'closed'])
    expect(
      ids(sortRoster(roster, { key: 'status', direction: 'desc' }, period))
    ).toEqual(['ready', 'safety', 'training', 'closed'])
  })

  it('sorts the selected period hours, keeping members with none last in both directions', () => {
    const roster = [
      member({
        userId: 'none',
        firstName: 'Ann',
        periodHours: { thisWeek: 0, lastTwoWeeks: 9, thisMonth: 9 },
      }),
      member({
        userId: 'low',
        firstName: 'Bo',
        periodHours: { thisWeek: 1, lastTwoWeeks: 1, thisMonth: 1 },
      }),
      member({
        userId: 'high',
        firstName: 'Cy',
        periodHours: { thisWeek: 3, lastTwoWeeks: 3, thisMonth: 3 },
      }),
    ]
    expect(
      ids(sortRoster(roster, { key: 'periodHours', direction: 'desc' }, period))
    ).toEqual(['high', 'low', 'none'])
    expect(
      ids(sortRoster(roster, { key: 'periodHours', direction: 'asc' }, period))
    ).toEqual(['low', 'high', 'none'])
    expect(
      ids(
        sortRoster(
          roster,
          { key: 'periodHours', direction: 'desc' },
          'lastTwoWeeks'
        )
      )
    ).toEqual(['none', 'high', 'low'])
  })

  it('puts the most recently active first and never-active members last', () => {
    const roster = [
      member({ userId: 'never', firstName: 'Ann', lastActiveAt: undefined }),
      member({ userId: 'old', lastActiveAt: '2026-01-01T00:00:00.000Z' }),
      member({ userId: 'recent', lastActiveAt: YESTERDAY }),
    ]
    expect(
      ids(sortRoster(roster, { key: 'lastActive', direction: 'desc' }, period))
    ).toEqual(['recent', 'old', 'never'])
    expect(
      ids(sortRoster(roster, { key: 'lastActive', direction: 'asc' }, period))
    ).toEqual(['old', 'recent', 'never'])
  })

  it('breaks ties by name whichever direction the column points', () => {
    const roster = [
      member({ userId: 'b', firstName: 'Bo', sessionsThisYear: 2 }),
      member({ userId: 'a', firstName: 'Al', sessionsThisYear: 2 }),
    ]
    for (const direction of ['asc', 'desc'] as const) {
      expect(
        ids(sortRoster(roster, { key: 'sessionsThisYear', direction }, period))
      ).toEqual(['a', 'b'])
    }
  })

  it('does not reorder its input', () => {
    const roster = [member({ userId: 'b', firstName: 'Bo' }), member()]
    sortRoster(roster, DEFAULT_ROSTER_SORT, period)
    expect(ids(roster)).toEqual(['b', 'u1'])
  })

  it('keeps every member under every sort, with closed accounts last and value-less members just before them', () => {
    const roster = [
      member({ userId: 'closed', firstName: 'Aaron', accountClosed: true }),
      member({
        userId: 'idle',
        firstName: 'Bea',
        sessionsThisYear: 0,
        hoursThisYear: 0,
        periodHours: { thisWeek: 0, lastTwoWeeks: 0, thisMonth: 0 },
        lastActiveAt: undefined,
      }),
      member({ userId: 'training', firstName: 'Cal', trainingComplete: false }),
      member({ userId: 'ready', firstName: 'Dee' }),
    ]
    for (const key of ROSTER_SORT_KEYS) {
      for (const direction of ['asc', 'desc'] as const) {
        for (const rosterPeriod of ROSTER_PERIODS) {
          const sorted = ids(
            sortRoster(roster, { key, direction }, rosterPeriod)
          )
          expect([...sorted].sort()).toEqual(ids(roster).sort())
          expect(sorted.at(-1)).toBe('closed')
          if (key !== 'name' && key !== 'status') {
            expect(sorted.at(-2)).toBe('idle')
          }
        }
      }
    }
  })
})

describe('nextRosterSort', () => {
  it('starts name and status ascending, activity columns descending, and flips the active column', () => {
    const from: RosterSort = { key: 'lastActive', direction: 'asc' }
    expect(nextRosterSort(from, 'status').direction).toBe('asc')
    expect(nextRosterSort(DEFAULT_ROSTER_SORT, 'name')).toEqual({
      key: 'name',
      direction: 'desc',
    })
    expect(nextRosterSort(from, 'name').direction).toBe('asc')
    for (const key of [
      'periodHours',
      'sessionsThisYear',
      'hoursThisYear',
      'lastActive',
    ] as const) {
      expect(nextRosterSort(DEFAULT_ROSTER_SORT, key).direction).toBe('desc')
    }
  })
})
