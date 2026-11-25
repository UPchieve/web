export type Role = 'admin' | 'member'

// Mirrors server/constants/nths-titles.ts in subway; 'Member' means no title.
export type NTHSTitle =
  | 'President'
  | 'Vice President'
  | 'Executive Board Member'
  | 'Member'
export const LEADERSHIP_TITLES: readonly NTHSTitle[] = [
  'President',
  'Vice President',
]

export type NTHSMemberUpdate = {
  role?: Role
  title?: NTHSTitle
  isActive?: false
}

export type GroupMember = {
  userId: string
  nthsGroupId: string
  title: NTHSTitle
  roleName: Role
  firstName: string
  lastInitial: string
  accountClosed?: boolean
}

export const NTHS_APPLY_URL = 'https://nationaltutor.org/apply'

const MS_PER_DAY = 86_400_000

export function tipForDay(tips: string[], date: Date): string | undefined {
  if (!tips.length) return undefined
  const localDay = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY
  )
  return tips[localDay % tips.length]
}

export function isAppPath(link: string) {
  return (
    link.startsWith('/') && !link.startsWith('//') && !/[\\\t\n\r]/.test(link)
  )
}

export const NTHS_RESOURCES_URL = 'https://nationaltutor.org/resources'
export const NTHS_RECRUITMENT_TEMPLATES_URL =
  'https://nationaltutor.org/resources/recruitment-templates'
export const SCHOOL_AFFILIATION_ACTION =
  'MARKED SCHOOL AFFILIATION IN PROGRESS' satisfies NTHSActionName
export const OPTED_OUT_ACTION = 'OPTED OUT' satisfies NTHSActionName

export type NTHSSchoolAffiliationActionName =
  | 'MARKED SCHOOL AFFILIATION IN PROGRESS'
  | 'SUBMITTED ADVISOR CONTACT INFO'
  | 'ADVISOR VERIFIED'
  | 'SCHOOL AFFILIATION DENIED'
  | 'OPTED OUT'

export type NTHSActionName =
  | 'NAMED YOUR TEAM'
  | 'REVIEWED RESOURCES'
  | 'ATTENDED ORIENTATION'
  | 'RECRUITMENT SPRINT'
  | NTHSSchoolAffiliationActionName

export type AffiliationStatus =
  | 'PENDING_SCHOOL_AFFILIATION'
  | 'PENDING_UPCHIEVE_VERIFICATION'
  | 'AFFILIATED'
  | 'DENIED'
  | 'OPTED_OUT'
  | 'UNAFFILIATED'

// Chapter renewal payloads, mirroring server/contracts/nths-group.ts in subway.
export type NTHSRenewalPrompt =
  | 'none'
  | 'handoff-banner'
  | 'confirm-return'
  | 'confirm-reminder'
  | 'president-not-cleared'
  | 'member-not-cleared'
  | 'member-countdown'
  | 'step-up'

// Dates are YYYY-MM-DD, null when the chapter isn't renewing.
export type NTHSRenewalPublic = {
  prompt: NTHSRenewalPrompt
  closesOn: string | null
  successorConfirmationOn: string | null
}

export type NTHSRenewalResponse = { renewal: NTHSRenewalPublic }

export type NTHSAcceptanceOutcome = 'accepted' | 'has_president'

export type NTHSRenewalAcceptResponse = NTHSRenewalResponse & {
  outcome: NTHSAcceptanceOutcome
}

export type NTHSRenewalCommitmentKey =
  | 'commitWeeklyHours'
  | 'commitRecruitThreeTutors'
  | 'commitHostFourMeetings'
  | 'commitFortyTutoringHours'
  | 'commitRecruitKnownHighSchoolers'

export type NTHSRenewalCommitments = Record<NTHSRenewalCommitmentKey, true>

export type NTHSAcceptanceReason = 'renewal' | 'step-up'
