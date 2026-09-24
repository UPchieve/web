import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NTHSRosterMemberPublic } from '@/services/NTHSGroupService'
import {
  downloadRosterCsv,
  filterRoster,
  formatHours,
  formatLastActive,
  formatPeriodActivity,
  formatSessions,
  hoursLabel,
  rosterFilterCounts,
  rosterPeriodStarts,
  rosterStatus,
  roleLabel,
  roleTagLabel,
  DEFAULT_ROSTER_SORT,
  nextRosterSort,
  PERIOD_SORT_KEYS,
  ROSTER_PERIODS,
  ROSTER_SORT_KEYS,
  sortRoster,
  type RosterPeriod,
  type RosterSort,
  type RosterSortKey,
} from '@/services/NTHSRosterService'
import { member, NO_PERIOD_ACTIVITY } from '../fixtures/nths'

const exportToCsv = vi.fn()
vi.mock('@/utils/export-to-csv', () => ({
  default: (...args: unknown[]) => exportToCsv(...args),
}))

beforeEach(() => exportToCsv.mockReset())

// Thursday September 24th, local time.
const CSV_PERIOD_STARTS = rosterPeriodStarts(new Date(2026, 8, 24, 15))
const SCHOOL_YEAR_LABEL = '2026–27'

function csvRows(
  rows: NTHSRosterMemberPublic[],
  period: RosterPeriod
): Record<string, string | number>[] {
  exportToCsv.mockClear()
  downloadRosterCsv(rows, {
    period,
    periodStarts: CSV_PERIOD_STARTS,
    schoolYearLabel: SCHOOL_YEAR_LABEL,
  })
  return exportToCsv.mock.calls[0][1]
}

function onlyIn(
  period: RosterPeriod,
  inPeriod: number,
  elsewhere: number
): NTHSRosterMemberPublic['periodHours'] {
  const values = { ...NO_PERIOD_ACTIVITY }
  for (const other of ROSTER_PERIODS) values[other] = elsewhere
  values[period] = inPeriod
  return values
}

const PERIOD_FIELDS = {
  sessions: 'periodSessions',
  hours: 'periodHours',
} as const satisfies Partial<
  Record<RosterSortKey, keyof NTHSRosterMemberPublic>
>

function periodField(key: RosterSortKey) {
  return PERIOD_FIELDS[key as keyof typeof PERIOD_FIELDS]
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
      { trainingComplete: false, safetyApproved: false },
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
        periodSessions: NO_PERIOD_ACTIVITY,
        periodHours: NO_PERIOD_ACTIVITY,
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
  it('counts each chip, with a member matching both the training and safety chips', () => {
    const members = [
      member({ userId: 'a', trainingComplete: false, safetyApproved: false }),
      member({
        userId: 'b',
        lastActiveAt: undefined,
        periodSessions: NO_PERIOD_ACTIVITY,
        periodHours: NO_PERIOD_ACTIVITY,
      }),
      member({
        userId: 'c',
        periodHours: {
          ...NO_PERIOD_ACTIVITY,
          thisMonth: 2,
          thisSchoolYear: 2,
          allTime: 2,
        },
      }),
      member({ userId: 'd' }),
    ]
    const counts = rosterFilterCounts(members, 'thisWeek')

    expect(counts.all).toBe(4)
    // One member matches both the training and the safety chip.
    expect(counts['training-incomplete']).toBe(1)
    expect(counts['safety-incomplete']).toBe(1)
    expect(counts['not-tutored-in-period']).toBe(2)
    expect(
      rosterFilterCounts(members, 'thisMonth')['not-tutored-in-period']
    ).toBe(1)
  })

  it.each(ROSTER_PERIODS)(
    'counts and shows a member as not tutored in %s exactly when their hours in it are zero',
    (period) => {
      const members = [
        member({ userId: 'idle', periodHours: onlyIn(period, 0, 1) }),
        member({ userId: 'active', periodHours: onlyIn(period, 1, 0) }),
      ]
      const shown = filterRoster(members, 'not-tutored-in-period', period)

      expect(shown.map((m) => m.userId)).toEqual(['idle'])
      expect(rosterFilterCounts(members, period)['not-tutored-in-period']).toBe(
        shown.length
      )
    }
  )

  it('counts a closed account only under All, even though it would match every other chip', () => {
    const closed = member({
      userId: 'closed',
      accountClosed: true,
      trainingComplete: false,
      safetyApproved: false,
      periodSessions: NO_PERIOD_ACTIVITY,
      periodHours: NO_PERIOD_ACTIVITY,
    })
    const counts = rosterFilterCounts([closed], 'thisWeek')

    expect(counts.all).toBe(1)
    expect(counts['training-incomplete']).toBe(0)
    expect(counts['safety-incomplete']).toBe(0)
    expect(counts['not-tutored-in-period']).toBe(0)
  })
})

