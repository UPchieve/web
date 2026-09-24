import type { NTHSRosterMemberPublic } from '@/services/NTHSGroupService'
import {
  formatDecimalHours,
  isUnderOneTenth,
  UNDER_ONE_TENTH_HOURS_LABEL,
} from '@/services/NTHSImpactService'
import exportToCsv from '@/utils/export-to-csv'
import { plural } from '@/utils/plural'
import { dayjs } from '@/utils/time-utils'

export type RosterPeriod = keyof NTHSRosterMemberPublic['periodHours']

export const ROSTER_PERIODS: RosterPeriod[] = [
  'thisWeek',
  'lastTwoWeeks',
  'thisMonth',
  'thisSchoolYear',
  'allTime',
]

// The server computes the school-year and all-time windows itself.
export type CalendarRosterPeriod = Extract<
  RosterPeriod,
  'thisWeek' | 'lastTwoWeeks' | 'thisMonth'
>

export const ROSTER_PERIOD_LABELS: Record<RosterPeriod, string> = {
  thisWeek: 'This week',
  lastTwoWeeks: 'Last 2 weeks',
  thisMonth: 'This month',
  thisSchoolYear: 'This school year',
  allTime: 'All time',
}

// Completes "<N> of <M> members have tutored ...".
export const ROSTER_PERIOD_PHRASES: Record<RosterPeriod, string> = {
  thisWeek: 'this week',
  lastTwoWeeks: 'in the last 2 weeks',
  thisMonth: 'this month',
  thisSchoolYear: 'this school year',
  allTime: 'since joining',
}

const ROSTER_PERIOD_NOT_TUTORED_LABELS: Record<RosterPeriod, string> = {
  thisWeek: "Hasn't tutored this week",
  lastTwoWeeks: "Hasn't tutored in 2 weeks",
  thisMonth: "Hasn't tutored this month",
  thisSchoolYear: "Hasn't tutored this school year",
  allTime: "Hasn't tutored since joining",
}

// A device clock far enough off gets a 422 on the period starts; callers retry
// without them so the server uses its own UTC periods.
export function isPeriodStartRejection(err: unknown): boolean {
  return (err as { status?: number } | null)?.status === 422
}

// Periods are calendar periods in the viewer's local time, so a president
// checking in every Thursday sees the week reset on their own Monday.
export function rosterPeriodStarts(
  now: Date
): Record<CalendarRosterPeriod, Date> {
  const date = dayjs(now)
  const monday = date.subtract((date.day() + 6) % 7, 'day')
  return {
    thisWeek: monday.startOf('day').toDate(),
    lastTwoWeeks: monday.subtract(1, 'week').startOf('day').toDate(),
    thisMonth: date.startOf('month').toDate(),
  }
}

// Whether a member CAN tutor, never whether they HAVE - Sessions, Hours,
// Last active and the filter chips already cover activity.
export type RosterStatus =
  | 'account-closed'
  | 'training-incomplete'
  | 'needs-safety-approval'
  | 'ready-to-tutor'

export const ROSTER_STATUS_LABELS: Record<RosterStatus, string> = {
  'account-closed': 'Account closed',
  'training-incomplete': 'Training incomplete',
  'needs-safety-approval': 'Needs safety approval',
  'ready-to-tutor': 'Ready to tutor',
}

function hasNotTutoredIn(
  member: NTHSRosterMemberPublic,
  period: RosterPeriod
): boolean {
  return member.periodHours[period] === 0
}

/** First match wins, so every member gets exactly one status. */
export function rosterStatus(member: NTHSRosterMemberPublic): RosterStatus {
  // A closed account isn't a member's training/safety state - it overrides
  // the rest so the row still tells a president why it's there.
  if (member.accountClosed) return 'account-closed'
  if (!member.trainingComplete) return 'training-incomplete'
  if (!member.safetyApproved) return 'needs-safety-approval'
  return 'ready-to-tutor'
}

export type RosterFilter =
  | 'all'
  | 'training-incomplete'
  | 'safety-incomplete'
  | 'not-tutored-in-period'

export const ROSTER_FILTERS: RosterFilter[] = [
  'all',
  'training-incomplete',
  'safety-incomplete',
  'not-tutored-in-period',
]

const ROSTER_FILTER_LABELS: Record<
  Exclude<RosterFilter, 'not-tutored-in-period'>,
  string
> = {
  all: 'All members',
  'training-incomplete': 'Training incomplete',
  'safety-incomplete': 'Safety approval incomplete',
}

export function rosterFilterLabel(
  filter: RosterFilter,
  period: RosterPeriod
): string {
  return filter === 'not-tutored-in-period'
    ? ROSTER_PERIOD_NOT_TUTORED_LABELS[period]
    : ROSTER_FILTER_LABELS[filter]
}

// A member can match several chips: one with neither training nor safety
// done matches two.
const filterPredicates: Record<
  RosterFilter,
  (member: NTHSRosterMemberPublic, period: RosterPeriod) => boolean
