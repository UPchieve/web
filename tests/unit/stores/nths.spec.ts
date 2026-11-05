import { beforeEach, describe, expect, it, vi } from 'vitest'
import vuexStore from '@/store'
import { useNthsStore } from '@/stores/nths'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import {
  getNTHSApplicationDraft,
  setNTHSApplicationDraft,
} from '@/services/BrowserStorageService'
import type { NTHSChecklistPublic } from '@upchieve/api-contracts/nths-checklist'

vi.mock('@/services/NetworkService')
vi.mock('@/services/AnalyticsService')

describe('fetchNthsData', () => {
  const USER_ID = 'coach-1'

  beforeEach(() => {
    localStorage.clear()
    vuexStore.commit('user/setUser', {})
  })

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
      vuexStore.commit('user/setUser', { id: USER_ID })
      setNTHSApplicationDraft(USER_ID, {
        schoolId: 'school-1',
        schoolName: 'Riverside High',
        cannotFindSchool: false,
        unlistedSchool: {
          name: '',
          city: '',
          country: '',
          state: '',
          region: '',
          website: '',
        },
        gradeLevel: '10th grade',
        responses: {},
      })

      await store.fetchNthsData()

      expect(getNTHSApplicationDraft(USER_ID) !== undefined).toBe(keepsDraft)
    }
  )

  function mockGroups(groups: unknown[]) {
    vi.mocked(NetworkService.getNTHSGroupsForUser).mockResolvedValue({
      data: { groups },
    } as never)
    vi.mocked(NetworkService.getNTHSApplicationEligibility).mockResolvedValue({
      data: { eligible: false },
    } as never)
    vi.mocked(AnalyticsService.setContactCustomData).mockClear()
  }

  it('sends no NTHS status to Gleap without a signed-in user', async () => {
    mockGroups([{ memberInfo: { roleName: 'admin', title: 'President' } }])

    await getStore().fetchNthsData()

    expect(AnalyticsService.setContactCustomData).not.toHaveBeenCalled()
  })

  it.each([
    {
      who: 'a plain member',
      memberInfo: { roleName: 'member', title: 'Member' },
      isNthsAdmin: false,
      isNthsPresident: false,
    },
    {
      who: 'an admin who is not President',
      memberInfo: { roleName: 'admin', title: 'Vice President' },
      isNthsAdmin: true,
      isNthsPresident: false,
    },
    {
      who: 'a President admin',
      memberInfo: { roleName: 'admin', title: 'President' },
      isNthsAdmin: true,
      isNthsPresident: true,
    },
  ])(
    'sends the NTHS status of $who to Gleap',
    async ({ memberInfo, isNthsAdmin, isNthsPresident }) => {
      mockGroups([{ memberInfo }])
      vuexStore.commit('user/setUser', { id: USER_ID })

      await getStore().fetchNthsData()

      expect(AnalyticsService.setContactCustomData).toHaveBeenCalledWith(
        USER_ID,
        {
          nthsStatus: 'group',
          isNthsMember: true,
          isNthsAdmin,
          isNthsPresident,
        }
      )
    }
  )

  it('refreshNTHSGroups skips the eligibility fetch', async () => {
    vi.mocked(NetworkService.getNTHSGroupsForUser).mockResolvedValue({
      data: { groups: [] },
    } as never)
    vi.mocked(NetworkService.getNTHSApplicationEligibility).mockClear()

    await getStore().refreshNTHSGroups()

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

    await store.fetchNthsData()

    expect(store.approvalExpiresAt).toBe(approvalExpiresAt)
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
  const nths = useNthsStore()
  nths.NTHSChecklistData = checklist
  return nths
}

describe('nths dynamic checklist state', () => {
  beforeEach(() => vi.mocked(AnalyticsService.captureEvent).mockClear())

  it('loads the checklist from the backend', async () => {
    vi.mocked(NetworkService.getNTHSChecklist).mockResolvedValue({
      checklist: DYNAMIC_CHECKLIST,
    })
    const store = getStore()

    await store.fetchNTHSChecklist('group-1')

    expect(store.NTHSChecklistData).toEqual(DYNAMIC_CHECKLIST)
  })

  it('tracks a failed checklist load with its HTTP status', async () => {
    const failure = {
      isAxiosError: true,
      response: { status: 503 },
    }
    vi.mocked(NetworkService.getNTHSChecklist).mockRejectedValueOnce(failure)
    const store = getStore()

    await expect(store.fetchNTHSChecklist('group-1')).rejects.toBe(failure)

    expect(AnalyticsService.captureEvent).toHaveBeenCalledWith(
      EVENTS.NTHS_CHECKLIST_LOAD_FAILED,
      { groupId: 'group-1', httpStatus: 503 }
    )
    expect(store.NTHSChecklistData).toBeNull()
  })

  it.each(['complete', 'incomplete', 'skipped'] as const)(
    'persists %s and saves the backend response in the store',
    async (status) => {
      vi.mocked(
        NetworkService.updateNTHSChecklistItemProgress
      ).mockResolvedValue({ itemKey: 'invite-members', status })
      const store = getStore(structuredClone(DYNAMIC_CHECKLIST))

      await store.updateNTHSChecklistItemProgress({
        groupId: 'group-1',
        itemKey: 'invite-members',
        status,
      })

      expect(
        NetworkService.updateNTHSChecklistItemProgress
      ).toHaveBeenLastCalledWith('group-1', 'invite-members', { status })
      expect(store.NTHSChecklistData!.sections[0].items[0].status).toBe(status)
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
      store.updateNTHSChecklistItemProgress({
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
