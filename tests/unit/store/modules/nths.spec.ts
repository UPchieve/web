import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import {
  getNTHSApplicationDraft,
  setNTHSApplicationDraft,
} from '@/services/BrowserStorageService'
import {
  NTHS_APPLICATION_FORMS,
  type NTHSFormVersion,
} from '@/services/NTHSApplicationService'
import { CheckboxStatus, type ChecklistItem } from '@/services/NTHSGroupService'

vi.mock('../../../../src/services/NetworkService')
vi.mock('@/services/LoggerService', () => ({
  default: { noticeError: vi.fn() },
}))
vi.mock('@/services/AnalyticsService')

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

describe('nths/fetchNthsData', () => {
  const USER_ID = 'coach-1'
  const [FORM_VERSION] = Object.keys(NTHS_APPLICATION_FORMS).map(
    Number
  ) as NTHSFormVersion[]

  beforeEach(() => localStorage.clear())

  it.each([
    { candidateApplicationStatus: 'applied', keepsDraft: false },
    { candidateApplicationStatus: undefined, keepsDraft: true },
  ])(
    'with application status $candidateApplicationStatus keeps the draft: $keepsDraft',
    async ({ candidateApplicationStatus, keepsDraft }) => {
      vi.mocked(NetworkService.getNTHSGroupsForUser).mockResolvedValue({
        data: { groups: [], candidateApplicationStatus },
      } as never)
      vi.mocked(NetworkService.getNTHSApplicationEligibility).mockResolvedValue(
        { data: { eligible: false } } as never
      )
      const store = getStore({ NTHSGroups: [] })
      store.commit('user/setUser', { id: USER_ID })
      setNTHSApplicationDraft(USER_ID, {
        formVersion: FORM_VERSION,
        schoolId: 'school-1',
        schoolName: 'Riverside High',
        cannotFindSchool: false,
        unlistedSchool: { name: '', city: '', state: '', website: '' },
        gradeLevel: '10th grade',
        responses: {},
      })

      await store.dispatch('nths/fetchNthsData')

      expect(getNTHSApplicationDraft(USER_ID) !== undefined).toBe(keepsDraft)
    }
  )
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
    NTHSGroups?: object[]
  } = {}
) => {
  const {
    NTHSActions = ALL_ACTIONS,
    NTHSGroupActions = [],
    checksInFlight = [],
    schoolAffiliationStatus = null,
    NTHSGroups = [{ groupInfo: { id: 'group-1' }, schoolAffiliationStatus }],
  } = state

  return createStore({
    modules: {
      ...storeOptions.modules,
      nths: {
        ...storeOptions.modules.nths,
        state: {
          ...storeOptions.modules.nths.state,
          NTHSGroups,
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

  it('routes the school approval item to Chapter setup instead of an external url', () => {
    const item = schoolApprovalItemIn(checklistOf())

    expect(item.routeTo).toBe('/groups/setup')
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

  it.each(['UNAFFILIATED' as const, 'DENIED' as const])(
    'leaves the school approval item not done while the chapter is %s',
    (schoolAffiliationStatus) => {
      const item = schoolApprovalItemIn(
        checklistOf({ schoolAffiliationStatus })
      )

      expect(item.status).toBe(CheckboxStatus.NotDone)
    }
  )

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

  // The checklist has its own nav tab, so a finished chapter still sees every
  // row there, ticked.
  it('keeps every item once they are all done', () => {
    const checklist = checklistOf({
      NTHSGroupActions: [
        NAMED_YOUR_TEAM,
        REVIEWED_RESOURCES,
        ATTENDED_ORIENTATION,
        RECRUITMENT_SPRINT,
      ].map(({ id }) => ({ actionId: id })),
      schoolAffiliationStatus: 'OPTED_OUT',
    })

    expect(namesIn(checklist)).toHaveLength(ALL_ACTIONS.length)
    expect(
      checklist.every(({ status }) => status === CheckboxStatus.Done)
    ).toBe(true)
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

describe('nths store isGroupMemberOnly getter', () => {
  it.each([
    { roleName: 'admin', expected: false },
    { roleName: 'member', expected: true },
  ])('is $expected for a group $roleName', ({ roleName, expected }) => {
    const store = getStore({ NTHSGroups: [{ memberInfo: { roleName } }] })
    expect(store.getters['nths/isGroupMemberOnly']).toBe(expected)
  })
})

describe('nths store removeNTHSGroupAction', () => {
  it('removes every group action entry for the given action id', () => {
    const store = getStore({
      NTHSGroupActions: [
        { actionId: NAMED_YOUR_TEAM.id },
        { actionId: NAMED_YOUR_TEAM.id },
        { actionId: REVIEWED_RESOURCES.id },
      ],
    })

    store.dispatch('nths/removeNTHSGroupAction', NAMED_YOUR_TEAM.id)

    const checklist = store.getters['nths/NTHSChecklist']
    expect(statusIn(checklist, NAMED_YOUR_TEAM.name)).toBe(
      CheckboxStatus.NotDone
    )
    expect(statusIn(checklist, REVIEWED_RESOURCES.name)).toBe(
      CheckboxStatus.Done
    )
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
