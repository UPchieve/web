import NetworkService from '@/services/NetworkService'
import { actionsCtaMap, CheckboxStatus } from '@/services/NTHSGroupService'

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
    isEligibleToApply(state, _, __, rootGetters) {
      return (
        rootGetters['users/isVolunteerInHighSchool'] &&
        state.NTHSGroups.length == 0
      )
    },
    NTHSChecklist: (state) => {
      const checklist = state.NTHSActions.reduce((list, action) => {
        const cta = actionsCtaMap[action.name]
        const status = state.checksInFlight.includes(action.id)
          ? CheckboxStatus.Saving
          : state.NTHSGroupActions.some(
                ({ actionId }) => actionId === action.id
              )
            ? CheckboxStatus.Done
            : CheckboxStatus.NotDone

        if (cta) {
          list.push({
            text: cta.text,
            url: cta.url,
            status,
            actionId: action.id,
            actionName: action.name,
          })
        }

        return list
      }, [])

      return checklist.every(({ status }) => status === CheckboxStatus.Done)
        ? []
        : checklist
    },
  },
}
