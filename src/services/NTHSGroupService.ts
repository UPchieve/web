import store from '@/store'
import NetworkService from './NetworkService'
import LoggerService from './LoggerService'
import type { DateString, Uuid } from '@/types/shared'

export type Role = 'admin' | 'member'
export type GroupMember = {
  userId: string
  nthsGroupId: string
  title: string | null
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
  // Omitted when no current member other than the president qualifies.
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
  title?: string
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
  // Absent when no current member (other than the president) tutored a
  // counted session since the monthStartsAt the request sent.
  topTutorThisMonth?: NTHSTopTutorPublic
}
export type NTHSChapterRosterResponse = { roster: NTHSChapterRosterPublic }

export const NTHS_ORIENTATION_URL = 'https://nationaltutor.org/orientation'
export const NTHS_RESOURCES_URL = 'https://nationaltutor.org/resources'
export const NTHS_RECRUITMENT_TEMPLATES_URL =
  'https://nationaltutor.org/resources/recruitment-templates'
export const NTHS_RECRUITMENT_SPRINT_URL =
  'https://nationaltutor.org/orientation/6'
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

const affiliationPathChosen: Record<AffiliationStatus, boolean> = {
  PENDING_SCHOOL_AFFILIATION: true,
  PENDING_UPCHIEVE_VERIFICATION: true,
  AFFILIATED: true,
  // A denied chapter has to pick a path again, so the checklist reopens to send
  // the president back to Settings.
  DENIED: false,
  OPTED_OUT: true,
  // UNAFFILIATED means we already have school information for the chapter
  // from the application process, before the president opted in or out.
  UNAFFILIATED: false,
}

export function hasChosenAffiliationPath(
  status: AffiliationStatus | null
): boolean {
  if (status === null) return false
  return affiliationPathChosen[status] ?? false
}

export const NTHS_SETUP_ROUTE = '/groups/setup'

export type ChecklistControl = {
  text: string
  help?: string
  controlText?: string
  url?: string
  routeTo?: string
  lockedTooltip?: string
}

// Renders in this order; upchieve.nths_actions comes back unordered. Only the
// actions listed here render as checkboxes. The other school affiliation rows
// arrive from the same endpoint and are driven by the chapter setup card.
export const checklistControls: (ChecklistControl & {
  action: NTHSActionName
})[] = [
  {
    action: 'ATTENDED ORIENTATION',
    text: 'Complete orientation',
    help: 'Start with the president orientation on nationaltutor.org.',
    controlText: 'Orientation',
    url: NTHS_ORIENTATION_URL,
  },
  {
    action: 'NAMED YOUR TEAM',
    text: 'Name your chapter',
    help: 'Pick the name your members and students will see.',
    controlText: 'Edit in Chapter setup',
    routeTo: NTHS_SETUP_ROUTE,
  },
  {
    action: 'REVIEWED RESOURCES',
    text: 'Review NTHS resources',
    help: 'Guides and templates for running your chapter.',
    controlText: 'View resources',
    url: NTHS_RESOURCES_URL,
  },
  {
    action: SCHOOL_AFFILIATION_ACTION,
    text: 'Choose your chapter type',
    help: 'School-approved or community. Chapter setup records the choice.',
    controlText: 'Choose in Chapter setup',
    routeTo: NTHS_SETUP_ROUTE,
    lockedTooltip:
      'Choose your chapter type in Chapter setup and this ticks itself.',
  },
  {
    action: 'RECRUITMENT SPRINT',
    text: 'Complete the recruitment sprint',
    help: 'Invite your first members and get them tutoring.',
    controlText: 'Recruitment Sprint',
    url: NTHS_RECRUITMENT_SPRINT_URL,
  },
]

export enum CheckboxStatus {
  Done = 'done',
  NotDone = 'not-done',
  Saving = 'saving',
}

export type NTHSAction = {
  id: number
  name: NTHSActionName
}

// A locked item can't be ticked by the president and may have no nths_actions row
// to toggle.
export type ChecklistItem = ChecklistControl & {
  status: CheckboxStatus
  actionName: NTHSActionName
} & ({ locked: true; actionId?: never } | { locked?: false; actionId: number })

// Resolves false rather than rejecting on failure, which is already logged here.
export async function toggleCheckbox({
  item,
  groupId,
}: {
  item: ChecklistItem
  groupId: string
}): Promise<boolean> {
  if (item.locked) return false

  try {
    store.dispatch('nths/appendToChecksInFlight', item.actionId)
    if (item.status === CheckboxStatus.Done) {
      await NetworkService.deleteActionForNTHSGroup(groupId, item.actionName)
      store.dispatch('nths/removeNTHSGroupAction', item.actionId)
    } else {
      const result = await NetworkService.createActionForNTHSGroup(
        groupId,
        item.actionName
      )
      store.dispatch('nths/addNTHSGroupAction', result.data.action)
    }
    return true
  } catch (err) {
    // The checkbox reverts to its prior state when the spinner clears.
    LoggerService.noticeError(err)
    return false
  } finally {
    store.dispatch('nths/removeFromChecksInFlight', item.actionId)
  }
}
