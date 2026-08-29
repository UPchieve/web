import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import {
  checklistControls,
  CheckboxStatus,
  hasChosenAffiliationPath,
  SCHOOL_AFFILIATION_ACTION,
  type AffiliationStatus,
  type ChecklistItem,
  type NTHSAction,
} from '@/services/NTHSGroupService'

export default {
  namespaced: true,
  state: {
    NTHSGroups: [],
    NTHSGroupMembers: {},
    NTHSGroupActions: [],
    NTHSActions: [],
    checksInFlight: [],
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
    setNTHSGroupActions: (state, data) => {
      state.NTHSGroupActions = data.groupActions
      state.NTHSActions = data.actions
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
    appendNTHSGroupAction: (state, action) => {
      state.NTHSGroupActions = [...state.NTHSGroupActions, action]
    },
    setChecksInFlight(state, checksInFlight) {
      state.checksInFlight = checksInFlight
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
    appendToChecksInFlight({ commit, state }, id) {
      commit('setChecksInFlight', state.checksInFlight.concat([id]))
    },
    removeFromChecksInFlight({ commit, state }, id) {
      commit(
        'setChecksInFlight',
        state.checksInFlight.filter((c) => c !== id)
      )
    },
    setNTHSCandidateApplicationStatus: (state, status) => {
      state.NTHSCandidateApplicationStatus = status
    },
    async fetchNthsData({ commit }) {
      const results = await NetworkService.getNTHSGroupsForUser()
      commit('setNTHSGroups', results.data.groups)
      commit(
        'setNTHSCandidateApplicationStatus',
        results.data.candidateApplicationStatus
      )

      const eligibility = await NetworkService.getNTHSApplicationEligibility()
      commit('setCanApplyForNTHSPresident', eligibility.data.eligible)
      commit(
        'setNTHSApplicationIneligibilityReasons',
        eligibility.data.reasons ?? []
      )
      return results.data.groups
    },
    // Occupation decides eligibility, so the sidebar and route guards go stale on
    // a profile save. Failure is swallowed because the profile itself saved.
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
    async fetchNTHSGroupActions({ commit }, groupId) {
      const response = await NetworkService.getActionsForNTHSGroup(groupId)
      const groupActions = response.data?.groupActions ?? []
      commit('setNTHSGroupActions', {
        groupId,
        groupActions,
        actions: response.data.actions,
      })
    },
    addNTHSGroupAction({ commit }, action) {
      commit('appendNTHSGroupAction', action)
    },
    removeNTHSGroupAction({ commit }, actionId) {
      commit('removeNTHSGroupAction', actionId)
    },
  },

  getters: {
    NTHSChecklist: (state) => {
      if (state.NTHSActions.length === 0) return []

      const affiliationStatus =
        state.NTHSGroups?.[0]?.schoolAffiliationStatus ?? null

      const checklist: ChecklistItem[] = []
      for (const { action: name, ...control } of checklistControls) {
        if (name === SCHOOL_AFFILIATION_ACTION) {
          checklist.push({
            ...control,
            locked: true,
            status: hasChosenAffiliationPath(affiliationStatus)
              ? CheckboxStatus.Done
              : CheckboxStatus.NotDone,
            actionName: name,
          })
          continue
        }

        const action = state.NTHSActions.find(
          (a: NTHSAction) => a.name === name
        )
        if (!action) continue

        let status: CheckboxStatus
        if (state.checksInFlight.includes(action.id)) {
          status = CheckboxStatus.Saving
        } else if (
          state.NTHSGroupActions.some(
            ({ actionId }: { actionId: number }) => actionId === action.id
          )
        ) {
          status = CheckboxStatus.Done
        } else {
          status = CheckboxStatus.NotDone
        }

        checklist.push({
          ...control,
          status,
          actionId: action.id,
          actionName: name,
        })
      }

      return checklist.every(({ status }) => status === CheckboxStatus.Done)
        ? []
        : checklist
    },
  },
}
