import type {
  NTHSRosterMemberPublic,
  NTHSTitle,
} from '@/services/NTHSGroupService'
import exportToCsv from '@/utils/export-to-csv'
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

export type RosterRange = {
  // Absent for days picked on the calendar.
  period?: RosterPeriod
  firstDay: Date
  lastDay: Date
}

export type RosterRangeBounds = { startsAt: Date; endsAt: Date }

// Quick picks never reach back before the chapter was founded, the calendar's
// earliest day.
export function periodRange(
  period: RosterPeriod,
  now: Date,
  foundedOn: Date,
  schoolYearStartsOn: Date
): RosterRange {
  const starts: Record<RosterPeriod, Date> = {
    ...rosterPeriodStarts(now),
    thisSchoolYear: schoolYearStartsOn,
    allTime: foundedOn,
  }
  const start = starts[period]
  return {
    period,
    firstDay: start < foundedOn ? foundedOn : start,
    lastDay: dayjs(now).startOf('day').toDate(),
  }
}

// The server counts sessions in [startsAt, endsAt) and clamps an end past its
// own clock, so the end is the midnight after the last day.
export function rangeBounds(range: RosterRange): RosterRangeBounds {
  return {
    startsAt: range.firstDay,
    endsAt: dayjs(range.lastDay).add(1, 'day').startOf('day').toDate(),
  }
}

function rangeDays(range: RosterRange, format: string): string {
  const first = dayjs(range.firstDay).format(format)
  const last = dayjs(range.lastDay).format(format)
  return first === last ? first : `${first} – ${last}`
}

export function rangeLabel(range: RosterRange): string {
  if (range.period) return ROSTER_PERIOD_LABELS[range.period]
  const thisYear = new Date().getFullYear()
  const inThisYear =
    range.firstDay.getFullYear() === thisYear &&
    range.lastDay.getFullYear() === thisYear
  return rangeDays(range, inThisYear ? 'MMM D' : 'MMM D, YYYY')
}

// A local calendar date rather than the table's relative "Today"/"3 days ago"
// wording, which would read wrong once the file is opened later.
function csvCalendarDate(value: string | undefined): string {
  if (!value) return ''
  const date = dayjs(value)
  return date.isValid() ? date.format('YYYY-MM-DD') : ''
}

type RosterCsvOptions = {
  // Unfiltered, so a co-president the filter hides still makes the other one
  // read as co-president.
  roster: NTHSRosterMemberPublic[]
  range?: RosterRange
  schoolYearLabel: string
}

// Names both days because a file opened next month can no longer say which
// week "this week" was.
function csvRangeLabel(range: RosterRange): string {
  return range.period === 'allTime'
    ? 'since joining'
    : rangeDays(range, 'MMM D, YYYY')
}

