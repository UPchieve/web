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
import type { NTHSChecklistPublic } from '@upchieve/api-contracts/nths-checklist'

vi.mock('@/services/NetworkService')
vi.mock('@/services/LoggerService', () => ({
  default: { noticeError: vi.fn() },
}))
vi.mock('@/services/AnalyticsService')

const nthsModule = (storeOptions.modules as any).nths
const refreshAfterProfileChange = nthsModule.actions.refreshAfterProfileChange

describe('nths/refreshAfterProfileChange', () => {
  beforeEach(() => vi.mocked(LoggerService.noticeError).mockClear())

  it('refetches so the sidebar and route guards see the new eligibility', async () => {
    const dispatch = vi.fn().mockResolvedValue([])
    await refreshAfterProfileChange({ dispatch })
    expect(dispatch).toHaveBeenCalledWith('fetchNthsData')
  })

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
  it('loads the checklist from the backend', async () => {
    vi.mocked(NetworkService.getNTHSChecklist).mockResolvedValue({
      checklist: DYNAMIC_CHECKLIST,
    })
    const store = getStore()

    await store.dispatch('nths/fetchNTHSChecklist', 'group-1')

    expect(store.state.nths.NTHSChecklistData).toEqual(DYNAMIC_CHECKLIST)
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
    }
  )
})
