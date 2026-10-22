import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import axios from 'axios'
import { clearNTHSApplicationDraft } from '@/services/BrowserStorageService'
import {
  nthsDestination,
  type NTHSDestinationSource,
} from '@/views/NTHS/nths-route-helpers'
import type { AffiliationStatus } from '@/services/NTHSGroupService'
import type {
  NTHSChecklistItemStatus,
  NTHSChecklistPublic,
  UpdateNTHSChecklistItemProgressResponse,
} from '@upchieve/api-contracts/nths-checklist'

// Views like NTHSCreateGroupView commit NTHS state without going through
// fetchNthsData, so the attribute can lag by a page load. Gleap sends each
// outbound message once, so the nudge still retires on time.
function syncNTHSStatusToGleap(
  rootState: NTHSDestinationSource['state'] & {
    user?: { user?: { id?: string } }
  },
  rootGetters: NTHSDestinationSource['getters']
) {
  const destination = nthsDestination({
    state: rootState,
    getters: rootGetters,
  })
  // every signed-in user runs this, not just coaches
  if (!destination) return

  const userId = rootState.user?.user?.id
  if (!userId) return
  AnalyticsService.setContactCustomData(userId, { nthsStatus: destination })
}

export default {
  namespaced: true,
  state: {
    NTHSGroups: [],
    NTHSGroupMembers: {},
    NTHSChecklistData: null as NTHSChecklistPublic | null,
    NTHSCandidateApplicationStatus: undefined,
    approvalExpiresAt: null as string | null,
    canApplyForNTHSPresident: false,
    NTHSApplicationIneligibilityReasons: [],
  },
  mutations: {
    setNTHSGroups: (state, groups) => {
      state.NTHSGroups = groups
    },
    setNTHSGroupMembers: (state, data) => {
      state.NTHSGroupMembers[data.groupId] = data.groupMembers
    },
    setNTHSChecklist: (state, checklist: NTHSChecklistPublic) => {
      state.NTHSChecklistData = checklist
    },
    setNTHSChecklistItemProgress: (
      state,
      { itemKey, status }: UpdateNTHSChecklistItemProgressResponse
    ) => {
      const item = state.NTHSChecklistData?.sections
        .flatMap((section) => section.items)
        .find((item) => item.key === itemKey)
      if (item) item.status = status
    },
    setNTHSGroupName: (state, { groupId, groupName }) => {
      const group = state.NTHSGroups.find((g) => g.groupInfo.id === groupId)
      if (group) {
        const updatedGroupInfo = {
          ...group.groupInfo,
          name: groupName,
        }
        const updatedGroup = { ...group, groupInfo: { ...updatedGroupInfo } }
        state.NTHSGroups = [updatedGroup]
      }
    },
    setNTHSGroupSchoolAffiliationStatus: (
      state,
      {
        groupId,
        schoolAffiliationStatus,
      }: { groupId: string; schoolAffiliationStatus: AffiliationStatus }
    ) => {
      const group = state.NTHSGroups.find((g) => g.groupInfo.id === groupId)
      if (group) group.schoolAffiliationStatus = schoolAffiliationStatus
    },
    setNTHSCandidateApplicationStatus: (state, status) => {
      state.NTHSCandidateApplicationStatus = status
    },
    setApprovalExpiresAt(state, expiresAt: string | null) {
      state.approvalExpiresAt = expiresAt
    },
    setCanApplyForNTHSPresident(state, isEligible) {
      state.canApplyForNTHSPresident = isEligible
    },
    setNTHSApplicationIneligibilityReasons(state, reasons) {
      state.NTHSApplicationIneligibilityReasons = reasons
    },
  },
  actions: {
    async fetchNthsData({ commit, rootState, rootGetters }) {
      const results = await NetworkService.getNTHSGroupsForUser()
      commit('setNTHSGroups', results.data.groups)
      commit(
        'setNTHSCandidateApplicationStatus',
        results.data.candidateApplicationStatus
      )
      commit('setApprovalExpiresAt', results.data.approvalExpiresAt ?? null)
      if (results.data.candidateApplicationStatus)
        clearNTHSApplicationDraft(rootState.user?.user?.id)

      const eligibility = await NetworkService.getNTHSApplicationEligibility()
      commit('setCanApplyForNTHSPresident', eligibility.data.eligible)
      commit(
        'setNTHSApplicationIneligibilityReasons',
        eligibility.data.reasons ?? []
      )

      syncNTHSStatusToGleap(rootState, rootGetters)
      return results.data.groups
    },
    async fetchNTHSGroupMembers({ commit }, groupId) {
      const response = await NetworkService.getNTHSGroupMembers(groupId)
      const groupMembers = response.data?.members ?? []
      commit('setNTHSGroupMembers', { groupId, groupMembers })
    },
    async fetchNTHSChecklist({ commit }, groupId: string) {
      let checklist: NTHSChecklistPublic
      try {
        const response = await NetworkService.getNTHSChecklist(groupId)
        checklist = response.checklist
      } catch (error) {
        AnalyticsService.captureEvent(EVENTS.NTHS_CHECKLIST_LOAD_FAILED, {
          groupId,
          httpStatus: axios.isAxiosError(error)
            ? error.response?.status
            : undefined,
        })
        throw error
      }
      commit('setNTHSChecklist', checklist)
      return checklist
    },
    async updateNTHSChecklistItemProgress(
      { commit, state },
      {
        groupId,
        itemKey,
        status,
      }: {
        groupId: string
        itemKey: string
        status: NTHSChecklistItemStatus
      }
    ) {
      const checklist = state.NTHSChecklistData as NTHSChecklistPublic | null
      const section = checklist?.sections.find(({ items }) =>
        items.some(({ key }) => key === itemKey)
      )
      const item = section?.items.find(({ key }) => key === itemKey)
      const previousStatus = item?.status
      const eventProperties = {
        groupId,
        sectionId: section?.id,
        sectionTitle: section?.title,
        sectionOrder: section?.order,
        itemKey,
        itemTitle: item?.title,
        itemOrder: item?.order,
        previousStatus,
      }
      let progress: UpdateNTHSChecklistItemProgressResponse
      try {
        progress = await NetworkService.updateNTHSChecklistItemProgress(
          groupId,
          itemKey,
          { status }
        )
      } catch (error) {
        AnalyticsService.captureEvent(
          EVENTS.NTHS_CHECKLIST_ITEM_UPDATE_FAILED,
          { ...eventProperties, attemptedStatus: status }
        )
        throw error
      }
      commit('setNTHSChecklistItemProgress', progress)
      AnalyticsService.captureEvent(EVENTS.NTHS_CHECKLIST_ITEM_UPDATED, {
        ...eventProperties,
        status: progress.status,
      })
      return progress
    },
  },

  getters: {
    memberRole: (state) =>
      state.NTHSGroups.length ? state.NTHSGroups[0].memberInfo?.roleName : null,
    hasAdminRole: (state, getters) => getters.memberRole === 'admin',
    isGroupMemberOnly: (state, getters) =>
      !getters.hasAdminRole && state.NTHSGroups.length > 0,
  },
}