> = {
  all: () => true,
  // A closed account isn't training-incomplete, unapproved, etc. in any
  // meaningful sense, so it only ever shows under "All".
  'training-incomplete': (m) => !m.accountClosed && !m.trainingComplete,
  'safety-incomplete': (m) => !m.accountClosed && !m.safetyApproved,
  'not-tutored-in-period': (m, period) =>
    !m.accountClosed && hasNotTutoredIn(m, period),
}

export function filterRoster(
  members: NTHSRosterMemberPublic[],
  filter: RosterFilter,
  period: RosterPeriod
): NTHSRosterMemberPublic[] {
  const matches = filterPredicates[filter]
  return members.filter((member) => matches(member, period))
}

// Counts by running the table's own filter, so a chip cannot disagree with its rows.
export function rosterFilterCounts(
  members: NTHSRosterMemberPublic[],
  period: RosterPeriod
): Record<RosterFilter, number> {
  const counts = {} as Record<RosterFilter, number>
  for (const filter of ROSTER_FILTERS) {
    counts[filter] = filterRoster(members, filter, period).length
  }
  return counts
}

export type RosterSortKey =
  | 'name'
  | 'status'
  | 'sessions'
  | 'hours'
  | 'lastActive'

type RosterSortDirection = 'asc' | 'desc'

export type RosterSort = { key: RosterSortKey; direction: RosterSortDirection }

export const ROSTER_SORT_KEYS: RosterSortKey[] = [
  'name',
  'status',
  'sessions',
  'hours',
  'lastActive',
]

// The columns whose header names the selected period.
export const PERIOD_SORT_KEYS: RosterSortKey[] = ['sessions', 'hours']

export const DEFAULT_ROSTER_SORT: RosterSort = { key: 'name', direction: 'asc' }

// Activity columns open on the most active members, who are what a president
// sorts them to find.
const ROSTER_SORT_NATURAL_DIRECTIONS: Record<
  RosterSortKey,
  RosterSortDirection
> = {
  name: 'asc',
  status: 'asc',
  sessions: 'desc',
  hours: 'desc',
  lastActive: 'desc',
}

export const ROSTER_SORT_LABELS: Record<RosterSortKey, string> = {
  name: 'Member',
  status: 'Status',
  sessions: 'Sessions',
  hours: 'Hours',
  lastActive: 'Last active',
}

// Keyed by the CURRENT direction, but names the switch a press performs
// (the opposite direction) - a screen reader should hear what happens next,
// not the state it's already in.
export const ROSTER_SORT_TOGGLE_LABELS: Record<RosterSortDirection, string> = {
  asc: 'Switch to descending order',
  desc: 'Switch to ascending order',
}

export function nextRosterSort(
  current: RosterSort,
  key: RosterSortKey
): RosterSort {
  if (current.key !== key) {
    return { key, direction: ROSTER_SORT_NATURAL_DIRECTIONS[key] }
  }
  return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
}

const STATUS_SORT_RANK: Record<
  Exclude<RosterStatus, 'account-closed'>,
  number
> = {
  'training-incomplete': 0,
  'needs-safety-approval': 1,
  'ready-to-tutor': 2,
}

/**
 * Return undefined for a member with nothing to sort on, who then sorts last
 * in either direction. A closed account counts as no status.
 */
function rosterSortValue(
  member: NTHSRosterMemberPublic,
  key: RosterSortKey,
  period: RosterPeriod
): string | number | undefined {
  switch (key) {
    case 'name':
      return memberDisplayName(member)
    case 'status': {
      const status = rosterStatus(member)
      return status === 'account-closed' ? undefined : STATUS_SORT_RANK[status]
    }
    case 'sessions':
      return member.periodSessions[period] || undefined
    case 'hours':
      return member.periodHours[period] || undefined
    case 'lastActive': {
      if (!member.lastActiveAt) return undefined
      const time = new Date(member.lastActiveAt).getTime()
      return Number.isNaN(time) ? undefined : time
    }
  }
}

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b)
  return a < b ? -1 : a > b ? 1 : 0
}

export function sortRoster(
  members: NTHSRosterMemberPublic[],
  sort: RosterSort,
  period: RosterPeriod
): NTHSRosterMemberPublic[] {
  const sign = sort.direction === 'asc' ? 1 : -1
  return [...members].sort((a, b) => {
    // Closed rows sort last under every column, not just status - ahead of
    // the key comparison so direction can never surface one at the top.
    if (a.accountClosed !== b.accountClosed) {
      return a.accountClosed ? 1 : -1
    }
    const aValue = rosterSortValue(a, sort.key, period)
    const bValue = rosterSortValue(b, sort.key, period)
    if (aValue !== undefined && bValue !== undefined) {
      const byKey = compareValues(aValue, bValue)
      if (byKey) return byKey * sign
    } else if (aValue !== bValue) {
      return aValue === undefined ? 1 : -1
    }
    // Ties keep a fixed order whichever way the column points.
    return (
      compareValues(memberDisplayName(a), memberDisplayName(b)) ||
      compareValues(a.userId, b.userId)
    )
  })
}

