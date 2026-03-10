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

export const actionsCtaMap = {
  'NAMED YOUR TEAM': 'Name your team in "Settings" below',
  'REVIEWED RESOURCES': 'Review UPchieve resources',
  'ATTENDED ORIENTATION': 'Attend orientation',
}
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
  | NTHSSchoolAffiliationActionName

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