// Takes the already-filtered rows, so the export cannot disagree with the table.
export function downloadRosterCsv(
  rows: NTHSRosterMemberPublic[],
  { roster, range, schoolYearLabel }: RosterCsvOptions
): void {
  exportToCsv(
    'nths-chapter-members.csv',
    rows.map((member) => {
      let rangeColumns: Record<string, number> = {}
      if (range && range.period !== 'thisSchoolYear') {
        const label = csvRangeLabel(range)
        rangeColumns = {
          [`Sessions (${label})`]: member.rangeSessions,
          [`Hours (${label})`]: member.rangeHours,
        }
      }
      // Sessions and hours stay numeric so a spreadsheet can total them.
      return {
        Name: memberDisplayName(member),
        Role: roleTagLabel(member, roster) ?? 'Member',
        Training: member.trainingComplete ? 'Complete' : 'Incomplete',
        'Safety approval': member.safetyApproved ? 'Approved' : 'Not approved',
        Joined: csvCalendarDate(member.joinedAt),
        [`Sessions (${schoolYearLabel} school year)`]:
          member.periodSessions.thisSchoolYear,
        [`Hours (${schoolYearLabel} school year)`]:
          member.periodHours.thisSchoolYear,
        ...rangeColumns,
        Subjects: member.subjects.join(', '),
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

type NTHSDisplayTitle =
  | 'President'
  | 'Co-President'
  | 'Vice President'
  | 'Executive Board Member'

type PresidencyLabel = Extract<NTHSDisplayTitle, 'President' | 'Co-President'>

function isCurrentPresident(
  member: Pick<NTHSRosterMemberPublic, 'title' | 'accountClosed'>
): boolean {
  return member.title === 'President' && !member.accountClosed
}

function presidencyLabel(presidentCount: number): PresidencyLabel {
  return presidentCount >= 2 ? 'Co-President' : 'President'
}

export function displayTitle(
  member: Pick<NTHSRosterMemberPublic, 'title' | 'accountClosed'>,
  roster: Pick<NTHSRosterMemberPublic, 'title' | 'accountClosed'>[]
): NTHSDisplayTitle | undefined {
  if (member.accountClosed) return undefined
  if (member.title === 'President')
    return presidencyLabel(roster.filter(isCurrentPresident).length)
  return member.title === 'Member' ? undefined : member.title
}

// Leaves out the member being edited, so a sole president editing their own
// title is offered "President".
export function presidencyChoiceLabel(
  roster: Pick<NTHSRosterMemberPublic, 'userId' | 'title' | 'accountClosed'>[],
  editingUserId: string
): PresidencyLabel {
  const others = roster.filter(
    (m) => m.userId !== editingUserId && isCurrentPresident(m)
  )
  return presidencyLabel(others.length + 1)
}

function storedTitle(member: NTHSRosterMemberPublic) {
  return member.title === 'Member' ? undefined : member.title
}

export function roleTagLabel(
  member: NTHSRosterMemberPublic,
  roster: NTHSRosterMemberPublic[]
): string | undefined {
  const title = member.accountClosed
    ? storedTitle(member)
    : displayTitle(member, roster)
  if (title) return title
  return member.roleName === 'admin' ? 'Admin' : undefined
}

export type TitleChoice = { title: NTHSTitle; label: string }

export function titleChoices(
  member: Pick<NTHSRosterMemberPublic, 'userId'>,
  roster: Pick<NTHSRosterMemberPublic, 'userId' | 'title' | 'accountClosed'>[],
  asAdmin: boolean
): TitleChoice[] {
  const leadership: TitleChoice[] = asAdmin
    ? [
        {
          title: 'President',
          label: presidencyChoiceLabel(roster, member.userId),
        },
        { title: 'Vice President', label: 'Vice President' },
      ]
    : []
  return [
    ...leadership,
    { title: 'Executive Board Member', label: 'Executive Board Member' },
    { title: 'Member', label: 'No title' },
  ]
}

export type RosterMemberAction =
  | 'make_admin'
  | 'change_title'
  | 'remove_admin'
  | 'remove'

export const ROSTER_MEMBER_ACTION_LABELS: Record<RosterMemberAction, string> = {
  make_admin: 'Make admin',
  change_title: 'Change title',
  remove_admin: 'Remove admin',
  remove: 'Remove',
}

export function rosterMemberActions(
  member: NTHSRosterMemberPublic,
  viewerId: string
): RosterMemberAction[] {
  if (member.accountClosed) return ['remove']
  if (member.userId === viewerId) return ['change_title']
  const roleAction = member.roleName === 'admin' ? 'remove_admin' : 'make_admin'
  return [roleAction, 'change_title', 'remove']
}

export const NEVER_ACTIVE_LABEL = 'No sessions yet'

// Counts local calendar days, so 13 hours ago can already be "Yesterday".
// Math.round covers zones like America/Santiago, where a DST change skips
// midnight and startOf('day') lands at 01:00.
export function daysSince(
  value: string | undefined,
  now: Date
): number | undefined {
  if (!value) return undefined
  const lastActive = dayjs(value)
  if (!lastActive.isValid()) return undefined

  return Math.round(
    Math.max(
      0,
      dayjs(now).startOf('day').diff(lastActive.startOf('day'), 'day', true)
    )
  )
}
