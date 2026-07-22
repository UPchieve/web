import sendWebNotification from '@/utils/send-web-notification'
import StudentIcon from '@/assets/user_avatars/student-icon.svg'
import Case from 'case'
import * as AmericaCountsVolunteerService from '@/services/AmericaCountsVolunteerService'
import * as PresenceService from '@/services/PresenceService'
import { VolunteerOccupations } from '@/services/VolunteerService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

export default {
  namespaced: true,
  state: {
    newWaitingStudentAudioElement: null,
    allOpenSessions: [],
    tickIntervalId: null,
    ticks: 0,
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
  },
  actions: {
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

        if (!user.mutedSubjectAlerts.includes(subTopic)) {
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
        this.dispatch('notifications/remove', removedSession.id)
        const isLockedSession = !user.subjects.includes(removedSession.subTopic)
        if (isLockedSession) {
          dispatch('setSessionToExpire', removedSession.id)
          eligibleSessions.push(removedSession) // Add session back to the list for now
        }
      }

      /* Experiment: If the user is a high school student, filter out college-related sessions from
       * the open sessions list.
       */
      const occupations = user.occupation ?? []
      const isHighSchooler = occupations.includes(
        VolunteerOccupations.HIGH_SCHOOL_STUDENT
      )
      const hideCollegeSessions =
        this.getters[
          'featureFlags/areHighSchoolStudentsBarredFromCoachingCollegeSubjects'
        ]
      const filtered =
        isHighSchooler && hideCollegeSessions
          ? eligibleSessions.filter((session) => session.type !== 'college')
          : eligibleSessions
      if (filtered.length !== eligibleSessions.length) {
        AnalyticsService.captureEvent(EVENTS.HS_CC_COLLEGE_SESSIONS_HIDDEN)
      }

      commit('setAllOpenSessions', filtered)

      // We will send volunteers a notification if new session(s) have come in and they are
      // available.
      const oldSessionIds = prevOpenSessions.map((s) => s.id)
      const newSessions = filtered.filter((s) => !oldSessionIds.includes(s.id))
      const newSession = newSessions.length
        ? newSessions[newSessions.length - 1]
        : null

      const volunteerIsNotInSession = !this.getters['user/isSessionAlive']
      if (volunteerIsNotInSession && newSession) {
        const isCertifiedInSubject = user.subjects.includes(newSession.subTopic)
        if (isCertifiedInSubject) {
          // Avoid sending out notifications to coaches that were not explicitly requested
          if (
            newSession.isExclusive &&
            user.id !== newSession.requestedVolunteerId
          )
            return
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
        AmericaCountsVolunteerService.maybeAutoJoinOldestSession(
          eligibleSessions
        )
      }
    },
  },

  getters: {
    isReadyToTutor: (_state, _getters, rootState, rootGetters) => {
      return (
        rootGetters['user/isVolunteer'] &&
        rootState.user.user.isOnboarded &&
        rootState.user.user.isApproved &&
        rootState.user.user.banType !== 'complete' &&
        rootState.user.user.banType !== 'shadow'
      )
    },
    unlockedOpenSessions: (state, getters, rootState) => {
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
