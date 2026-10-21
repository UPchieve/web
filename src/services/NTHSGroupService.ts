import type { DateString, Uuid } from '@/types/shared'

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

// NTHS Chapter HQ payloads, mirroring server/public/nths.ts.
export type NTHSSchoolYearPublic = {
  label: string
  startsAt: DateString
  endsAt: DateString
}
export type NTHSImpactTotalsPublic = {
  studentsHelped: number
  sessionsCompleted: number
  hoursTutored: number
}
export type NTHSChapterImpactPublic = {
  groupId: Uuid
  schoolYear: NTHSSchoolYearPublic
  schoolYearToDate: NTHSImpactTotalsPublic & { membersTutoring: number }
  allTime: NTHSImpactTotalsPublic
  goals: { hoursTutored: number; membersTutoring: number }
}
// From the request's monthStartsAt (or the UTC 1st of the month) to now.
export type NTHSChapterMonthPublic = {
  // Omitted when no current member tutored a counted session this month.
  topTutorThisMonth?: NTHSTopTutorPublic
  // Only ever the requester's own hours.
  viewerHoursThisMonth: number
}
export type NTHSChapterImpactResponse = {
  impact: NTHSChapterImpactPublic & NTHSChapterMonthPublic
}

export type NTHSRosterMemberPublic = {
  userId: Uuid
  firstName: string
  lastInitial: string
  roleName: Role
  title: NTHSTitle
  joinedAt: DateString
  trainingComplete: boolean
  safetyApproved: boolean
  accountClosed: boolean
  sessionsThisYear: number
  hoursThisYear: number
  periodHours: {
    thisWeek: number
    lastTwoWeeks: number
    thisMonth: number
    thisSchoolYear: number
    allTime: number
  }
  periodSessions: NTHSRosterMemberPublic['periodHours']
  lastActiveAt?: DateString
}
export type NTHSTopTutorPublic = {
  userId: Uuid
  firstName: string
  lastInitial: string
  hoursTutored: number
  sessionsCompleted: number
}
export type NTHSChapterRosterPublic = {
  groupId: Uuid
  schoolYear: NTHSSchoolYearPublic
  members: NTHSRosterMemberPublic[]
  // Absent when no current member tutored a counted session since the
  // monthStartsAt the request sent.
  topTutorThisMonth?: NTHSTopTutorPublic
}
export type NTHSChapterRosterResponse = { roster: NTHSChapterRosterPublic }

export const NTHS_ORIENTATION_URL = 'https://nationaltutor.org/orientation'
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
