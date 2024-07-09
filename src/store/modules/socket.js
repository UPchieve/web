import { socket } from '@/socket'
import LoggerService from '@/services/LoggerService'
import router from '../../router'
import SessionFulfilledModal from '../../views/SessionView/SessionFulfilledModal.vue'

function isExemptSocketError(error) {
  return (
    error.message === 'xhr poll error' || error.message === 'websocket error'
  )
}

export default {
  namespaced: true,
  state: {
    isConnected: false,
    error: '',
    reconnectAttempts: 0,
    isTyping: false,
    messageData: {},
    messageError: {},
    socketJoinedRoom: false,
  },
  mutations: {
    setIsConnected: (state, isConnected) => (state.isConnected = isConnected),
    incrementReconnectAttempts: (state) => (state.reconnectAttempts += 1),
    setIsTyping: (state, isTyping) => {
      state.isTyping = isTyping
    },
    setMessageData: (state, data) => (state.messageData = data),
    setMessageError: (state, data) => (state.messageError = data),
    setSocketJoinedRoom: (state, bool) => (state.socketJoinedRoom = bool),
  },

  actions: {
    bindEvents({ commit, rootState, rootGetters }) {
      socket.on('connect', async () => {
        commit('setIsConnected', true)
        socket.emit('client_connect', {
          metadata: {
            pageVisibility: document.visibilityState,
          },
        })
        // TODO: Refactor references to isSessionConnectionAlive to use the isConnected state in this store
        this.dispatch('user/sessionConnected')
      })

      // https://socket.io/docs/v2/client-api/#event-disconnect
      socket.on('disconnect', async (reason) => {
        commit('setIsConnected', false)
        socket.emit('client_disconnect', {
          reason,
          metadata: {
            pageVisibility: document.visibilityState,
          },
        })
        this.dispatch('user/sessionDisconnected')
        // Ignore logging errors for when we make manual disconnects, e.g logging out
        if (reason === 'io client disconnect') return
        const userType = rootGetters['user/userType']
        const err = new Error(
          `Socket.io connection for ${userType} with user id ${rootState.user.user?.id} disconnected for reason: ${reason}`
        )
        LoggerService.noticeError(err)

        if (reason === 'io server disconnect') {
          // the disconnection was initiated by the server, you need to reconnect manually
          if (!socket.connected) await socket.connect()
        }
      })

      socket.on('connect_error', (error) => {
        socket.emit('client_connect_error', {
          error,
          metadata: {
            pageVisibility: document.visibilityState,
          },
        })
        // these are handled internally and shouldn't be forwarded to Sentry
        if (isExemptSocketError(error)) return
        LoggerService.noticeError(error)
      })

      socket.io.on('error', (error) => {
        socket.emit('client_error', {
          error,
          metadata: {
            pageVisibility: document.visibilityState,
          },
        })
        if (isExemptSocketError(error)) return
        LoggerService.noticeError(error)
      })

      socket.io.on('reconnect_error', (error) => {
        socket.emit('client_reconnect_error', {
          error,
          metadata: {
            pageVisibility: document.visibilityState,
          },
        })
        if (isExemptSocketError(error)) return
        LoggerService.noticeError(error)
      })

      socket.io.on('reconnect', () => {
        socket.emit('client_reconnect')
        // TODO: Refactor references to isSessionConnectionAlive to use the isConnected state in this store
        this.dispatch('user/sessionConnected')
      })

      socket.io.on('reconnect_failed', () => {
        socket.emit('client_reconnect_failed')
      })

      socket.io.on('reconnect_attempt', () => {
        socket.emit('client_reconnect_attempt')
        this.dispatch('user/sessionDisconnected')
        commit('incrementReconnectAttempts')
      })

      // https://socket.io/docs/v2/client-api/#event-disconnect
      socket.on('session-change', (sessionData) => {
        this.dispatch('user/updateSession', sessionData)
      })

      socket.on('redirect', (error) => {
        LoggerService.noticeError(
          error ?? `Redirected from ${router.currentRoute} to the dashboard`
        )
        router.push('/')
      })

      socket.on('sessions', async (sessions) => {
        if (rootGetters['user/isVolunteer']) {
          this.dispatch('volunteer/handleIncomingSessions', {
            context: { router },
            sessions,
          })
        }
      })

      socket.on('bump', (data) => {
        const userId = rootState.user.id
        const endedAt = rootState.user.session.endedAt
        // Do not show the session fulfilled modal if a user is already
        // present on the page after a session has ended
        if (!endedAt) {
          this.dispatch('app/modal/show', {
            component: SessionFulfilledModal,
            data: {
              acceptText: 'Return to Dashboard',
              alertModal: true,
              isSessionEnded: !!data.endedAt,
              volunteerJoined: !!data.volunteer,
              isSessionVolunteer: userId === data.volunteer,
              isSessionStudent: userId === data.student,
            },
          })
        }
      })

      socket.on('is-typing', (data) => {
        const isRecap = data.sessionId === rootState.user.recapSession.id
        if (data.sessionId === rootState.user.session.id || isRecap) {
          commit(
            'setIsTyping',
            isRecap
              ? true
              : rootGetters['user/isSessionAlive'] &&
                  rootState.user.isSessionConnectionAlive
          )
        }
      })

      socket.on('not-typing', (data) => {
        if (
          data.sessionId === rootState.user.session.id ||
          data.sessionId === rootState.user.recapSession.id
        ) {
          commit('setIsTyping', false)
        }
      })

      socket.on('messageSend', (data) => {
        if (
          data.sessionId === rootState.user.session.id ||
          data.sessionId === rootState.user.recapSession.id
        ) {
          commit('setMessageData', data)
        }
      })

      socket.on('messageError', (data) => {
        if (
          data.sessionId === rootState.user.session.id ||
          data.sessionId === rootState.user.recapSession.id
        ) {
          commit('setMessageError', data)
        }
      })

      socket.on('sessions/recap:joined', () => {
        commit('setSocketJoinedRoom', true)
      })

      socket.on('sessions/recap:joined-failed', (error) => {
        LoggerService.noticeError(error)
        commit('setSocketJoinedRoom', false)
      })

      socket.on('progress-report:processed:overview', (data) => {
        if (data.report && data.report.status === 'complete')
          this.dispatch('user/getProgressReportOverviewSubjectStats')
      })

      socket.on('sessions/partner:in-session', (isOnline) => {
        this.dispatch('session/onlineStatusForPartner', isOnline)
      })
    },
    connect() {
      socket.connect()
    },
  },
}
