import store from '@/store'
import NetworkService from './NetworkService'
import LoggerService from './LoggerService'

export type Role = 'admin' | 'member'
export type GroupMember = {
  userId: string
  nthsGroupId: string
  title: string | null
  roleName: Role
  firstName: string
  lastInitial: string
}

export const NTHS_ORIENTATION_URL = 'https://nationaltutor.org/orientation'
export const NTHS_RESOURCES_URL = 'https://nationaltutor.org/resources'
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
  DENIED: true,
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

export const NTHS_SETTINGS_ROUTE = '/groups/settings'

export type ChecklistControl = {
  text: string
  controlText?: string
  url?: string
  routeTo?: string
  lockedTooltip?: string
}

// Renders in this order; upchieve.nths_actions comes back unordered. Only the
// actions listed here render as checkboxes. The other school affiliation rows
// arrive from the same endpoint and are driven by the settings card.
export const checklistControls: (ChecklistControl & {
  action: NTHSActionName
})[] = [
  {
    action: 'ATTENDED ORIENTATION',
    text: 'Complete orientation',
    controlText: 'Open orientation',
    url: NTHS_ORIENTATION_URL,
  },
  {
    action: 'NAMED YOUR TEAM',
    text: 'Name your team',
    controlText: 'Edit in Settings',
    routeTo: NTHS_SETTINGS_ROUTE,
  },
  {
    action: 'REVIEWED RESOURCES',
    text: 'Review NTHS resources',
    controlText: 'View resources',
    url: NTHS_RESOURCES_URL,
  },
  {
    action: SCHOOL_AFFILIATION_ACTION,
    text: 'Choose your chapter type',
    controlText: 'Choose in Settings',
    routeTo: NTHS_SETTINGS_ROUTE,
    lockedTooltip:
      'Choose your chapter type in Settings and this ticks itself.',
  },
  { action: 'RECRUITMENT SPRINT', text: 'Complete the recruitment sprint' },
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

export async function toggleCheckbox({
  item,
  groupId,
}: {
  item: ChecklistItem
  groupId: string
}) {
  if (item.locked) return

  try {
    store.dispatch('nths/appendToChecksInFlight', item.actionId)
    const result = await NetworkService.createActionForNTHSGroup(
      groupId,
      item.actionName
    )
    store.dispatch('nths/addNTHSGroupAction', result.data.action)
  } catch (err) {
    // The checkbox reverts to unchecked when the spinner clears.
    LoggerService.noticeError(err)
  } finally {
    store.dispatch('nths/removeFromChecksInFlight', item.actionId)
  }
}
