import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NTHSRosterMemberPublic } from '@/services/NTHSGroupService'
import {
  daysSince,
  downloadRosterCsv,
  periodRange,
  rangeBounds,
  rangeLabel,
  rosterPeriodStarts,
  rosterMemberActions,
  roleTagLabel,
  titleChoices,
  ROSTER_PERIODS,
  type RosterPeriod,
  type RosterRange,
} from '@/services/NTHSRosterService'
import { member } from '../fixtures/nths'

const exportToCsv = vi.fn()
vi.mock('@/utils/export-to-csv', () => ({
  default: (...args: unknown[]) => exportToCsv(...args),
}))

beforeEach(() => exportToCsv.mockReset())

// Built from local fields so the expectations hold in any process time zone.
// Thursday September 24th, local time.
const CSV_NOW = new Date(2026, 8, 24, 15)
const FOUNDED_ON = new Date(2025, 9, 6)
const SCHOOL_YEAR_STARTS_ON = new Date(2026, 6, 1)
const SCHOOL_YEAR_LABEL = '2026–27'

function quickPick(period: RosterPeriod, now = CSV_NOW): RosterRange {
  return periodRange(period, now, FOUNDED_ON, SCHOOL_YEAR_STARTS_ON)
}

function csvRows(
  rows: NTHSRosterMemberPublic[],
  range: RosterRange | undefined,
  roster = rows
): Record<string, string | number>[] {
  exportToCsv.mockClear()
  downloadRosterCsv(rows, {
    roster,
    range,
    schoolYearLabel: SCHOOL_YEAR_LABEL,
  })
  return exportToCsv.mock.calls[0][1]
}

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

describe('periodRange', () => {
  it.each<[RosterPeriod, Date]>([
    ['thisWeek', new Date(2026, 8, 21)],
    ['lastTwoWeeks', new Date(2026, 8, 14)],
    ['thisMonth', new Date(2026, 8, 1)],
    ['thisSchoolYear', SCHOOL_YEAR_STARTS_ON],
    ['allTime', FOUNDED_ON],
  ])('runs %s from %s through today', (period, firstDay) => {
    expect(quickPick(period)).toEqual({
      period,
      firstDay,
      lastDay: new Date(2026, 8, 24),
    })
  })

  it('starts no earlier than the founding day', () => {
    const foundedOn = new Date(2026, 8, 23)
    expect(
      periodRange('thisMonth', CSV_NOW, foundedOn, SCHOOL_YEAR_STARTS_ON)
        .firstDay
    ).toEqual(foundedOn)
  })
})

describe('rangeBounds', () => {
  const days = (firstDay: Date, lastDay: Date): RosterRange => ({
    firstDay,
    lastDay,
  })

  it('ends a past range at the midnight after its last day', () => {
    expect(
      rangeBounds(days(new Date(2026, 8, 1), new Date(2026, 8, 3)))
    ).toEqual({
      startsAt: new Date(2026, 8, 1),
      endsAt: new Date(2026, 8, 4),
    })
  })
})

describe('rangeLabel', () => {
  beforeEach(() => vi.useFakeTimers({ now: CSV_NOW, toFake: ['Date'] }))
  afterEach(() => vi.useRealTimers())

  it.each<[string, RosterRange, string]>([
    ['a quick pick by its name', quickPick('lastTwoWeeks'), 'Last 2 weeks'],
    [
      'picked days by their first and last day',
      { firstDay: new Date(2026, 9, 25), lastDay: new Date(2026, 9, 31) },
      'Oct 25 – Oct 31',
    ],
    [
      'a single picked day once',
      { firstDay: new Date(2026, 9, 25), lastDay: new Date(2026, 9, 25) },
      'Oct 25',
    ],
    [
      'days across a new year with their years',
      { firstDay: new Date(2025, 11, 29), lastDay: new Date(2026, 0, 2) },
      'Dec 29, 2025 – Jan 2, 2026',
    ],
    [
      'days wholly in an earlier year with the year',
      { firstDay: new Date(2025, 2, 2), lastDay: new Date(2025, 2, 9) },
      'Mar 2, 2025 – Mar 9, 2025',
    ],
  ])('names %s', (_, range, expected) => {
    expect(rangeLabel(range)).toBe(expected)
  })
})

