import sendWebNotification from '@/utils/send-web-notification'
import StudentIcon from '@/assets/user_avatars/student-icon.svg'
import Case from 'case'
import * as AmericaCountsVolunteerService from '@/services/AmericaCountsVolunteerService'
import * as PresenceService from '@/services/PresenceService'

export default {
  namespaced: true,
  state: {
    newWaitingStudentAudioElement: null,
    openSessions: [],
    tickIntervalId: null,
    ticks: 0,
  },
  mutations: {
    setNewWaitingStudentAudioElement: (state, element) =>
      (state.newWaitingStudentAudioElement = element),
    setOpenSessions: (state, openSessions) =>
      (state.openSessions = openSessions),
    setTickIntervalId: (state, tickIntervalId) =>
      (state.tickIntervalId = tickIntervalId),
    incTicks: (state) => (state.ticks = state.ticks + 1),
    resetTicks: (state) => (state.ticks = 0),
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

    alertVolunteer({ state, dispatch, rootGetters }, { context, session }) {
      try {
        state.newWaitingStudentAudioElement.play()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Unable to play audio', error)
      }

      sendWebNotification(`${session.student.firstname} needs help`, {
        body: `Can you help them with ${session.subjectDisplayName}?`,
      })
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
        (!isMobile && state.openSessions.length > 4) ||
        (isMobile && state.openSessions.length > 3)
      ) {
        if (rollupShowing) {
          this.dispatch('notifications/updateTitle', {
            notificationId: 'rollup-alert',
            title: `There are ${state.openSessions.length} students that need help`,
          })
        } else {
          this.dispatch('notifications/clear')
          this.dispatch('notifications/add', {
            id: 'rollup-alert',
            icon: StudentIcon,
            title: `There are ${state.openSessions.length} students that need help`,
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
          title: `${session.student.firstname} needs help with ${session.subjectDisplayName}`,
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
          if (state.openSessions.length === 0) {
            clearInterval(state.tickIntervalId)
            commit('setTickIntervalId', null)
            commit('resetTicks', null)
          } else {
            commit('incTicks', null)
          }
        }, wait)
      )
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
        commit('setOpenSessions', [])
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

        if (
          user.subjects.includes(subTopic) &&
          !user.mutedSubjectAlerts.includes(subTopic)
        ) {
          results.push(session)
        }
      }

      const prevOpenSessions = state.openSessions
      commit('setOpenSessions', results)

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
        /*
         * ping subway with this; if the user is currently PASSIVE_ON_SITE,
         * subway will set a countdown for marking them as INACTIVE_ON_SITE.
         * when the countdown reaches 0, if they are still passive, mark them as inactive.
         */
        PresenceService.checkForInactivity()
        dispatch('alertVolunteer', { context, session: newSession })
      }

      // Remove any existing notifications of sessions that were picked up or canceled
      const currentIds = results.map(({ id }) => id)
      const prevIds = prevOpenSessions.map(({ id }) => id)
      const removedSessionIds = prevIds.filter((id) => !currentIds.includes(id))
      for (const removedSessionId of removedSessionIds) {
        this.dispatch('notifications/remove', removedSessionId)
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
  },
}
