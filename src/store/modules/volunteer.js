import sendWebNotification from '@/utils/send-web-notification'
import StudentIcon from '@/assets/user_avatars/student-icon.svg'
import Case from 'case'
import * as AmericaCountsVolunteerService from '@/services/AmericaCountsVolunteerService'
import * as PresenceService from '@/services/PresenceService'
import NetworkService from '@/services/NetworkService'
import { actionsCtaMap, CheckboxStatus } from '@/services/NTHSGroupService'

export default {
  namespaced: true,
  state: {
    newWaitingStudentAudioElement: null,
    allOpenSessions: [],
    tickIntervalId: null,
    ticks: 0,
    NTHSGroups: [],
    NTHSGroupMembers: {},
    NTHSGroupActions: [],
    NTHSActions: [],
    checksInFlight: [],
  },
  mutations: {
    setNewWaitingStudentAudioElement: (state, element) =>
      (state.newWaitingStudentAudioElement = element),
    setAllOpenSessions: (state, allOpenSessions) =>
      (state.allOpenSessions = allOpenSessions),
    setTickIntervalId: (state, tickIntervalId) =>
      (state.tickIntervalId = tickIntervalId),
    incTicks: (state) => (state.ticks = state.ticks + 1),
    resetTicks: (state) => (state.ticks = 0),
    removeSession: (state, sessionId) => {
      const indexOfSession = state.allOpenSessions.findIndex(
        (session) => session.id === sessionId
      )
      if (indexOfSession >= 0) {
        state.allOpenSessions.splice(indexOfSession, 1)
      }
    },
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
      const group = state.NTHSGroups.find((g) => g.groupId === groupId)
      if (group) {
        const updatedGroup = { ...group, groupName }
        state.NTHSGroups = [updatedGroup]
      }
    },
    appendNTHSGroupAction: (state, action) => {
      state.NTHSGroupActions = [...state.NTHSGroupActions, action]
    },
    setChecksInFlight(state, checksInFlight) {
      state.checksInFlight = checksInFlight
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
    async fetchNTHSGroupsForUser({ commit }) {
      const results = await NetworkService.getNTHSGroupsForUser()
      commit('setNTHSGroups', results.data.groups)
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

    gotoSession({ dispatch }, { context, session }) {
      const { type, subTopic, id } = session
      const path = `/session/${Case.kebab(type)}/${Case.kebab(subTopic)}/${id}`
      if (type && subTopic && id) {
        context.$router.push(path)
      } else {
        dispatch('user/clearSession')
      }
    },

    alertVolunteer(
      { state, dispatch, rootGetters, getters },
      { context, session }
    ) {
      try {
        const isUnlockedSession = this.state.user.user.subjects.includes(
          session.subTopic
        )
        if (isUnlockedSession) {
          state.newWaitingStudentAudioElement.play()
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Unable to play audio', error)
      }

      sendWebNotification(
        `${session.student?.firstname ?? 'A student'} needs help`,
        {
          body: `Can you help them with ${session.subjectDisplayName}?`,
        }
      )
      const isMobile = rootGetters['app/mobileMode']
      const isDashboard =
        context.$router.currentRoute.value.path === '/dashboard'
      if (isDashboard && isMobile) {
        return
      }
      const notifications = this.state.notifications.notifications
      const rollupShowing =
        notifications.findIndex(({ id }) => id === 'rollup-alert') > -1
      if (
        (!isMobile && getters.unlockedOpenSessions.length > 4) ||
        (isMobile && getters.unlockedOpenSessions.length > 3)
      ) {
        if (rollupShowing) {
          this.dispatch('notifications/updateTitle', {
            notificationId: 'rollup-alert',
            title: `There are ${getters.unlockedOpenSessions.length} students that need help`,
          })
        } else {
          this.dispatch('notifications/clear')
          this.dispatch('notifications/add', {
            id: 'rollup-alert',
            icon: StudentIcon,
            title: `There are ${getters.unlockedOpenSessions.length} students that need help`,
            cta: {
              text: 'Go to dashboard',
              action: () => context.$router.push('/'),
            },
            type: 'secondary',
            duration: 1000 * 60 * 2,
          })
        }
      } else {
        this.dispatch('notifications/add', {
          id: session.id,
          icon: StudentIcon,
          title: `${session.student?.firstname ?? 'A student'} needs help with ${session.subjectDisplayName}`,
          cta: {
            text: 'Join session',
            action: () => dispatch('gotoSession', { context, session }),
          },
          type: 'secondary',
          duration: 1000 * 60 * 2,
        })
        this.dispatch('notifications/remove', 'rollup-alert')
      }
    },

    /*
     * Update the `tick` state at a specified interval.
     * This can be used for things like:
     *  - rendering a dynamic wait time for specific students
     *  - dispatching an audio or visual alert at specified times
     */
    tickInterval({ commit, state }, wait = 1000) {
      commit(
        'setTickIntervalId',
        setInterval(() => {
          if (state.allOpenSessions.length === 0) {
            clearInterval(state.tickIntervalId)
            commit('setTickIntervalId', null)
            commit('resetTicks', null)
          } else {
            commit('incTicks', null)
          }
        }, wait)
      )
    },

    setSessionToExpire({ commit }, sessionId) {
      const ONE_MINUTE_IN_MS = 1000 * 60
      setTimeout(() => {
        commit('removeSession', sessionId)
      }, ONE_MINUTE_IN_MS)
    },

    async handleIncomingSessions(
      { commit, dispatch, state },
      { context, sessions }
    ) {
      const user = this.state.user.user

      const cantJoinSessions =
        !sessions ||
        !Array.isArray(sessions) ||
        !this.getters['volunteer/isReadyToTutor']
      if (cantJoinSessions) {
        commit('setAllOpenSessions', [])
        return
      }

      // Trigger tick dispatch at interval if there is no timer running
      if (sessions.length > 0 && !state.tickIntervalId) {
        dispatch('tickInterval', 1000)
      }

      const results = []
      const socketSessions = sessions.filter((session) => !session.volunteer)
      for (const session of socketSessions) {
        const { subTopic } = session

        const isAdminOrTestUser = user.isAdmin || user.isTestUser
        // Show test accounts to admin and test volunteer accounts
        if (
          (session.student.isTestUser && !isAdminOrTestUser) ||
          (session.student.isShadowBanned && !user.isAdmin)
        ) {
          continue
        }

        if (this.getters['americaCountsVolunteer/isAmericaCountsVolunteer']) {
          if (
            AmericaCountsVolunteerService.isEligibleSession({
              volunteer: user,
              session,
            })
          ) {
            results.push(session)
          }
          /*
           * when we're in this if block, we always want to continue
           * as America Counts volunteers should only ever get middle
           * school math sessions
           */
          continue
        }

        if (!user.mutedSubjectAlerts.includes(subTopic)) {
          results.push(session)
        }
      }

      const prevOpenSessions = state.allOpenSessions
      /*
       * Remove any existing notifications of sessions that were picked up or canceled.
       * If showing locked sessions is enabled, set a 1-minute timeout before removing
       * this session from the list.
       */
      const removedSessions = prevOpenSessions.filter(
        (session) => !results.some((s) => s.id === session.id)
      )
      for (const removedSession of removedSessions) {
        this.dispatch('notifications/remove', removedSession.id)
        const isLockedSession = !user.subjects.includes(removedSession.subTopic)
        if (isLockedSession) {
          dispatch('setSessionToExpire', removedSession.id)
          results.push(removedSession) // Add session back to the list for now
        }
      }
      commit('setAllOpenSessions', results)

      // Look for the new session added
      let newSession
      for (const session of results) {
        const { id: sessionId } = session
        let isOldSession = false
        for (const oldSession of prevOpenSessions) {
          if (oldSession.id === sessionId) isOldSession = true
        }

        if (!isOldSession) newSession = session
      }

      const volunteerIsNotInSession = !this.getters['user/isSessionAlive']
      if (volunteerIsNotInSession && newSession) {
        const isCertifiedInSubject = user.subjects.includes(newSession.subTopic)
        if (isCertifiedInSubject) {
          /*
           * ping subway with this; if the user is currently PASSIVE_ON_SITE,
           * subway will set a countdown for marking them as INACTIVE_ON_SITE.
           * when the countdown reaches 0, if they are still passive, mark them as inactive.
           */
          PresenceService.checkForInactivity()
          dispatch('alertVolunteer', { context, session: newSession })
        }
      }

      if (
        this.getters['americaCountsVolunteer/isAmericaCountsVolunteer'] &&
        !this.state.user.session?.id
      ) {
        AmericaCountsVolunteerService.maybeAutoJoinOldestSession(results)
      }
    },
  },

  getters: {
    isReadyToTutor: (_state, _getters, rootState, rootGetters) => {
      return (
        rootGetters['user/isVolunteer'] &&
        rootState.user.user.isOnboarded &&
        rootState.user.user.isApproved &&
        rootState.user.user.banType !== 'complete'
      )
    },
    unlockedOpenSessions: (state, _getters, rootState) => {
      const unlockedSubjects = rootState.user.user.subjects ?? []
      return state.allOpenSessions.filter((session) =>
        unlockedSubjects.includes(session.subTopic)
      )
    },
    lockedOpenSessions: (state, _getters, rootState) => {
      const unlockedSubjects = rootState.user.user.subjects ?? []
      return state.allOpenSessions.filter(
        (session) => !unlockedSubjects.includes(session.subTopic)
      )
    },
    NTHSChecklist: (state) => {
      const checklist = state.NTHSActions.reduce((list, action) => {
        const text = actionsCtaMap[action.name]
        const status = state.checksInFlight.includes(action.id)
          ? CheckboxStatus.Saving
          : state.NTHSGroupActions.some(
                ({ actionId }) => actionId === action.id
              )
            ? CheckboxStatus.Done
            : CheckboxStatus.NotDone

        if (text) {
          list.push({
            text,
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
