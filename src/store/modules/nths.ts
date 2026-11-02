import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import axios from 'axios'
import { clearNTHSApplicationDraft } from '@/services/BrowserStorageService'
import {
  nthsDestination,
  type NTHSDestinationSource,
} from '@/views/NTHS/nths-route-helpers'
import type {
  AffiliationStatus,
  NTHSRenewalCommitments,
  NTHSRenewalPrompt,
  NTHSRenewalPublic,
  NTHSRenewalSuccessorPublic,
  NTHSRenewalSuccessorsUpdate,
} from '@/services/NTHSGroupService'
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
  const userId = rootState.user?.user?.id
  if (!userId) return

  const groups = rootState.nths.NTHSGroups ?? []
  const customData = {
    ...(destination ? { nthsStatus: destination } : {}),
    isNthsMember: groups.length > 0,
    isNthsAdmin: groups.some((group) => group.memberInfo.roleName === 'admin'),
    isNthsPresident: groups.some(
      (group) => group.memberInfo.title === 'President'
    ),
  }
  // every signed-in user runs this, not just coaches
  AnalyticsService.setContactCustomData(userId, customData)
}

const RENEWAL_ATTENTION_PROMPTS: NTHSRenewalPrompt[] = [
  'name-successor-reminder',
  'successor-must-answer',
  'member-must-answer',
]

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
    NTHSRenewalSuccessors: {} as Record<string, NTHSRenewalSuccessorPublic[]>,
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
    setNTHSGroupRenewal: (
      state,
      { groupId, renewal }: { groupId: string; renewal: NTHSRenewalPublic }
    ) => {
      const group = state.NTHSGroups.find((g) => g.groupInfo.id === groupId)
      if (group) {
        group.renewal = renewal
      }
    },
    setNTHSRenewalSuccessors: (
      state,
      {
        groupId,
        successors,
      }: { groupId: string; successors: NTHSRenewalSuccessorPublic[] }
    ) => {
      state.NTHSRenewalSuccessors[groupId] = successors
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
    async refreshNTHSGroups({ commit, rootState }) {
      const results = await NetworkService.getNTHSGroupsForUser()
      commit('setNTHSGroups', results.data.groups)
      commit(
        'setNTHSCandidateApplicationStatus',
        results.data.candidateApplicationStatus
      )
      commit('setApprovalExpiresAt', results.data.approvalExpiresAt ?? null)
      if (results.data.candidateApplicationStatus)
        clearNTHSApplicationDraft(rootState.user?.user?.id)
      return results.data.groups
    },
    async fetchNthsData({ commit, dispatch, rootState, rootGetters }) {
      const groups = await dispatch('refreshNTHSGroups')

      const eligibility = await NetworkService.getNTHSApplicationEligibility()
      commit('setCanApplyForNTHSPresident', eligibility.data.eligible)
      commit(
        'setNTHSApplicationIneligibilityReasons',
        eligibility.data.reasons ?? []
      )

      syncNTHSStatusToGleap(rootState, rootGetters)
      return groups
    },
    async fetchNTHSGroupMembers({ commit }, groupId) {
      const response = await NetworkService.getNTHSGroupMembers(groupId)
      const groupMembers = response.data?.members ?? []
      commit('setNTHSGroupMembers', { groupId, groupMembers })
    },
    async fetchNTHSRenewalSuccessors({ commit }, groupId: string) {
      const response = await NetworkService.getNTHSRenewalSuccessors(groupId)
      commit('setNTHSRenewalSuccessors', {
        groupId,
        successors: response.successors,
      })
      return response
    },
    async saveNTHSRenewalSuccessors(
      { commit },
      {
        groupId,
        update,
      }: { groupId: string; update: NTHSRenewalSuccessorsUpdate }
    ) {
      const { renewal } = await NetworkService.setNTHSRenewalSuccessors(
        groupId,
        update
      )
      commit('setNTHSGroupRenewal', { groupId, renewal })
    },
    async nameSelfAsNTHSRenewalSuccessor(
      { commit },
      {
        groupId,
        commitments,
      }: { groupId: string; commitments?: NTHSRenewalCommitments }
    ) {
      const { renewal } = await NetworkService.nameSelfAsNTHSRenewalSuccessor(
        groupId,
        { commitments }
      )
      commit('setNTHSGroupRenewal', { groupId, renewal })
    },
    async acceptNTHSRenewalPresidency(
      { commit },
      {
        groupId,
        commitments,
      }: { groupId: string; commitments?: NTHSRenewalCommitments }
    ) {
      const { renewal, outcome } =
        await NetworkService.acceptNTHSRenewalPresidency(groupId, {
          commitments,
        })
      commit('setNTHSGroupRenewal', { groupId, renewal })
      return outcome
    },
    async declineNTHSRenewalPresidency({ commit }, groupId: string) {
      const { renewal } =
        await NetworkService.declineNTHSRenewalPresidency(groupId)
      commit('setNTHSGroupRenewal', { groupId, renewal })
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
    renewalPrompt: (state) => state.NTHSGroups[0]?.renewal?.prompt,
    renewalNeedsAttention: (state) => {
      const prompt = state.NTHSGroups[0]?.renewal?.prompt
      return !!prompt && RENEWAL_ATTENTION_PROMPTS.includes(prompt)
    },
  },
}
