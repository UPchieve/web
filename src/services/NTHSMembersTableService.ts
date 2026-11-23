import type { NTHSRosterMemberPublic } from '@/services/NTHSGroupService'
import { daysSince, memberDisplayName } from '@/services/NTHSRosterService'

// Home's table counts this week for its status and the school year for its
// hours; the Members tab counts the range its picker selects for both.
export type MembersTableScope = 'home' | 'range'

export type MemberStatus =
  | 'account-closed'
  | 'needs-training'
  | 'needs-approval'
  | 'active-this-week'
  | 'no-hours-this-week'
  | 'active'
  | 'no-hours'

export function memberStatus(
  member: NTHSRosterMemberPublic,
  scope: MembersTableScope
): MemberStatus {
  if (member.accountClosed) return 'account-closed'
  if (!member.trainingComplete) return 'needs-training'
  if (!member.safetyApproved) return 'needs-approval'
  if (scope === 'range') return member.rangeHours > 0 ? 'active' : 'no-hours'
  return member.periodHours.thisWeek > 0
    ? 'active-this-week'
    : 'no-hours-this-week'
}

export type MemberFilter =
  | 'everyone'
  | Extract<
      MemberStatus,
      'needs-training' | 'needs-approval' | 'no-hours-this-week' | 'no-hours'
    >

export function memberFilters(scope: MembersTableScope): MemberFilter[] {
  return [
    'everyone',
    'needs-training',
    'needs-approval',
    scope === 'range' ? 'no-hours' : 'no-hours-this-week',
  ]
}

export function filterMembers(
  members: NTHSRosterMemberPublic[],
  filter: MemberFilter,
  scope: MembersTableScope
): NTHSRosterMemberPublic[] {
  if (filter === 'everyone') return members
  return members.filter((member) => memberStatus(member, scope) === filter)
}

export function memberHours(
  member: NTHSRosterMemberPublic,
  scope: MembersTableScope
): number {
  return scope === 'range'
    ? member.rangeHours
    : member.periodHours.thisSchoolYear
}

export function memberSessions(
  member: NTHSRosterMemberPublic,
  scope: MembersTableScope
): number {
  return scope === 'range'
    ? member.rangeSessions
    : member.periodSessions.thisSchoolYear
}

export type MemberSortKey =
  | 'name'
  | 'hours'
  | 'sessions'
  | 'role'
  | 'status'
  | 'screen'
  | 'training'
  | 'first'
  | 'days'

export const MEMBER_SORT_KEYS: MemberSortKey[] = [
  'name',
  'hours',
  'sessions',
  'role',
  'status',
  'screen',
  'training',
  'first',
  'days',
]

export type MemberSort = {
  key: MemberSortKey
  direction: 'asc' | 'desc'
}

export const DEFAULT_MEMBER_SORT: MemberSort = { key: 'name', direction: 'asc' }

export function nextMemberSort(
  current: MemberSort,
  key: MemberSortKey
): MemberSort {
  if (current.key !== key) return { key, direction: 'asc' }
  return current.direction === 'asc'
    ? { key, direction: 'desc' }
    : DEFAULT_MEMBER_SORT
}

const STATUS_SORT_RANK: Record<MemberStatus, number> = {
  'active-this-week': 0,
  active: 0,
  'no-hours-this-week': 1,
  'no-hours': 1,
  'needs-approval': 2,
  'needs-training': 3,
  'account-closed': 4,
}

function roleSortRank(member: NTHSRosterMemberPublic): number {
  if (member.accountClosed) return 4
  switch (member.title) {
    case 'President':
      return 0
    case 'Vice President':
      return 1
    case 'Executive Board Member':
      return 2
  }
  return member.roleName === 'admin' ? 3 : 4
}

function memberSortValue(
  member: NTHSRosterMemberPublic,
  key: Exclude<MemberSortKey, 'name'>,
  now: Date,
  scope: MembersTableScope
): number {
  switch (key) {
    case 'hours':
      return memberHours(member, scope)
    case 'sessions':
      return memberSessions(member, scope)
    case 'role':
      return roleSortRank(member)
    case 'status':
      return STATUS_SORT_RANK[memberStatus(member, scope)]
    case 'screen':
      return Number(member.safetyApproved)
    case 'training':
      return Number(member.trainingComplete)
    case 'first':
      return Number(member.periodSessions.thisSchoolYear > 0)
    case 'days':
      return daysSince(member.lastActiveAt, now) ?? Infinity
  }
}

function compareNames(
  a: NTHSRosterMemberPublic,
  b: NTHSRosterMemberPublic
): number {
  return (
    memberDisplayName(a).localeCompare(memberDisplayName(b)) ||
    (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0)
  )
}

export function sortMembers(
  members: NTHSRosterMemberPublic[],
  sort: MemberSort,
  now: Date,
  scope: MembersTableScope
): NTHSRosterMemberPublic[] {
  const { key } = sort
  const sign = sort.direction === 'desc' ? -1 : 1
  const byName = [...members].sort(compareNames)
  if (key === 'name') return sign === 1 ? byName : byName.reverse()
  return byName.sort((a, b) => {
    const aValue = memberSortValue(a, key, now, scope)
    const bValue = memberSortValue(b, key, now, scope)
    if (aValue !== bValue) return aValue < bValue ? -sign : sign
    if (key !== 'hours' || scope === 'range') return 0
    // Ties go the way the rank badges do: more sessions, then the lower userId.
    return (
      sign *
      (memberSessions(a, scope) - memberSessions(b, scope) ||
        (a.userId < b.userId ? 1 : -1))
    )
  })
}
