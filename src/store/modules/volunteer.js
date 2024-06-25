import sendWebNotification from '@/utils/send-web-notification'
import StudentIcon from '@/assets/student-icon.svg'
import Case from 'case'

function getWaitTimeInSeconds({ createdAt }) {
  const newTime = new Date().getTime() - new Date(createdAt).getTime()
  return Number((newTime / 1000).toFixed(0))
}

export default {
  namespaced: true,
  state: {
    newWaitingStudentAudioElement: null,
    openSessions: [],
    tickIntervalId: null,
    prioritySessions: new Set(),
  },
  mutations: {
    setNewWaitingStudentAudioElement: (state, element) =>
      (state.newWaitingStudentAudioElement = element),
    setOpenSessions: (state, openSessions) =>
      (state.openSessions = openSessions),
    setTickIntervalId: (state, tickIntervalId) =>
      (state.tickIntervalId = tickIntervalId),
    addPrioritySession: (state, student) => {
      state.prioritySessions.add(student)
    },
    removePrioritySession: (state, student) => {
      state.prioritySessions.delete(student)
    },
  },
  actions: {
    gotoSession({ dispatch }, { context, session }) {
      const { type, subTopic, id } = session
      const path = `/session/${Case.kebab(type)}/${Case.kebab(subTopic)}/${id}`
      if (type && subTopic && id) {
        context.router.push(path)
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
        context.router.currentRoute.value.path === '/dashboard'
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
     * this action needs to be defined so consumers can subscribe
     * to when this is dispatched and act accordingly
     * example: ListSessions.vue component subscribes and rerenders the wait time
     *          for open sessions
     */
    tick({ state, commit }) {
      state.openSessions.forEach((session) => {
        const seconds = getWaitTimeInSeconds({ createdAt: session.createdAt })
        /*
         * We want extra alerting for our paid tutors.
         * When we get close to the 40 second mark, we
         * want to alert the paid tutors that they should
         * pick it up soon by playing audio queues and
         * flashing the student that is closing in on the
         * 60 second mark. once we're at the 60 second mark,
         * it's too late for the study, we want to prioritize
         * other students under 60 seconds
         */
        const isPaidTutor = this.getters['featureFlags/isPaidTutor']
        if (seconds >= 35 && seconds <= 60 && isPaidTutor) {
          commit('addPrioritySession', session.id)
        } else {
          commit('removePrioritySession', session.id)
        }
      })

      if (state.prioritySessions.size > 0) {
        try {
          state.newWaitingStudentAudioElement.play()
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('Unable to play audio', error)
        }
      }
    },

    /*
     * Broadcast a `tick` action at a specified interval.
     * This can be used for things like:
     *  - rendering a dynamic wait time for specific students
     *  - dispatching an audio or visual alert at specified times
     */
    tickInterval({ commit, state, dispatch }, wait = 1000) {
      commit(
        'setTickIntervalId',
        setInterval(() => {
          if (state.openSessions.length === 0) {
            clearInterval(state.tickIntervalId)
            commit('setTickIntervalId', null)
          } else {
            dispatch('tick')
          }
        }, wait)
      )
    },

    async handleIncomingSessions(
      { commit, dispatch, state },
      { context, sessions }
    ) {
      const user = this.state.user.user
      const isPaidTutor = this.getters['featureFlags/isPaidTutor']
      const isPaidTutorsPilotRunning =
        this.getters['featureFlags/isPaidTutorsPilotRunning']
      const isMutedSubjectAlertsActive =
        this.getters['featureFlags/isMutedSubjectAlertsActive']

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
        const { subTopic, type, paidTutorsPilotGroup } = session

        const isAdminOrTestUser = user.isAdmin || user.isTestUser
        // Show test accounts to admin and test volunteer accounts
        if (
          (session.student.isTestUser || session.student.isShadowBanned) &&
          !isAdminOrTestUser
        ) {
          continue
        }

        if (isPaidTutor && isPaidTutorsPilotRunning) {
          if (
            ['math', 'college'].includes(type) &&
            paidTutorsPilotGroup === 'test' &&
            user.subjects.includes(subTopic)
          ) {
            results.push(session)
          }
          // Paid tutor should only pick up students in the 'test' group
          // Do not show any other sessions
          continue
        }

        if (
          user.subjects.includes(subTopic) &&
          !(
            isMutedSubjectAlertsActive &&
            user.mutedSubjectAlerts.includes(subTopic)
          )
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
        dispatch('alertVolunteer', { context, session: newSession })
      }

      // Remove any existing notifications of sessions that were picked up or canceled
      const currentIds = results.map(({ id }) => id)
      const prevIds = prevOpenSessions.map(({ id }) => id)
      const removedSessionIds = prevIds.filter((id) => !currentIds.includes(id))
      for (const removedSessionId of removedSessionIds) {
        this.dispatch('notifications/remove', removedSessionId)
      }
    },
  },

  getters: {
    isReadyToTutor: (_state, _getters, rootState) => {
      return (
        rootState.user.user.isVolunteer &&
        rootState.user.user.isOnboarded &&
        rootState.user.user.isApproved &&
        !rootState.user.user.isBanned
      )
    },
  },
}
