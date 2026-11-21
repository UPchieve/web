import type { NTHSRosterMemberPublic } from '@/services/NTHSGroupService'
import {
  DEFAULT_ROSTER_SORT,
  daysSince,
  rosterStatus,
  sortRoster,
} from '@/services/NTHSRosterService'

export type MemberStatus =
  | 'needs-training'
  | 'needs-approval'
  | 'active-this-week'
  | 'no-hours-this-week'

export function memberStatus(member: NTHSRosterMemberPublic): MemberStatus {
  const status = rosterStatus(member)
  if (status === 'training-incomplete') return 'needs-training'
  if (status === 'needs-safety-approval') return 'needs-approval'
  return member.periodHours.thisWeek > 0
    ? 'active-this-week'
    : 'no-hours-this-week'
}

export const MEMBER_FILTERS = [
  'everyone',
  'needs-training',
  'needs-approval',
  'no-hours-this-week',
] as const

export type MemberFilter = (typeof MEMBER_FILTERS)[number]

export function filterMembers(
  members: NTHSRosterMemberPublic[],
  filter: MemberFilter
): NTHSRosterMemberPublic[] {
  if (filter === 'everyone') return members
  return members.filter((member) => memberStatus(member) === filter)
}

export type MemberSortKey =
  | 'name'
  | 'hours'
  | 'status'
  | 'screen'
  | 'training'
  | 'first'
  | 'days'

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
  'no-hours-this-week': 1,
  'needs-approval': 2,
  'needs-training': 3,
}

function memberSortValue(
  member: NTHSRosterMemberPublic,
  key: Exclude<MemberSortKey, 'name'>,
  now: Date
): number {
  switch (key) {
    case 'hours':
      return member.periodHours.thisSchoolYear
    case 'status':
      return STATUS_SORT_RANK[memberStatus(member)]
    case 'screen':
      return Number(member.safetyApproved)
    case 'training':
      return Number(member.trainingComplete)
    case 'first':
      return Number(member.periodSessions.allTime > 0)
    case 'days':
      return daysSince(member.lastActiveAt, now) ?? Infinity
  }
}

export function sortMembers(
  members: NTHSRosterMemberPublic[],
  sort: MemberSort,
  now: Date
): NTHSRosterMemberPublic[] {
  const { key } = sort
  if (key === 'name')
    return sortRoster(
      members,
      { key, direction: sort.direction },
      'thisSchoolYear'
    )
  const sign = sort.direction === 'desc' ? -1 : 1
  return sortRoster(members, DEFAULT_ROSTER_SORT, 'thisSchoolYear').sort(
    (a, b) => {
      const aValue = memberSortValue(a, key, now)
      const bValue = memberSortValue(b, key, now)
      if (aValue !== bValue) return aValue < bValue ? -sign : sign
      if (key !== 'hours') return 0
      // Ties go the way the rank badges do: more sessions, then the lower userId.
      return (
        sign *
        (a.periodSessions.thisSchoolYear - b.periodSessions.thisSchoolYear ||
          (a.userId < b.userId ? 1 : -1))
      )
    }
  )
}
