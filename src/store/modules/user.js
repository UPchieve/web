import Case from 'case'
import { some } from 'lodash-es'
import StudentAvatarUrl from '@/assets/defaultavatar3.png'
import VolunteerAvatarUrl from '@/assets/defaultavatar4.png'
import SessionService from '@/services/SessionService'
import UserService from '@/services/UserService'
import LoggerService from '@/services/LoggerService'
import FeatureFlagService from '@/services/FeatureFlagService'
import NetworkService from '@/services/NetworkService'
import {
  isStudentUserType,
  isTeacherUserType,
  isVolunteerUserType,
} from '@/utils/user-type'

export default {
  namespaced: true,
  state: {
    user: {},
    session: {},
    latestSession: {},
    recapSession: {},
    isFirstDashboardVisit: false,
    isSessionConnectionAlive: false,
    presessionSurvey: {},
    unreadChatMessageIndices: [],
    chatScrolledToMessageIndex: null,
    hadASession: false,
    prevSessionSubject: '',
    progressReportOverviewSubjectStats: [],
    latestProgressReportOverview: {},
  },
  mutations: {
    setUser: (state, user = {}) => (state.user = user),

    updateUser: (state, user = {}) => {
      state.user = user
    },

    setSession: (state, session = {}) => (state.session = session),

    setRecapSession: (state, session = {}) => (state.recapSession = session),

    setLatestSession: (state, session = {}) => (state.latestSession = session),

    addMessage: (state, message) => {
      if (message) state.session.messages.push(message)
    },

    addRecapMessage: (state, message) => {
      if (message) state.recapSession.messages.push(message)
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
          (v) => v !== index
        )
      }
    },

    markChatMessagesRead: (state, indices) => {
      if (indices && indices.length > 0) {
        state.unreadChatMessageIndices = state.unreadChatMessageIndices.filter(
          (v) => indices.indexOf(v) === -1
        )
      }
    },

    clearUnreadChatMessages: (state) => {
      state.unreadChatMessageIndices = []
    },

    scrollChatToMessage: (state, index) => {
      if (typeof index === 'number') {
        state.chatScrolledToMessageIndex = index
      }
    },

    clearChatScrolledToMessageIndex: (state) => {
      state.chatScrolledToMessageIndex = null
    },

    setHadASession: (state, flag) => {
      state.hadASession = flag
    },

    setPrevSessionSubject: (state, subject) => {
      state.prevSessionSubject = subject
    },

    setProgressReportOverviewSubjectStats: (state, stats) => {
      state.progressReportOverviewSubjectStats = stats
    },
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
      return UserService.getUser()
        .then((user) => {
          commit('updateUser', user)
        })
        .catch((err) => {
          // erase the user only if not authenticated
          if (err?.response?.status === 401) {
            commit('setUser', {})
          }
        })
    },

    clearUser: ({ commit }) => {
      commit('setUser', {})
    },

    fetchSession: ({ commit, state }) => {
      SessionService.getCurrentSession(state.user)
        .then(({ sessionData }) => {
          commit('setSession', sessionData)
        })
        .catch((err) => {
          commit('setSession', {})
          LoggerService.noticeError(err)
        })
    },

    fetchLatestSession: ({ commit, state }) => {
      SessionService.getLatestSession(state.user)
        .then(({ sessionData }) => {
          commit('setLatestSession', sessionData)
        })
        .catch((err) => {
          commit('setLatestSession', {})
          LoggerService.noticeError(err)
        })
    },

    fetchRecapSessionForDms: async ({ commit }, sessionId) => {
      SessionService.getRecapSessionForDms(sessionId)
        .then(({ sessionData }) => {
          commit('setRecapSession', sessionData)
        })
        .catch((err) => {
          commit('setRecapSession', {})
          if (err.status !== 404) {
            LoggerService.noticeError(err)
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

    addRecapMessage: ({ commit }, message) => {
      commit('addRecapMessage', message)
    },

    firstDashboardVisit: ({ commit }, isFirstDashboardVisit) => {
      commit('setIsFirstDashboardVisit', isFirstDashboardVisit)
    },

    addToUser: ({ commit, state, getters }, data) => {
      const { user } = state
      const updatedUser = { ...user, ...data }
      commit('updateUser', updatedUser)
      // Ensure that properties are up to date with for feature flag evaluation
      FeatureFlagService.setPersonPropertiesForFlags(
        getters.getUserPropsForAnalytics
      )
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
    },

    updateHadASession: ({ commit }, flag) => {
      commit('setHadASession', flag)
    },

    updatePrevSessionSubject: ({ commit }, subject) => {
      commit('setPrevSessionSubject', subject)
    },

    getProgressReportOverviewSubjectStats: async ({ commit, getters }) => {
      if (getters.isVolunteer) return

      try {
        const response =
          await NetworkService.getProgressReportOverviewSubjectStats()
        commit('setProgressReportOverviewSubjectStats', response.data ?? [])
      } catch (error) {
        LoggerService.error(error.response.data.err)
      }
    },

    updateProgressReportsReadStatus: async ({ dispatch }, reportIds) => {
      if (!Array.isArray(reportIds) || !reportIds.length) return

      try {
        await NetworkService.updateProgressReportsReadStatus(reportIds)
        dispatch('getProgressReportOverviewSubjectStats')
      } catch (error) {
        LoggerService.error(error.response.data.err)
      }
    },

    getLatestProgressReportOverview: async ({ commit }) => {
      try {
        const response = await NetworkService.getLatestProgressReportOverview()
        commit('setLatestProgressReportOverview', response.data ?? {})
      } catch (error) {
        LoggerService.error(error.response.data.err)
      }
    },
  },
  getters: {
    avatarUrl: (_state, getters) => {
      if (getters.isVolunteer) {
        return VolunteerAvatarUrl
      } else if (getters.isStudent) {
        return StudentAvatarUrl
      } else if (getters.isTeacher) {
        // TODO: TEACHER PROFILES.
        return VolunteerAvatarUrl
      }
    },

    firstName: (state, getters) =>
      state.user.firstname || Case.capital(getters.userType),
    lastName: (state) => state.user.lastname,
    fullName: (state, getters) =>
      [getters.firstName, getters.lastName].join(' '),

    userType: (state) => state.user.userType,
    isVolunteer: (state) => isVolunteerUserType(state.user.userType),
    isStudent: (state) => isStudentUserType(state.user.userType),
    isTeacher: (state) => isTeacherUserType(state.user.userType),
    isAdmin: (state) => state.user.isAdmin,

    isAuthenticated: (state) => !!(state.user && state.user._id),

    isVerified: (state) => state.user.verified,

    hasCertification: (state) => {
      // UPchieve 101 is a training course and not technically considered
      // a certification. It's nested in user.certifications for legacy purposes
      const certs = Object.assign({}, state.user.certifications)
      delete certs.upchieve101
      return some(certs, { passed: true })
    },

    passedUpchieve101: (state) => {
      return state.user.certifications.upchieve101.passed
    },

    hasSelectedAvailability: (state) => !!state.user.availabilityLastModifiedAt,

    sessionPath: (state) => {
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

    isSessionAlive: (state) => {
      // Early exit if the session doesn't exist
      if (!state.session.createdAt) {
        return false
      }

      // True if the session hasn't ended
      return !state.session.endedAt
    },

    isSessionWaitingForVolunteer: (state) => {
      // Early exit if the session doesn't exist or has ended
      if (!state.session.createdAt || !!state.session.endedAt) {
        return false
      }

      // True if volunteer hasn't joined
      return !state.session.volunteerJoinedAt
    },

    isSessionInProgress: (state) => {
      // Early exit if the session doesn't exist
      if (!state.session.createdAt) {
        return false
      }

      // True if volunteer has joined and the session hasn't ended
      return !!state.session.volunteerJoinedAt && !state.session.endedAt
    },

    isSessionOver: (state) => {
      // Early exit if the session doesn't exist
      if (!state.session.createdAt) {
        return false
      }

      // True if the session has ended
      return !!state.session.endedAt
    },

    numberOfUnreadChatMessages: (state) => {
      return state.unreadChatMessageIndices.length
    },

    isAutoFlowUser: (state, getters) => {
      return (
        !state.user.isOnboarded &&
        getters.isVolunteer &&
        !getters.hasCertification
      )
    },

    isQuizStudyMaterialUser: (state, getters) => {
      return (
        getters.isVolunteer &&
        !state.user.isOnboarded &&
        !getters.hasCertification
      )
    },

    showDashboardRedesign: (_state, getters, _rootState, rootGetters) => {
      return (
        getters.isStudent && rootGetters['featureFlags/showDashboardRedesign']
      )
    },

    getUserPropsForAnalytics: (state, getters) => {
      const userProps = {
        ucId: state.user.id,
        userType: state.user.type,
        createdAt: state.user.createdAt,
        totalSessions: state.user.pastSessions.length,
        isBanned: state.user.isBanned,
        isTestUser: state.user.isTestUser,
      }
      if (getters.isVolunteer) {
        userProps.onboarded = state.user.isOnboarded
        userProps.approved = state.user.isApproved
        userProps.partner = state.user.volunteerPartnerOrg

        const certificationInfo = Object.entries(
          state.user.certifications
        ).reduce((acc, [subject, quizInfo]) => {
          acc[subject] = quizInfo.passed
          return acc
        }, {})
        return {
          ...userProps,
          ...certificationInfo,
        }
      } else if (getters.isStudent) {
        userProps.partner = state.user.studentPartnerOrg
        userProps.gradeLevel = state.user.gradeLevel
        if (state.user.isSchoolPartner) {
          userProps.schoolPartner = state.user.schoolName
        }
      } else if (getters.isTeacher) {
        // TODO: TEACHER PROFILES.
      }

      return userProps
    },

    hasUnreadProgressOverviewReports: (state) => {
      return state.progressReportOverviewSubjectStats.some(
        (subject) => subject.totalUnreadReports > 0
      )
    },
  },
}