describe('downloadRosterCsv', () => {
  it('downloads the roster file with the formula guard and a UTF-8 BOM', () => {
    csvRows([member()], 'thisWeek')
    expect(exportToCsv).toHaveBeenCalledWith(
      'nths-chapter-members.csv',
      expect.any(Array),
      { guardFormulas: true, bom: true, lineEnding: '\r\n' }
    )
  })

  it('writes one row per member in the order given, keeping zero numeric', () => {
    const rows = csvRows(
      [
        member({ userId: 'a', firstName: 'Alex' }),
        member({
          userId: 'b',
          firstName: 'Sam',
          periodSessions: {
            thisWeek: 2,
            lastTwoWeeks: 2,
            thisMonth: 3,
            thisSchoolYear: 0,
            allTime: 5,
          },
        }),
      ],
      'thisSchoolYear'
    )

    expect(rows.map((row) => row.Name)).toEqual(['Alex R.', 'Sam R.'])
    expect(rows[1][`Sessions (${SCHOOL_YEAR_LABEL} school year)`]).toBe(0)
  })

  const PERIOD_CSV_HEADERS: Record<RosterPeriod, string[]> = {
    thisWeek: [
      'Sessions (this week, from Sep 21, 2026)',
      'Hours (this week, from Sep 21, 2026)',
    ],
    lastTwoWeeks: [
      'Sessions (last 2 weeks, from Sep 14, 2026)',
      'Hours (last 2 weeks, from Sep 14, 2026)',
    ],
    thisMonth: [
      'Sessions (this month, from Sep 1, 2026)',
      'Hours (this month, from Sep 1, 2026)',
    ],
    thisSchoolYear: [],
    allTime: ['Sessions (since joining)', 'Hours (since joining)'],
  }

  it.each(ROSTER_PERIODS)(
    'always carries Joined and the school year, and adds %s sessions and hours under headers naming the period and its start',
    (period) => {
      const row = member({
        joinedAt: new Date(2026, 7, 1, 12).toISOString(),
        lastActiveAt: undefined,
        periodSessions: {
          thisWeek: 1,
          lastTwoWeeks: 2,
          thisMonth: 3,
          thisSchoolYear: 4,
          allTime: 5,
        },
        periodHours: {
          thisWeek: 0.5,
          lastTwoWeeks: 1.5,
          thisMonth: 2.5,
          thisSchoolYear: 3.5,
          allTime: 4.5,
        },
      })
      const [csvRow] = csvRows([row], period)
      const periodValues =
        period === 'thisSchoolYear'
          ? []
          : [row.periodSessions[period], row.periodHours[period]]

      expect(Object.entries(csvRow)).toEqual([
        ['Name', 'Alex R.'],
        ['Role', 'Member'],
        ['Training', 'Complete'],
        ['Safety approval', 'Approved'],
        ['Joined', '2026-08-01'],
        [`Sessions (${SCHOOL_YEAR_LABEL} school year)`, 4],
        [`Hours (${SCHOOL_YEAR_LABEL} school year)`, 3.5],
        ...PERIOD_CSV_HEADERS[period].map((header, i) => [
          header,
          periodValues[i],
        ]),
        ['Last active', ''],
      ])
    }
  )

  it('writes Last active as a local calendar date, blank for a member with none', () => {
    const lastNightLocal = new Date(2026, 9, 14, 20, 0).toISOString()
    const [active, neverActive] = csvRows(
      [
        member({ lastActiveAt: lastNightLocal }),
        member({ userId: 'b', lastActiveAt: undefined }),
      ],
      'thisWeek'
    )

    expect(active['Last active']).toBe('2026-10-14')
    expect(neverActive['Last active']).toBe('')
  })
})

describe('column formatting', () => {
  it.each([
    [formatSessions, 0, '—'],
    [formatSessions, 3, '3'],
    [formatHours, 0, '—'],
    [formatHours, 1, '1 hr'],
    [formatHours, 12.5, '12.5 hrs'],
  ])('%o(%s) is %s', (fn, hours, expected) => {
    expect(fn(hours)).toBe(expected)
  })

  it.each([
    [0, 0, 'None'],
    [1, 0.02, '1 session · <0.1 hrs'],
    [3, 2.5, '3 sessions · 2.5 hrs'],
  ])(
    'writes %i sessions and %f hours in a period as %s',
    (sessions, hours, expected) => {
      expect(formatPeriodActivity(sessions, hours)).toBe(expected)
    }
  )

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

  it.each(PERIOD_SORT_KEYS)(
    'sorts the selected period %s, keeping members with none last in both directions',
    (key) => {
      const field = periodField(key)
      const roster = [
        member({
          userId: 'none',
          firstName: 'Ann',
          [field]: onlyIn(period, 0, 9),
        }),
        member({
          userId: 'low',
          firstName: 'Bo',
          [field]: onlyIn(period, 1, 0),
        }),
        member({
          userId: 'high',
          firstName: 'Cy',
          [field]: onlyIn(period, 3, 0),
        }),
      ]
      expect(
        ids(sortRoster(roster, { key, direction: 'desc' }, period))
      ).toEqual(['high', 'low', 'none'])
      expect(
        ids(sortRoster(roster, { key, direction: 'asc' }, period))
      ).toEqual(['low', 'high', 'none'])
    }
  )

  it.each(PERIOD_SORT_KEYS)(
    'sorts %s by whichever period is selected, not just the default',
    (key) => {
      const field = periodField(key)
      const selected = 'allTime'
      const roster = [
        member({
          userId: 'low',
          firstName: 'Ann',
          [field]: onlyIn(selected, 1, 9),
        }),
        member({
          userId: 'high',
          firstName: 'Bo',
          [field]: onlyIn(selected, 3, 0),
        }),
      ]
      expect(
        ids(sortRoster(roster, { key, direction: 'desc' }, selected))
      ).toEqual(['high', 'low'])
    }
  )

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
      member({ userId: 'b', firstName: 'Bo' }),
      member({ userId: 'a', firstName: 'Al' }),
    ]
    for (const direction of ['asc', 'desc'] as const) {
      expect(
        ids(sortRoster(roster, { key: 'sessions', direction }, period))
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
        periodHours: NO_PERIOD_ACTIVITY,
        periodSessions: NO_PERIOD_ACTIVITY,
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
    for (const key of ['sessions', 'hours', 'lastActive'] as const) {
      expect(nextRosterSort(DEFAULT_ROSTER_SORT, key).direction).toBe('desc')
    }
  })
})
