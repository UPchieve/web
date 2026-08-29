import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import LoggerService from '@/services/LoggerService'
import { CheckboxStatus, type ChecklistItem } from '@/services/NTHSGroupService'

vi.mock('../../../../src/services/NetworkService')
vi.mock('@/services/LoggerService', () => ({
  default: { noticeError: vi.fn() },
}))

const refreshAfterProfileChange = (storeOptions.modules as any).nths.actions
  .refreshAfterProfileChange

describe('nths/refreshAfterProfileChange', () => {
  beforeEach(() => vi.mocked(LoggerService.noticeError).mockClear())

  it('refetches so the sidebar and route guards see the new eligibility', async () => {
    const dispatch = vi.fn().mockResolvedValue([])
    await refreshAfterProfileChange({ dispatch })
    expect(dispatch).toHaveBeenCalledWith('fetchNthsData')
  })

  // The profile itself saved. Surfacing this would tell the coach their change
  // did not take, and the caller has no way to distinguish the two.
  it('reports a failed refetch rather than rejecting', async () => {
    const boom = new Error('network down')
    const dispatch = vi.fn().mockRejectedValue(boom)

    await expect(
      refreshAfterProfileChange({ dispatch })
    ).resolves.toBeUndefined()
    expect(LoggerService.noticeError).toHaveBeenCalledWith(
      boom,
      'Could not refresh NTHS data after a profile change'
    )
  })
})

const NAMED_YOUR_TEAM = { id: 1, name: 'NAMED YOUR TEAM' }
const REVIEWED_RESOURCES = { id: 2, name: 'REVIEWED RESOURCES' }
const ATTENDED_ORIENTATION = { id: 3, name: 'ATTENDED ORIENTATION' }
const SCHOOL_AFFILIATION = {
  id: 4,
  name: 'MARKED SCHOOL AFFILIATION IN PROGRESS',
}
const RECRUITMENT_SPRINT = { id: 5, name: 'RECRUITMENT SPRINT' }

// the endpoint returns upchieve.nths_actions unordered, so these are deliberately shuffled
const ALL_ACTIONS = [
  RECRUITMENT_SPRINT,
  SCHOOL_AFFILIATION,
  NAMED_YOUR_TEAM,
  ATTENDED_ORIENTATION,
  REVIEWED_RESOURCES,
]

const getStore = (
  state: {
    NTHSActions?: { id: number; name: string }[]
    NTHSGroupActions?: { actionId: number }[]
    checksInFlight?: number[]
    schoolAffiliationStatus?: string | null
  } = {}
) => {
  const {
    NTHSActions = ALL_ACTIONS,
    NTHSGroupActions = [],
    checksInFlight = [],
    schoolAffiliationStatus = null,
  } = state

  return createStore({
    modules: {
      ...storeOptions.modules,
      nths: {
        ...storeOptions.modules.nths,
        state: {
          ...storeOptions.modules.nths.state,
          NTHSGroups: [
            { groupInfo: { id: 'group-1' }, schoolAffiliationStatus },
          ],
          NTHSActions,
          NTHSGroupActions,
          checksInFlight,
        },
      },
    },
  })
}

const checklistOf = (...args: Parameters<typeof getStore>): ChecklistItem[] =>
  getStore(...args).getters['nths/NTHSChecklist']

const schoolApprovalItemIn = (checklist: ChecklistItem[]) => {
  const item = checklist.find(
    ({ actionName }) => actionName === SCHOOL_AFFILIATION.name
  )
  if (!item) throw new Error('the school approval item is missing')
  return item
}

const namesIn = (checklist: ChecklistItem[]) =>
  checklist.map(({ actionName }) => actionName)

const statusIn = (checklist: ChecklistItem[], actionName: string) =>
  checklist.find((item) => item.actionName === actionName)?.status

