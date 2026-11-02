import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import {
  getNTHSApplicationDraft,
  setNTHSApplicationDraft,
} from '@/services/BrowserStorageService'
import {
  NTHS_APPLICATION_FORMS,
  type NTHSFormVersion,
} from '@/services/NTHSApplicationService'
import type { NTHSChecklistPublic } from '@upchieve/api-contracts/nths-checklist'
import type {
  NTHSRenewalPrompt,
  NTHSRenewalPublic,
} from '@/services/NTHSGroupService'

vi.mock('@/services/NetworkService')
vi.mock('@/services/AnalyticsService')

const nthsModule = (storeOptions.modules as any).nths

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
      const store = getStore()
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

  it('refreshNTHSGroups skips the eligibility fetch', async () => {
    vi.mocked(NetworkService.getNTHSGroupsForUser).mockResolvedValue({
      data: { groups: [] },
    } as never)
    vi.mocked(NetworkService.getNTHSApplicationEligibility).mockClear()

    await getStore().dispatch('nths/refreshNTHSGroups')

    expect(NetworkService.getNTHSApplicationEligibility).not.toHaveBeenCalled()
  })

  it('stores the approval deadline from the chapter list', async () => {
    const approvalExpiresAt = '2026-11-20T15:00:00.000Z'
    vi.mocked(NetworkService.getNTHSGroupsForUser).mockResolvedValue({
      data: {
        groups: [],
        candidateApplicationStatus: 'approved',
        approvalExpiresAt,
      },
    } as never)
    vi.mocked(NetworkService.getNTHSApplicationEligibility).mockResolvedValue({
      data: { eligible: false },
    } as never)
    const store = getStore()

    await store.dispatch('nths/fetchNthsData')

    expect(store.state.nths.approvalExpiresAt).toBe(approvalExpiresAt)
  })
})

const DYNAMIC_CHECKLIST: NTHSChecklistPublic = {
  sections: [
    {
      id: 1,
      title: 'Get started',
      order: 1,
      items: [
        {
          key: 'invite-members',
          order: 1,
          title: 'Invite members',
          resources: [],
          checkable: true,
          skippable: true,
          status: 'incomplete',
        },
      ],
    },
  ],
}

function getStore(checklist: NTHSChecklistPublic | null = null) {
  return createStore({
    modules: {
      ...storeOptions.modules,
      nths: {
        ...nthsModule,
        state: { ...nthsModule.state, NTHSChecklistData: checklist },
      },
    },
  })
}

describe('nths dynamic checklist state', () => {
  beforeEach(() => vi.mocked(AnalyticsService.captureEvent).mockClear())

  it('loads the checklist from the backend', async () => {
    vi.mocked(NetworkService.getNTHSChecklist).mockResolvedValue({
      checklist: DYNAMIC_CHECKLIST,
    })
    const store = getStore()

    await store.dispatch('nths/fetchNTHSChecklist', 'group-1')

    expect(store.state.nths.NTHSChecklistData).toEqual(DYNAMIC_CHECKLIST)
  })

  it('tracks a failed checklist load with its HTTP status', async () => {
    const failure = {
      isAxiosError: true,
      response: { status: 503 },
    }
    vi.mocked(NetworkService.getNTHSChecklist).mockRejectedValueOnce(failure)
    const store = getStore()

    await expect(
      store.dispatch('nths/fetchNTHSChecklist', 'group-1')
    ).rejects.toBe(failure)

    expect(AnalyticsService.captureEvent).toHaveBeenCalledWith(
      EVENTS.NTHS_CHECKLIST_LOAD_FAILED,
      { groupId: 'group-1', httpStatus: 503 }
    )
    expect(store.state.nths.NTHSChecklistData).toBeNull()
  })

  it.each(['complete', 'incomplete', 'skipped'] as const)(
    'persists %s and saves the backend response in Vuex',
    async (status) => {
      vi.mocked(
        NetworkService.updateNTHSChecklistItemProgress
      ).mockResolvedValue({ itemKey: 'invite-members', status })
      const store = getStore(structuredClone(DYNAMIC_CHECKLIST))

      await store.dispatch('nths/updateNTHSChecklistItemProgress', {
        groupId: 'group-1',
        itemKey: 'invite-members',
        status,
      })

      expect(
        NetworkService.updateNTHSChecklistItemProgress
      ).toHaveBeenLastCalledWith('group-1', 'invite-members', { status })
      expect(
        store.state.nths.NTHSChecklistData.sections[0].items[0].status
      ).toBe(status)
      expect(AnalyticsService.captureEvent).toHaveBeenCalledWith(
        EVENTS.NTHS_CHECKLIST_ITEM_UPDATED,
        {
          groupId: 'group-1',
          sectionId: 1,
          sectionTitle: 'Get started',
          sectionOrder: 1,
          itemKey: 'invite-members',
          itemTitle: 'Invite members',
          itemOrder: 1,
          previousStatus: 'incomplete',
          status,
        }
      )
    }
  )

  it('tracks a failed checklist update without recording progress', async () => {
    vi.mocked(
      NetworkService.updateNTHSChecklistItemProgress
    ).mockRejectedValueOnce(new Error('save failed'))
    const store = getStore(structuredClone(DYNAMIC_CHECKLIST))

    await expect(
      store.dispatch('nths/updateNTHSChecklistItemProgress', {
        groupId: 'group-1',
        itemKey: 'invite-members',
        status: 'complete',
      })
    ).rejects.toThrow('save failed')

    expect(AnalyticsService.captureEvent).toHaveBeenCalledWith(
      EVENTS.NTHS_CHECKLIST_ITEM_UPDATE_FAILED,
      {
        groupId: 'group-1',
        sectionId: 1,
        sectionTitle: 'Get started',
        sectionOrder: 1,
        itemKey: 'invite-members',
        itemTitle: 'Invite members',
        itemOrder: 1,
        previousStatus: 'incomplete',
        attemptedStatus: 'complete',
      }
    )
    expect(AnalyticsService.captureEvent).not.toHaveBeenCalledWith(
      EVENTS.NTHS_CHECKLIST_ITEM_UPDATED,
      expect.anything()
    )
  })
})

