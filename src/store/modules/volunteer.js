import sendWebNotification from '@/utils/send-web-notification'
import StudentIcon from '@/assets/user_avatars/student-icon.svg'
import Case from 'case'
import * as AmericaCountsVolunteerService from '@/services/AmericaCountsVolunteerService'
import * as PresenceService from '@/services/PresenceService'
import { useNotificationsStore } from '@/stores/notifications'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import { secondsInMs } from '@/utils/time-utils'

const GLOBAL_STATS_POLL_INTERVAL_MS = secondsInMs(10)

export default {
  namespaced: true,
  state: {
    newWaitingStudentAudioElement: null,
    allOpenSessions: [],
    tickIntervalId: null,
    ticks: 0,
    sessionOffer: null,
    globalStats: null,
    globalStatsIntervalId: null,
  },
  mutations: {
    setSessionOffer: (state, offer) => {
      state.sessionOffer = offer
    },
    clearSessionOffer: (state, sessionId) => {
      if (state.sessionOffer?.sessionId === sessionId) state.sessionOffer = null
    },
    setNewWaitingStudentAudioElement: (state, element) =>
      (state.newWaitingStudentAudioElement = element),
    setAllOpenSessions: (state, allOpenSessions) =>
      (state.allOpenSessions = allOpenSessions),
    setTickIntervalId: (state, tickIntervalId) =>
      (state.tickIntervalId = tickIntervalId),
    setGlobalStats: (state, stats) => (state.globalStats = stats),
    setGlobalStatsIntervalId: (state, intervalId) =>
      (state.globalStatsIntervalId = intervalId),
    incTicks: (state) => (state.ticks = state.ticks + 1),
    resetTicks: (state) => (state.ticks = 0),
    removeSession: (state, sessionId) => {
      state.allOpenSessions = state.allOpenSessions.filter(
        (s) => s.id !== sessionId
      )
    },
  },
  actions: {
    startPollingForGlobalStats({ dispatch, commit, state }) {
      if (state.globalStatsIntervalId) return

      const fetchStats = async () => {
        try {
          await dispatch('getGlobalStats')
        } catch (error) {
          // Keep showing the last stats we got; the next poll will try again.
          LoggerService.noticeError(error)
        }
      }

      fetchStats()
      commit(
        'setGlobalStatsIntervalId',
        setInterval(fetchStats, GLOBAL_STATS_POLL_INTERVAL_MS)
      )
    },
    stopPollingForGlobalStats({ commit, state }) {
      clearInterval(state.globalStatsIntervalId)
      commit('setGlobalStatsIntervalId', null)
    },
    async getGlobalStats({ commit }) {
      const response = await NetworkService.getVolunteerFacingStats()
      commit('setGlobalStats', response)
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

    playAudio({ state }) {
      try {
        state.newWaitingStudentAudioElement.play()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Unable to play audio', error)
      }
    },

    alertVolunteer({ dispatch, rootGetters, getters }, { context, session }) {
      const availableSessions = getters['availableSessions']
      const isAvailableSession = availableSessions.some(
        (s) => s?.id === session.id
      )
      if (!isAvailableSession) {
        return
      }

      dispatch('playAudio')
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
      const notificationsStore = useNotificationsStore()
      const notifications = notificationsStore.notifications
      const rollupShowing =
        notifications.findIndex(({ id }) => id === 'rollup-alert') > -1
      if (
        (!isMobile && availableSessions.length > 4) ||
        (isMobile && availableSessions.length > 3)
      ) {
        if (rollupShowing) {
          notificationsStore.updateTitle({
            notificationId: 'rollup-alert',
            title: `There are ${availableSessions.length} students that need help`,
          })
        } else {
          notificationsStore.clear()
          notificationsStore.add({
            id: 'rollup-alert',
            icon: StudentIcon,
            title: `There are ${availableSessions.length} students that need help`,
            cta: {
              text: 'Go to dashboard',
              action: () => context.$router.push('/'),
            },
            secondaryCta: { text: 'Pass' },
            type: 'secondary',
            duration: 1000 * 60 * 2,
          })
        }
      } else {
        notificationsStore.add({
          id: session.id,
          icon: StudentIcon,
          title: session.subjectDisplayName,
          description: [
            session.student?.firstname,
            session.student?.currentGradeName,
            !session.isExclusive && 'Any coach can join',
          ]
            .filter(Boolean)
            .join(' · '),
          cta: {
            text: 'Join',
            action: () => dispatch('gotoSession', { context, session }),
          },
          secondaryCta: { text: 'Pass' },
          type: 'secondary',
          duration: 1000 * 60 * 2,
        })
        notificationsStore.remove('rollup-alert')
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
      { commit, dispatch, state, getters },
      { context, sessions }
    ) {
      const user = this.state.user.user

      /*
       * EXPERIMENT: we have a new combined onboarding checklist that shows all available sessions
       * as "locked" sessions.
       */
      const isNotReadyAndIsNotInExperiment =
        !this.getters['volunteer/isReadyToTutor'] &&
        !this.getters['featureFlags/isCombinedOnboardingChecklistEnabled']

      const cantJoinSessions =
        !sessions || !Array.isArray(sessions) || isNotReadyAndIsNotInExperiment
      if (cantJoinSessions) {
        commit('setAllOpenSessions', [])
        return
      }

      // Trigger tick dispatch at interval if there is no timer running
      if (sessions.length > 0 && !state.tickIntervalId) {
        dispatch('tickInterval', 1000)
      }

      const eligibleSessions = []
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
            eligibleSessions.push(session)
          }
          /*
           * when we're in this if block, we always want to continue
           * as America Counts volunteers should only ever get middle
           * school math sessions
           */
          continue
        }

        const isMuted = user.mutedSubjectAlerts.includes(subTopic)

        if (!isMuted) {
          eligibleSessions.push(session)
        }
      }

      const prevOpenSessions = state.allOpenSessions
      /*
       * Remove any existing notifications of sessions that were picked up or canceled.
       * If showing locked sessions is enabled, set a 1-minute timeout before removing
       * this session from the list.
       */
      const removedSessions = prevOpenSessions.filter(
        (session) => !eligibleSessions.some((s) => s.id === session.id)
      )
      for (const removedSession of removedSessions) {
        // If a locked session was cancelled or picked up, let it remain in the list for
        // a short time to give the coach a chance to still click on it to take the cert quiz.
        useNotificationsStore().remove(removedSession.id)
        const isLockedSession = !user.subjects.includes(removedSession.subTopic)
        if (isLockedSession) {
          dispatch('setSessionToExpire', removedSession.id)
          eligibleSessions.push(removedSession) // Add session back to the list for now
        }
      }

      commit('setAllOpenSessions', eligibleSessions)

      // We will send volunteers a notification if new session(s) have come in and they are
      // available.
      const oldSessionIds = prevOpenSessions.map((s) => s.id)
      const alertableSessions = getters.availableSessions.filter(
        (s) => !oldSessionIds.includes(s.id)
      )

      // Only alert for sessions the volunteer is qualified to join
      const newSession = alertableSessions.length
        ? alertableSessions[alertableSessions.length - 1]
        : null

      const volunteerIsNotInSession = !this.getters['user/isSessionAlive']
      if (volunteerIsNotInSession && newSession) {
        PresenceService.checkForInactivity()
        dispatch('alertVolunteer', { context, session: newSession })
      }

      if (
        this.getters['americaCountsVolunteer/isAmericaCountsVolunteer'] &&
        !this.state.user.session?.id
      ) {
        AmericaCountsVolunteerService.maybeAutoJoinOldestSession(
          eligibleSessions
        )
      }
    },
  },

  getters: {
    isOnboardedAndApproved: (_state, _getters, rootState, rootGetters) => {
      return (
        rootGetters['user/isVolunteer'] &&
        rootState.user.user.isOnboarded &&
        rootState.user.user.isApproved
      )
    },
    isReadyToTutor: (_state, getters, rootState) => {
      return (
        getters.isOnboardedAndApproved &&
        rootState.user.user.banType !== 'complete' &&
        rootState.user.user.banType !== 'shadow'
      )
    },
    availableSessions: (state, getters, rootState) => {
      if (getters['isReadyToTutor']) {
        const unlockedSubjects = rootState.user.user.subjects ?? []
        return state.allOpenSessions.filter(
          (session) =>
            unlockedSubjects.includes(session.subTopic) && !session.isExclusive
        )
      } else {
        return []
      }
    },
    lockedOpenSessions: (state, getters, rootState) => {
      if (getters['isReadyToTutor']) {
        const unlockedSubjects = rootState.user.user.subjects ?? []
        return state.allOpenSessions.filter(
          (session) =>
            !unlockedSubjects.includes(session.subTopic) && !session.isExclusive
        )
      } else {
        return state.allOpenSessions
      }
    },
    exclusiveSessions: (state, getters, rootState) => {
      if (getters['isReadyToTutor']) {
        const unlockedSubjects = rootState.user.user.subjects ?? []
        const userId = rootState.user.user.id
        return state.allOpenSessions.filter(
          (session) =>
            unlockedSubjects.includes(session.subTopic) &&
            session.isExclusive &&
            session.requestedVolunteerId === userId
        )
      } else {
        return []
      }
    },
  },
}
