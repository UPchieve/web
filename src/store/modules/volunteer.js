import sendWebNotification from '@/utils/send-web-notification'

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
    alertVolunteer({ state }, session) {
      try {
        state.newWaitingStudentAudioElement.play()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Unable to play audio', error)
      }

      sendWebNotification(`${session.student.firstname} needs help`, {
        body: `Can you help them with ${session.subjectDisplayName}?`,
      })
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
        state.newWaitingStudentAudioElement.play()
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

    async handleIncomingSessions({ commit, dispatch, state }, sessions) {
      const user = this.state.user.user
      const isPaidTutor = this.getters['featureFlags/isPaidTutor']
      const isPaidTutorsPilotRunning =
        this.getters['featureFlags/isPaidTutorsPilotRunning']
      const isMutedSubjectAlertsActive =
        this.getters['featureFlags/isMutedSubjectAlertsActive']

      const volunteerCanAcceptSessions =
        !sessions || !Array.isArray(sessions) || user.isBanned
      if (volunteerCanAcceptSessions) {
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
        const { _id: sessionId } = session
        let isOldSession = false
        for (const oldSession of prevOpenSessions) {
          if (oldSession._id === sessionId) isOldSession = true
        }

        if (!isOldSession) newSession = session
      }

      const volunteerIsNotInSession = !user.session?.id
      if (volunteerIsNotInSession && newSession) {
        dispatch('alertVolunteer', newSession)
      }
    },
  },
}
