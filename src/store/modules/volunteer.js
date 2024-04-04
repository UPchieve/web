import sendWebNotification from '@/utils/send-web-notification'
import LoggerService from '@/services/LoggerService'

export default {
  namespaced: true,
  state: {
    newWaitingStudentAudio: null,
    openSessions: [],
    emitListIntervalId: null,
    hasError: false,
    priorityStudents: new Set(),
  },
  mutations: {
    setOpenSessions: (state, openSessions) =>
      (state.openSessions = openSessions),
    setEmitListIntervalId: (state, emitListIntervalId) =>
      (state.emitListIntervalId = emitListIntervalId),
    setHasError: (state, hasError) => (state.hasError = hasError),
    addPriorityStudent: (state, student) => {
      state.priorityStudents.add(student)
    },
    removePriorityStudent: (state, student) => {
      state.priorityStudents.delete(student)
    },
  },

  actions: {
    addPriorityStudent({ commit }, student) {
      commit('addPriorityStudent', student)
    },
    removePriorityStudent({ commit }, student) {
      commit('removePriorityStudent', student)
    },
    emitList({ commit, getters }, { socket, retryCount = 0, maxRetries = 5 }) {
      let isAcknowledged = false
      let timeoutId
      socket.emit('list', null, (response) => {
        if (response.status === 200) {
          isAcknowledged = true
          clearTimeout(timeoutId)
          this.dispatch('volunteer/handleIncomingSessions', response.sessions)
        }
      })

      if (retryCount < maxRetries) {
        // simple exponential backoff
        const delay = Math.pow(2, retryCount) * 500
        timeoutId = setTimeout(() => {
          if (!isAcknowledged) {
            this.dispatch('volunteer/emitList', {
              socket,
              retryCount: retryCount + 1,
              maxRetries,
            })
          }
        }, delay)
      } else {
        LoggerService.noticeError(
          `Max retry attempts reached, unable to fetch list of sessions for user: ${getters.user.id}`
        )
        commit('setHasError', true)
      }
    },

    waitTick() {
      // no-op - this needs to be defined so we can trigger ui updates based on startWaitTimeRefresh
    },

    // Refresh the wait time on open sessions for waiting students
    // Force a re-render on this instance to show updated wait times if there are open sessions
    startWaitTimeRefresh({ commit, state }, wait = 1000 * 60) {
      commit(
        'setEmitListIntervalId',
        setInterval(() => {
          if (state.openSessions.length === 0) {
            clearInterval(state.emitListIntervalId)
            state.emitListIntervalId = null
          } else {
            this.dispatch('volunteer/waitTick')
          }
        }, wait)
      )
    },
    async handleIncomingSessions({ commit, dispatch, state }, sessions) {
      const user = this.state.user.user
      const isPaidTutor = this.getters['featureFlags/isPaidTutor']
      const isPaidTutorsPilotRunning =
        this.getters['featureFlags/isPaidTutorsPilotRunning']
      if (!sessions || !Array.isArray(sessions) || user.isBanned) {
        commit('setOpenSessions', [])
        return
      }
      // Start refreshing for open sessions if no timer is currently running
      if (sessions.length > 0 && !state.emitListIntervalId)
        dispatch(
          'startWaitTimeRefresh',
          isPaidTutorsPilotRunning ? 1000 : 1000 * 60
        )

      const results = []
      const socketSessions = sessions.filter((session) => !session.volunteer)

      for (let i = 0; i < socketSessions.length; i++) {
        const session = socketSessions[i]
        const { subTopic, type, paidTutorsPilotGroup } = session

        const isAdminOrTestUser = user.isAdmin || user.isTestUser
        // Show test accounts to admin and test volunteer accounts
        if (session.student.isTestUser && !isAdminOrTestUser) {
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
            this.getters['featureFlags/isMutedSubjectAlertsActive'] &&
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
      for (const session of state.openSessions) {
        const { _id: sessionId } = session
        let isOldSession = false
        for (const oldSession of prevOpenSessions) {
          if (oldSession._id === sessionId) isOldSession = true
        }

        if (!isOldSession) newSession = session
      }
      const isNotInSession = !this.state.user.session?.id
      if (isNotInSession && newSession) {
        try {
          await state.newWaitingStudentAudio.play()
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('Unable to play audio', error)
        }

        sendWebNotification(
          `${newSession.student.firstname} needs help in ${newSession.subjectDisplayName}`,
          {
            body: 'Can you help them?',
          }
        )
      }
    },
  },
}
