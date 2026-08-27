import store from '@/store'
import NetworkService from './NetworkService'

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

// Only the actions listed here render as checkboxes; the rest of upchieve.nths_actions
// (school affiliation) comes back from the same endpoint and is driven elsewhere.
export const actionsCtaMap: Partial<
  Record<NTHSActionName, { text: string; url?: string }>
> = {
  'NAMED YOUR TEAM': { text: 'Name your team in "Settings" below' },
  'REVIEWED RESOURCES': {
    text: 'Review NTHS resources',
    url: NTHS_RESOURCES_URL,
  },
  'ATTENDED ORIENTATION': {
    text: 'Complete orientation',
    url: NTHS_ORIENTATION_URL,
  },
  'RECRUITMENT SPRINT': { text: 'Complete the recruitment sprint' },
}

export enum CheckboxStatus {
  Done = 'done',
  NotDone = 'not-done',
  Saving = 'saving',
}

export type GroupAction = {
  id: number
  groupId: string
  actionId: number
  createdAt: Date
  actionName: NTHSActionName
}

export type SchoolAffiliationAction = {
  actionName: NTHSSchoolAffiliationActionName
} & Omit<GroupAction, 'actionName'>

export type ChecklistItem = {
  text: string
  url?: string
  status: CheckboxStatus
  actionId: number
  actionName: NTHSActionName
}

export async function toggleCheckbox({
  checklist,
  item,
  groupActions,
  groupId,
}: {
  checklist: ChecklistItem[]
  item: ChecklistItem
  groupActions: GroupAction[]
  groupId: string
}) {
  const i = checklist.find(({ text }) => text === item.text)
  if (i) {
    try {
      store.dispatch('nths/appendToChecksInFlight', i.actionId)
      let result
      if (!groupActions.some(({ actionId }) => actionId === i.actionId)) {
        result = await NetworkService.createActionForNTHSGroup(
          groupId,
          i.actionName
        )
        store.dispatch('nths/addNTHSGroupAction', result.data.action)
      }
    } finally {
      store.dispatch('nths/removeFromChecksInFlight', i.actionId)
    }
  }
}