describe('nths renewal state', () => {
  const RENEWAL = {
    prompt: 'name-successor-banner',
    closesOn: '2027-09-30',
    successorConfirmationOn: '2027-08-01',
    namingClosesOn: '2027-09-14',
    commitmentsRequired: true,
    canNameSelf: true,
    namingSelfAccepts: false,
  } satisfies NTHSRenewalPublic

  const groupsOf = (store: ReturnType<typeof getStore>) =>
    (store.state as { nths: { NTHSGroups: { renewal: NTHSRenewalPublic }[] } })
      .nths.NTHSGroups

  function storeWithGroups(prompts: NTHSRenewalPrompt[]) {
    const store = getStore()
    store.commit(
      'nths/setNTHSGroups',
      prompts.map((prompt, i) => ({
        groupInfo: { id: `group-${i}` },
        renewal: { ...RENEWAL, prompt },
      }))
    )
    return store
  }

  it.each<{ prompts: NTHSRenewalPrompt[]; needsAttention: boolean }>([
    { prompts: ['name-successor-reminder'], needsAttention: true },
    { prompts: ['name-successor-reminder', 'none'], needsAttention: true },
    { prompts: ['none', 'name-successor-reminder'], needsAttention: false },
    { prompts: ['name-successor-banner'], needsAttention: false },
    { prompts: ['successors-named'], needsAttention: false },
    { prompts: [], needsAttention: false },
  ])(
    'needs attention for prompts $prompts: $needsAttention',
    ({ prompts, needsAttention }) => {
      expect(
        storeWithGroups(prompts).getters['nths/renewalNeedsAttention']
      ).toBe(needsAttention)
    }
  )

  it("patches only the written group's renewal from a successors save", async () => {
    const store = storeWithGroups(['name-successor-reminder', 'none'])
    const saved: NTHSRenewalPublic = { ...RENEWAL, prompt: 'successors-named' }
    vi.mocked(NetworkService.setNTHSRenewalSuccessors).mockResolvedValue({
      renewal: saved,
    })
    const update = { userIds: ['u-1'], expectedUserIds: [] }

    await store.dispatch('nths/saveNTHSRenewalSuccessors', {
      groupId: 'group-0',
      update,
    })

    expect(NetworkService.setNTHSRenewalSuccessors).toHaveBeenCalledWith(
      'group-0',
      update
    )
    expect(groupsOf(store).map((g) => g.renewal.prompt)).toEqual([
      'successors-named',
      'none',
    ])
  })
})
