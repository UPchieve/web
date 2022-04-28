import StudentAvatarUrl from '@/assets/defaultavatar3.png'
import VolunteerAvatarUrl from '@/assets/defaultavatar4.png'
import SessionService from '@/services/SessionService'
import UserService from '@/services/UserService'
import * as Sentry from '@sentry/browser'
import Case from 'case'
import _ from 'lodash'

export default {
  namespaced: true,
  state: {
    user: {},
    session: {},
    latestSession: {},
    isFirstDashboardVisit: false,
    isSessionConnectionAlive: false,
    presessionSurvey: {},
    unreadChatMessageIndices: [],
    chatScrolledToMessageIndex: null
  },
  mutations: {
    setUser: (state, user = {}) => (state.user = user),

    updateUser: (state, user = {}) => {
      if (
        !user.date ||
        !state.user.date ||
        user.date.getTime() >= state.user.date.getTime()
      ) {
        state.user = user
      }
    },

    setSession: (state, session = {}) => (state.session = session),

    setLatestSession: (state, session = {}) => (state.latestSession = session),

    addMessage: (state, message) => {
      if (message) state.session.messages.push(message)
    },

    setAvailability: (state, availability, date) => {
      if (availability) {
        state.user.availability = availability
        state.user.date = date
      }
    },

    setTimezone: (state, timezone, date) => {
      if (timezone) {
        state.user.timezone = timezone
        state.user.date = date
      }
    },

    setIsFirstDashboardVisit: (state, isFirstDashboardVisit) => {
      state.isFirstDashboardVisit = isFirstDashboardVisit
    },

    setIsSessionConnectionAlive: (state, isSessionConnectionAlive) => {
      state.isSessionConnectionAlive = isSessionConnectionAlive
    },

    setPresessionSurvey: (state, presessionSurvey = {}) =>
      (state.presessionSurvey = presessionSurvey),

    markChatMessageUnread: (state, index) => {
      if (typeof index === 'number') {
        state.unreadChatMessageIndices.push(index)
      }
    },

    markChatMessageRead: (state, index) => {
      if (typeof index === 'number') {
        state.unreadChatMessageIndices = state.unreadChatMessageIndices.filter(
          v => v !== index
        )
      }
    },

    markChatMessagesRead: (state, indices) => {
      if (indices && indices.length > 0) {
        state.unreadChatMessageIndices = state.unreadChatMessageIndices.filter(
          v => indices.indexOf(v) === -1
        )
      }
    },

    clearUnreadChatMessages: state => {
      state.unreadChatMessageIndices = []
    },

    scrollChatToMessage: (state, index) => {
      if (typeof index === 'number') {
        state.chatScrolledToMessageIndex = index
      }
    },

    clearChatScrolledToMessageIndex: state => {
      state.chatScrolledToMessageIndex = null
    }
  },
  actions: {
    fetch: ({ dispatch }, context) => {
      dispatch('fetchUser')
      dispatch('fetchSession', context)
    },

    clear: ({ commit }) => {
      commit('setUser', {})
      commit('setSession', {})
    },

    fetchUser: ({ commit }) => {
      return UserService.getUser().then(user => {
        commit('updateUser', user)
      }).catch((err) => {
        // erase the user only if not authenticated
        if (err.status === 401) {
          commit('setUser', {})
        }
      })
    },

    clearUser: ({ commit }) => {
      commit('setUser', {})
    },

    fetchSession: ({ commit, state }, context) => {
      SessionService.getCurrentSession(context, state.user)
        .then(({ sessionData }) => {
          commit('setSession', sessionData)
        })
        .catch(err => {
          commit('setSession', {})
          if (err.status !== 404) {
            Sentry.captureException(err)
          }
        })
    },

    fetchLatestSession: ({ commit, state }, context) => {
      SessionService.getLatestSession(context, state.user)
        .then(({ sessionData }) => {
          commit('setLatestSession', sessionData)
        })
        .catch(err => {
          commit('setLatestSession', {})
          if (err.status !== 404) {
            Sentry.captureException(err)
          }
        })
    },

    clearSession: ({ commit }) => {
      commit('setSession', {})
    },

    sessionDisconnected: ({ commit }) => {
      commit('setIsSessionConnectionAlive', false)
      commit('clearUnreadChatMessages')
      commit('clearChatScrolledToMessageIndex')
    },

    sessionConnected: ({ commit }) => {
      commit('setIsSessionConnectionAlive', true)
    },

    updateSession: ({ commit }, sessionData) => {
      commit('setSession', sessionData)
    },

    updateAvailability: ({ commit }, availability, date = Date.now()) => {
      commit('setAvailability', availability, date)
    },

    updateTimezone: ({ commit }, timezone, date = Date.now()) => {
      commit('setTimezone', timezone, date)
    },

    addMessage: ({ commit }, message) => {
      commit('addMessage', message)
    },

    firstDashboardVisit: ({ commit }, isFirstDashboardVisit) => {
      commit('setIsFirstDashboardVisit', isFirstDashboardVisit)
    },

    addToUser: ({ commit, state }, data) => {
      const { user } = state
      const updatedUser = { ...user, ...data }
      commit('updateUser', updatedUser)
    },

    updatePresessionSurvey: ({ commit }, surveyData) => {
      commit('setPresessionSurvey', surveyData)
    },

    clearPresessionSurvey: ({ commit }) => {
      commit('setPresessionSurvey', {})
    },

    markChatMessageAsUnread: ({ commit }, index) => {
      commit('markChatMessageUnread', index)
    },

    markChatMessageAsRead: ({ commit }, index) => {
      commit('markChatMessageRead', index)
    },

    markChatMessagesAsRead: ({ commit }, indices) => {
      commit('markChatMessagesRead', indices)
    },

    scrollChatToMessage: ({ commit }, index) => {
      commit('scrollChatToMessage', index)
    },

    clearChatScrolledToMessageIndex: ({ commit }) => {
      commit('clearChatScrolledToMessageIndex')
    }
  },
  getters: {
    avatarUrl: state =>
      state.user.picture ||
      (state.user.isVolunteer ? VolunteerAvatarUrl : StudentAvatarUrl),

    firstName: state =>
      state.user.firstname ||
      (state.user.isVolunteer ? 'Volunteer' : 'Student'),
    lastName: state => state.user.lastname,
    fullName: (state, getters) =>
      [getters.firstName, getters.lastName].join(' '),

    isVolunteer: state => state.user.isVolunteer,
    isAdmin: state => state.user.isAdmin,

    isAuthenticated: state => !!(state.user && state.user._id),

    isVerified: state => state.user.verified,

    hasCertification: state => {
      return _.some(state.user.certifications, { passed: true })
    },

    hasSelectedAvailability: state => !!state.user.availabilityLastModifiedAt,

    sessionPath: state => {
      const { type, subTopic, _id } = state.session
      const path = `/session/${Case.kebab(type)}/${Case.kebab(subTopic)}/${_id}`

      return path
    },

    sessionPartner: (state, getters) => {
      if (
        typeof state.session.volunteer !== 'object' ||
        typeof state.session.student !== 'object'
      ) {
        return {}
      }

      if (getters.isVolunteer) {
        return state.session.student
      } else {
        return state.session.volunteer
      }
    },

    isSessionAlive: state => {
      // Early exit if the session doesn't exist
      if (!state.session.createdAt) {
        return false
      }

      // True if the session hasn't ended
      return !state.session.endedAt
    },

    isSessionWaitingForVolunteer: state => {
      // Early exit if the session doesn't exist or has ended
      if (!state.session.createdAt || !!state.session.endedAt) {
        return false
      }

      // True if volunteer hasn't joined
      return !state.session.volunteerJoinedAt
    },

    isSessionInProgress: state => {
      // Early exit if the session doesn't exist
      if (!state.session.createdAt) {
        return false
      }

      // True if volunteer has joined and the session hasn't ended
      return !!state.session.volunteerJoinedAt && !state.session.endedAt
    },

    isSessionOver: state => {
      // Early exit if the session doesn't exist
      if (!state.session.createdAt) {
        return false
      }

      // True if the session has ended
      return !!state.session.endedAt
    },

    numberOfUnreadChatMessages: state => {
      return state.unreadChatMessageIndices.length
    }
  }
}