describe('downloadRosterCsv', () => {
  it('names a co-president from the whole roster when the filter hides the other one', () => {
    const shown = member({ userId: 'a', roleName: 'admin', title: 'President' })
    const hidden = member({
      userId: 'b',
      roleName: 'admin',
      title: 'President',
    })
    const [row] = csvRows([shown], undefined, [shown, hidden])
    const [alone] = csvRows([shown], undefined)
    expect(row.Role).toBe('Co-President')
    expect(row.Role).not.toBe(alone.Role)
  })

  it('writes the roles the table shows for an untitled admin and a closed account', () => {
    const admin = member({ userId: 'a', roleName: 'admin', title: 'Member' })
    const closed = member({
      userId: 'b',
      title: 'Vice President',
      accountClosed: true,
    })
    const rows = csvRows([admin, closed], undefined, [admin, closed])
    expect(rows.map((row) => row.Role)).toEqual(['Admin', 'Vice President'])
  })

  it('downloads the roster file with the formula guard and a UTF-8 BOM', () => {
    csvRows([member()], undefined)
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
      undefined
    )

    expect(rows.map((row) => row.Name)).toEqual(['Alex R.', 'Sam R.'])
    expect(rows[1][`Sessions (${SCHOOL_YEAR_LABEL} school year)`]).toBe(0)
  })

  const RANGE_CSV_HEADERS: Record<RosterPeriod, string[]> = {
    thisWeek: [
      'Sessions (Sep 21, 2026 – Sep 24, 2026)',
      'Hours (Sep 21, 2026 – Sep 24, 2026)',
    ],
    lastTwoWeeks: [
      'Sessions (Sep 14, 2026 – Sep 24, 2026)',
      'Hours (Sep 14, 2026 – Sep 24, 2026)',
    ],
    thisMonth: [
      'Sessions (Sep 1, 2026 – Sep 24, 2026)',
      'Hours (Sep 1, 2026 – Sep 24, 2026)',
    ],
    thisSchoolYear: [],
    allTime: ['Sessions (since joining)', 'Hours (since joining)'],
  }

  it.each(ROSTER_PERIODS)(
    'always carries Joined and the school year, and adds %s sessions and hours under headers naming its days',
    (period) => {
      const row = member({
        joinedAt: new Date(2026, 7, 1, 12).toISOString(),
        lastActiveAt: undefined,
        rangeSessions: 1,
        rangeHours: 0.5,
        periodSessions: { ...member().periodSessions, thisSchoolYear: 4 },
        periodHours: { ...member().periodHours, thisSchoolYear: 3.5 },
      })
      const [csvRow] = csvRows([row], quickPick(period))

      expect(Object.entries(csvRow)).toEqual([
        ['Name', 'Alex R.'],
        ['Role', 'Member'],
        ['Training', 'Complete'],
        ['Safety approval', 'Approved'],
        ['Joined', '2026-08-01'],
        [`Sessions (${SCHOOL_YEAR_LABEL} school year)`, 4],
        [`Hours (${SCHOOL_YEAR_LABEL} school year)`, 3.5],
        ...RANGE_CSV_HEADERS[period].map((header, i) => [header, [1, 0.5][i]]),
        ['Last active', ''],
      ])
    }
  )

  it('names picked days in the headers', () => {
    const [csvRow] = csvRows([member()], {
      firstDay: new Date(2026, 9, 25),
      lastDay: new Date(2026, 9, 31),
    })
    expect(Object.keys(csvRow)).toContain(
      'Sessions (Oct 25, 2026 – Oct 31, 2026)'
    )
  })

  it('writes Last active as a local calendar date, blank for a member with none', () => {
    const lastNightLocal = new Date(2026, 9, 14, 20, 0).toISOString()
    const [active, neverActive] = csvRows(
      [
        member({ lastActiveAt: lastNightLocal }),
        member({ userId: 'b', lastActiveAt: undefined }),
      ],
      undefined
    )

    expect(active['Last active']).toBe('2026-10-14')
    expect(neverActive['Last active']).toBe('')
  })
})

describe('daysSince', () => {
  it.each([
    [
      '13 hours earlier on the previous local day',
      new Date(2026, 9, 14, 20, 0),
      new Date(2026, 9, 15, 9, 0),
      1,
    ],
    [
      'two minutes apart across local midnight',
      new Date(2026, 9, 14, 23, 59),
      new Date(2026, 9, 15, 0, 1),
      1,
    ],
    [
      'almost 24 hours apart on the same local day',
      new Date(2026, 9, 15, 0, 1),
      new Date(2026, 9, 15, 23, 59),
      0,
    ],
  ])('reads %s as a calendar day', (_, lastActive, now, expected) => {
    expect(daysSince(lastActive.toISOString(), now)).toBe(expected)
  })
})

describe('rosterMemberActions', () => {
  it.each([
    ['a plain member', {}, ['make_admin', 'change_title', 'remove']],
    [
      'an admin',
      { roleName: 'admin' as const },
      ['remove_admin', 'change_title', 'remove'],
    ],
    ['a closed account', { accountClosed: true }, ['remove']],
    ["the viewer's own row", { userId: 'viewer' }, ['change_title']],
  ])('offers %s these actions', (_label, overrides, expected) => {
    expect(rosterMemberActions(member(overrides), 'viewer')).toEqual(expected)
  })
})

describe('roleTagLabel', () => {
  it.each([
    [
      'a closed-account president',
      { title: 'President' as const },
      'President',
    ],
    [
      'a closed-account untitled admin',
      { roleName: 'admin' as const },
      'Admin',
    ],
    ['a closed-account plain member', {}, undefined],
  ])(
    'reads %s from the stored title and role',
    (_label, overrides, expected) => {
      const closed = member({ accountClosed: true, ...overrides })

      expect(roleTagLabel(closed, [closed])).toBe(expected)
    }
  )
})

describe('titleChoices', () => {
  const titles = (asAdmin: boolean) =>
    titleChoices(member(), [member()], asAdmin).map((choice) => choice.title)

  it('offers an admin every title and a plain member only the board or none', () => {
    expect(titles(true)).toEqual([
      'President',
      'Vice President',
      'Executive Board Member',
      'Member',
    ])
    expect(titles(false)).toEqual(['Executive Board Member', 'Member'])
  })
})