// Names the start date because a file opened next month can no longer say
// which week "this week" was.
function csvPeriodLabel(
  period: CalendarRosterPeriod,
  periodStarts: Record<CalendarRosterPeriod, Date>
): string {
  const from = dayjs(periodStarts[period]).format('MMM D, YYYY')
  return `${ROSTER_PERIOD_LABELS[period].toLowerCase()}, from ${from}`
}

// A local calendar date rather than the table's relative "Today"/"3 days ago"
// wording, which would read wrong once the file is opened later.
function csvCalendarDate(value: string | undefined): string {
  if (!value) return ''
  const date = dayjs(value)
  return date.isValid() ? date.format('YYYY-MM-DD') : ''
}

type RosterCsvOptions = {
  period: RosterPeriod
  periodStarts: Record<CalendarRosterPeriod, Date>
  schoolYearLabel: string
}

// Takes the already-filtered rows, so the export cannot disagree with the table.
export function downloadRosterCsv(
  rows: NTHSRosterMemberPublic[],
  { period, periodStarts, schoolYearLabel }: RosterCsvOptions
): void {
  exportToCsv(
    'nths-chapter-members.csv',
    rows.map((member) => {
      let periodColumns: Record<string, number> = {}
      if (period !== 'thisSchoolYear') {
        const label =
          period === 'allTime'
            ? 'since joining'
            : csvPeriodLabel(period, periodStarts)
        periodColumns = {
          [`Sessions (${label})`]: member.periodSessions[period],
          [`Hours (${label})`]: member.periodHours[period],
        }
      }
      // Sessions and hours stay numeric so a spreadsheet can total them; the
      // table's em dash for zero would not sum.
      return {
        Name: memberDisplayName(member),
        Role: roleLabel(member),
        Training: member.trainingComplete ? 'Complete' : 'Incomplete',
        'Safety approval': member.safetyApproved ? 'Approved' : 'Not approved',
        Joined: csvCalendarDate(member.joinedAt),
        [`Sessions (${schoolYearLabel} school year)`]:
          member.periodSessions.thisSchoolYear,
        [`Hours (${schoolYearLabel} school year)`]:
          member.periodHours.thisSchoolYear,
        ...periodColumns,
        'Last active': csvCalendarDate(member.lastActiveAt),
      }
    }),
    // First names are user-entered.
    { guardFormulas: true, bom: true, lineEnding: '\r\n' }
  )
}

export function memberDisplayName(
  member: Pick<NTHSRosterMemberPublic, 'firstName' | 'lastInitial'>
): string {
  // users.last_name is NOT NULL, so LEFT(last_name, 1) yields '' rather than null.
  return member.lastInitial
    ? `${member.firstName} ${member.lastInitial}.`
    : member.firstName
}

const PRESIDENT_TITLE = 'President'

// The title stays on a founder after another admin demotes them, so the role
// has to agree before the roster still calls them president.
function isPresident(member: NTHSRosterMemberPublic): boolean {
  return member.title === PRESIDENT_TITLE && member.roleName === 'admin'
}

export function roleTagLabel(
  member: NTHSRosterMemberPublic
): string | undefined {
  if (isPresident(member)) return 'President'
  return member.roleName === 'admin' ? 'Admin' : undefined
}

export function roleLabel(member: NTHSRosterMemberPublic): string {
  if (isPresident(member)) return 'Chapter president'
  return member.roleName === 'admin' ? 'Chapter admin' : 'Member'
}

const NEVER_ACTIVE_LABEL = 'No sessions yet'

// Counts local calendar days, so 13 hours ago can already be "Yesterday".
// Math.round covers zones like America/Santiago, where a DST change skips
// midnight and startOf('day') lands at 01:00.
export function formatLastActive(value: string | undefined, now: Date): string {
  if (!value) return NEVER_ACTIVE_LABEL
  const lastActive = dayjs(value)
  if (!lastActive.isValid()) return NEVER_ACTIVE_LABEL

  const days = Math.round(
    Math.max(
      0,
      dayjs(now).startOf('day').diff(lastActive.startOf('day'), 'day', true)
    )
  )
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return 'Last week'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 60) return 'Last month'
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  const years = Math.floor(days / 365)
  return years === 1 ? 'Last year' : `${years} years ago`
}

const EM_DASH = '\u2014'

export function formatSessions(sessions: number): string {
  return sessions === 0 ? EM_DASH : String(sessions)
}

export function hoursLabel(hours: number): string {
  return isUnderOneTenth(hours)
    ? UNDER_ONE_TENTH_HOURS_LABEL
    : formatDecimalHours(hours)
}

function hrs(hours: number): string {
  const label = hoursLabel(hours)
  return `${label} ${plural(label, 'hr')}`
}

export function formatHours(hours: number): string {
  return hours === 0 ? EM_DASH : hrs(hours)
}

const NO_PERIOD_ACTIVITY_LABEL = 'None'

export function formatPeriodActivity(sessions: number, hours: number): string {
  if (sessions === 0) return NO_PERIOD_ACTIVITY_LABEL
  return `${sessions} ${plural(sessions, 'session')} · ${hrs(hours)}`
}
