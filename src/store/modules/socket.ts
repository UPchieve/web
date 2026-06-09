import type { ActionContext } from 'vuex'
import router from '@/router'
import { socket } from '@/socket'
import type { RootState } from '@/store/index'
import LoggerService from '@/services/LoggerService'
import {
  IMAGE_UPLOAD_EVENTS,
  PARTNER_IMAGE_UPLOAD_STATUS,
} from '@/composables/imageUploadState'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

/**
 * These errors handled internally and shouldn't be forwarded to our logger.
 */
function isExemptSocketError(error: { message: string }) {
  return (
    error.message === 'xhr poll error' || error.message === 'websocket error'
  )
}

export type SocketState = {
  isConnected: boolean
  error: string
  reconnectAttempts: number
  isTyping: boolean
  messageData: MessageData
  socketJoinedRoom: boolean
  partnerImageUploadStatus: string | null
  partnerImageUploadError: object | string
}

// TODO: Replace any's with proper types.
type MessageData = any

export default {
  namespaced: true,
  state: {
    isConnected: false,
    error: '',
    reconnectAttempts: 0,
    isTyping: false,
    messageData: {},
    socketJoinedRoom: false,
    partnerImageUploadStatus: null,
    partnerImageUploadError: null,
  },
  mutations: {
    setIsConnected: (state: SocketState, isConnected: boolean) => {
      state.isConnected = isConnected
    },
    incrementReconnectAttempts: (state: SocketState) => {
      state.reconnectAttempts += 1
    },
    setIsTyping: (state: SocketState, isTyping: boolean) => {
      state.isTyping = isTyping
    },
    setMessageData: (state: SocketState, data: MessageData) => {
      state.messageData = data
    },
    setSocketJoinedRoom: (state: SocketState, bool: boolean) => {
      state.socketJoinedRoom = bool
    },
    setPartnerImageUploadStatus: (state: SocketState, status: string) => {
      state.partnerImageUploadStatus = status
    },
    setPartnerImageUploadError: (
      state: SocketState,
      error: object | string
    ) => {
      state.partnerImageUploadError = error
    },
  },
  getters: {
    partnerImageUploadError: (state: SocketState) =>
      state.partnerImageUploadError,
    partnerImageUploadStatus: (state: SocketState) =>
      state.partnerImageUploadStatus,
  },

  actions: {
    bindEvents({
      commit,
      dispatch,
      rootState,
      rootGetters,
    }: ActionContext<SocketState, RootState>) {
      socket.on('connect', async () => {
        commit('setIsConnected', true)
        socket.emit('client_connect', {
          metadata: {
            pageVisibility: document.visibilityState,
          },
        })
      })

      // Check out documentation to see the different
      // socket disconnect reasons:
      // https://socket.io/docs/v2/client-api/#event-disconnect
      socket.on('disconnect', async (reason: string) => {
        commit('setIsConnected', false)
        socket.emit('client_disconnect', {
          reason,
          metadata: {
            pageVisibility: document.visibilityState,
          },
        })

        // Ignore logging errors for when we make manual disconnects, e.g logging out.
        if (reason === 'io client disconnect') return

        const userType = rootGetters['user/userType']
        const err = new Error(`Socket.io disconnected.`)
        LoggerService.noticeError(err, {
          userType,
          userId: rootState.user.user?.id,
          reason,
        })

        if (reason === 'io server disconnect') {
          // The disconnection was initiated by the server, you need to reconnect manually.
          socket.connect()
        }
      })

      socket.on('connect_error', (error: any) => {
        commit('setIsConnected', false)
        socket.emit('client_connect_error', {
          error,
          metadata: {
            pageVisibility: document.visibilityState,
          },
        })

        if (isExemptSocketError(error)) return
        LoggerService.noticeError(error)
      })

      socket.io.on('error', (error: any) => {
        commit('setIsConnected', false)
        socket.emit('client_error', {
          error,
          metadata: {
            pageVisibility: document.visibilityState,
          },
        })

        if (isExemptSocketError(error)) return
        LoggerService.noticeError(error)
      })

      socket.io.on('reconnect_error', (error: any) => {
        commit('setIsConnected', false)
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
        commit('setIsConnected', false)
      })

      socket.io.on('reconnect_failed', () => {
        socket.emit('client_reconnect_failed')
      })

      socket.io.on('reconnect_attempt', () => {
        commit('setIsConnected', false)
        commit('incrementReconnectAttempts')
        socket.emit('client_reconnect_attempt')
      })

      // Emitted as unauthorized access.
      socket.on('redirect', (error: any) => {
        LoggerService.noticeError(
          error ?? `Redirected from ${router.currentRoute} to the dashboard`
        )
        router.push('/')
      })

      socket.on('session-change', (sessionData: any) => {
        dispatch('user/updateSession', sessionData, { root: true })
      })

      socket.on('sessions', async (sessions: any[]) => {
        if (rootGetters['user/isVolunteer']) {
          dispatch(
            'volunteer/handleIncomingSessions',
            {
              context: { $router: router },
              sessions,
            },
            { root: true }
          )
        }
      })

      socket.on('is-typing', (data: { sessionId: string }) => {
        commit('setIsTyping', { sessionId: data.sessionId, isTyping: true })
      })

      socket.on('not-typing', (data: { sessionId: string }) => {
        commit('setIsTyping', { sessionId: data.sessionId, isTyping: false })
      })

      socket.on('celebrate', (data: { duration: number }) => {
        dispatch('celebrations/celebrate', data.duration, { root: true })
        if (rootGetters['user/isStudent']) {
          AnalyticsService.captureEvent(EVENTS.USER_RECEIVED_CELEBRATION)
        }
      })

      socket.on('messageSend', (data: MessageData) => {
        commit('setMessageData', data)
        dispatch('user/addMessage', data, {
          root: true,
        })
      })

      socket.on(
        'tutorBotConversationMessage',
        (data: { tutorBotConversationId: string }) => {
          if (
            data.tutorBotConversationId ===
            rootState.botConversations.currentConversation.conversationId
          ) {
            commit('botConversations/addToCurrentConversation', data, {
              root: true,
            })
          }
        }
      )

      socket.on('dm:received', () => {
        dispatch('user/fetchUnreadDMs', null, { root: true })
      })

      socket.on('sessions/recap:joined', () => {
        commit('setSocketJoinedRoom', true)
      })

      socket.on('sessions/recap:joined-failed', (error: any) => {
        LoggerService.noticeError(error)
        commit('setSocketJoinedRoom', false)
      })

      socket.on('progress-report:processed:overview', (data: any) => {
        if (data.report && data.report.status === 'complete')
          dispatch('user/getProgressReportOverviewSubjectStats', null, {
            root: true,
          })
      })

      socket.on('sessions/partner:in-session', (isOnline: boolean) => {
        dispatch('session/onlineStatusForPartner', isOnline, { root: true })
        if (!isOnline) commit('setIsTyping', false)
      })

      socket.on('sessions:partner-banned-from-live-media', () => {
        dispatch('liveMedia/partnerBannedFromLiveMedia', null, { root: true })
      })

      socket.on('sessions:banned-from-live-media', () => {
        dispatch('liveMedia/bannedFromLiveMedia', null, { root: true })
      })

      socket.on('moderation-infraction', (data: any) => {
        dispatch('liveMedia/handleModerationInfraction', data, { root: true })
      })

      socket.on('potentialPartnerModerationInfraction', (data: any) => {
        LoggerService.info(
          'received potentialPartnerModerationInfraction event',
          data
        )
        dispatch('liveMedia/handlePotentialPartnerInfraction', data, {
          root: true,
        })
      })

      socket.on('partnerAckLiveMediaBan', (data: any) => {
        dispatch('liveMedia/handlePartnerAckLiveMediaBan', data, {
          root: true,
        })
      })

      socket.on(IMAGE_UPLOAD_EVENTS.PARTNER_UPLOADING_IMAGE, () => {
        commit(
          'setPartnerImageUploadStatus',
          PARTNER_IMAGE_UPLOAD_STATUS.PARTNER_UPLOADING
        )
      })

      socket.on(
        IMAGE_UPLOAD_EVENTS.PARTNER_IMAGE_UPLOAD_FAILED,
        ({
          moderationFailures,
          uploadError,
        }: {
          moderationFailures: object | undefined
          uploadError: string | undefined
        }) => {
          if (moderationFailures) {
            commit('setPartnerImageUploadError', moderationFailures)
            commit(
              'setPartnerImageUploadStatus',
              PARTNER_IMAGE_UPLOAD_STATUS.MODERATION_FAILURE
            )
            commit('setPartnerImageUploadError', moderationFailures)
          } else if (uploadError) {
            commit('setPartnerImageUploadError', uploadError)
            commit(
              'setPartnerImageUploadStatus',
              PARTNER_IMAGE_UPLOAD_STATUS.GENERAL_ERROR
            )
          }
        }
      )

      socket.on(IMAGE_UPLOAD_EVENTS.PARTNER_IMAGE_UPLOAD_SUCCESS, () => {
        commit(
          'setPartnerImageUploadStatus',
          PARTNER_IMAGE_UPLOAD_STATUS.SUCCESS
        )
      })

      socket.on('partnerJoinedLiveMedia', () => {
        rootGetters['liveMedia/screenShareActor']?.send({
          type: 'partner_shared_screen',
        })
      })
    },
    connect() {
      socket.connect()
    },
    resetPartnerImageUploadStatus({
      commit,
    }: ActionContext<SocketState, RootState>) {
      commit('setPartnerImageUploadStatus', null)
      commit('setPartnerImageUploadError', null)
    },
  },
}