describe('nths store NTHSChecklist getter', () => {
  it('orders the checklist by the control map, not by the action rows', () => {
    expect(namesIn(checklistOf())).toEqual([
      'ATTENDED ORIENTATION',
      'NAMED YOUR TEAM',
      'REVIEWED RESOURCES',
      'MARKED SCHOOL AFFILIATION IN PROGRESS',
      'RECRUITMENT SPRINT',
    ])
  })

  it('renders nothing until the actions have loaded', () => {
    expect(checklistOf({ NTHSActions: [] })).toEqual([])
  })

  it('routes the school approval item to the settings tab instead of an external url', () => {
    const item = schoolApprovalItemIn(checklistOf())

    expect(item.routeTo).toBe('/groups/settings')
    expect(item.url).toBeUndefined()
    expect(item.actionId).toBeUndefined()
  })

  it('locks only the school approval item', () => {
    const checklist = checklistOf()

    expect(
      checklist
        .filter(({ locked }) => locked)
        .map(({ actionName }) => actionName)
    ).toEqual(['MARKED SCHOOL AFFILIATION IN PROGRESS'])
  })

  it('leaves the school approval item not done until a choice is recorded', () => {
    const item = schoolApprovalItemIn(
      checklistOf({ schoolAffiliationStatus: 'UNAFFILIATED' })
    )

    expect(item.status).toBe(CheckboxStatus.NotDone)
  })

  it('marks the school approval item done once a choice is recorded', () => {
    const item = schoolApprovalItemIn(
      checklistOf({ schoolAffiliationStatus: 'OPTED_OUT' })
    )

    expect(item.status).toBe(CheckboxStatus.Done)
  })

  it('ignores group action rows and in-flight checks for the school approval item', () => {
    const item = schoolApprovalItemIn(
      checklistOf({
        NTHSGroupActions: [{ actionId: SCHOOL_AFFILIATION.id }],
        checksInFlight: [SCHOOL_AFFILIATION.id],
      })
    )

    expect(item.status).toBe(CheckboxStatus.NotDone)
  })

  it('derives the other items from group actions and in-flight checks', () => {
    const checklist = checklistOf({
      NTHSGroupActions: [{ actionId: NAMED_YOUR_TEAM.id }],
      checksInFlight: [REVIEWED_RESOURCES.id],
    })

    expect(statusIn(checklist, NAMED_YOUR_TEAM.name)).toBe(CheckboxStatus.Done)
    expect(statusIn(checklist, REVIEWED_RESOURCES.name)).toBe(
      CheckboxStatus.Saving
    )
    expect(statusIn(checklist, RECRUITMENT_SPRINT.name)).toBe(
      CheckboxStatus.NotDone
    )
  })

  it('skips a tickable entry with no matching action row', () => {
    const checklist = checklistOf({
      NTHSActions: ALL_ACTIONS.filter(({ id }) => id !== RECRUITMENT_SPRINT.id),
    })

    expect(namesIn(checklist)).not.toContain(RECRUITMENT_SPRINT.name)
    expect(checklist).toHaveLength(ALL_ACTIONS.length - 1)
  })

  it('still asks for the decision when the school approval action row is missing', () => {
    const checklist = checklistOf({
      NTHSActions: ALL_ACTIONS.filter(({ id }) => id !== SCHOOL_AFFILIATION.id),
    })

    expect(checklist).toHaveLength(ALL_ACTIONS.length)
    expect(schoolApprovalItemIn(checklist).status).toBe(CheckboxStatus.NotDone)
  })

  it('returns an empty list once every item is done', () => {
    const checklist = checklistOf({
      NTHSGroupActions: [
        NAMED_YOUR_TEAM,
        REVIEWED_RESOURCES,
        ATTENDED_ORIENTATION,
        RECRUITMENT_SPRINT,
      ].map(({ id }) => ({ actionId: id })),
      schoolAffiliationStatus: 'OPTED_OUT',
    })

    expect(checklist).toEqual([])
  })

  it('keeps the checklist visible while only the school approval item is outstanding', () => {
    const checklist = checklistOf({
      NTHSGroupActions: [
        NAMED_YOUR_TEAM,
        REVIEWED_RESOURCES,
        ATTENDED_ORIENTATION,
        RECRUITMENT_SPRINT,
      ].map(({ id }) => ({ actionId: id })),
      schoolAffiliationStatus: 'UNAFFILIATED',
    })

    expect(checklist).toHaveLength(ALL_ACTIONS.length)
    expect(statusIn(checklist, SCHOOL_AFFILIATION.name)).toBe(
      CheckboxStatus.NotDone
    )
    expect(statusIn(checklist, NAMED_YOUR_TEAM.name)).toBe(CheckboxStatus.Done)
  })
})

describe('nths store setNTHSGroupSchoolAffiliationStatus', () => {
  const statusOfSchoolApprovalItem = (store: ReturnType<typeof getStore>) =>
    schoolApprovalItemIn(store.getters['nths/NTHSChecklist']).status

  it('ticks the school approval item off the committed status', () => {
    const store = getStore()
    expect(statusOfSchoolApprovalItem(store)).toBe(CheckboxStatus.NotDone)

    store.commit('nths/setNTHSGroupSchoolAffiliationStatus', {
      groupId: 'group-1',
      schoolAffiliationStatus: 'OPTED_OUT',
    })

    expect(statusOfSchoolApprovalItem(store)).toBe(CheckboxStatus.Done)
  })
})
