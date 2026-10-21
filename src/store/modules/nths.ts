import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import AnalyticsService from '@/services/AnalyticsService'
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
    setCanApplyForNTHSPresident(state, isEligible) {
      state.canApplyForNTHSPresident = isEligible
    },
    setNTHSApplicationIneligibilityReasons(state, reasons) {
      state.NTHSApplicationIneligibilityReasons = reasons
    },
  },
  actions: {
    setNTHSCandidateApplicationStatus: (state, status) => {
      state.NTHSCandidateApplicationStatus = status
    },
    async fetchNthsData({ commit, rootState, rootGetters }) {
      const results = await NetworkService.getNTHSGroupsForUser()
      commit('setNTHSGroups', results.data.groups)
      commit(
        'setNTHSCandidateApplicationStatus',
        results.data.candidateApplicationStatus
      )
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
    // A profile save can remove the coach from their chapters, so the sidebar and
    // route guards go stale. Failure is swallowed because the profile itself saved.
    async refreshAfterProfileChange({ dispatch }) {
      try {
        await dispatch('fetchNthsData')
      } catch (err) {
        LoggerService.noticeError(
          err,
          'Could not refresh NTHS data after a profile change'
        )
      }
    },
    async fetchNTHSGroupMembers({ commit }, groupId) {
      const response = await NetworkService.getNTHSGroupMembers(groupId)
      const groupMembers = response.data?.members ?? []
      commit('setNTHSGroupMembers', { groupId, groupMembers })
    },
    async fetchNTHSChecklist({ commit }, groupId: string) {
      const { checklist } = await NetworkService.getNTHSChecklist(groupId)
      commit('setNTHSChecklist', checklist)
      return checklist
    },
    async updateNTHSChecklistItemProgress(
      { commit },
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
      const progress = await NetworkService.updateNTHSChecklistItemProgress(
        groupId,
        itemKey,
        { status }
      )
      commit('setNTHSChecklistItemProgress', progress)
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
