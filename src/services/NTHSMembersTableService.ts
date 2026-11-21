import type { NTHSRosterMemberPublic } from '@/services/NTHSGroupService'
import { rosterStatus } from '@/services/NTHSRosterService'

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
