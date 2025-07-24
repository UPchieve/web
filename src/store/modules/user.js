import Case from 'case'
import { some } from 'lodash-es'
import StudentIcon from '@/assets/user_avatars/student-icon.svg'
import TeacherIcon from '@/assets/user_avatars/teacher-icon.svg'
import VolunteerIcon from '@/assets/user_avatars/volunteer-icon.svg'
import AmbassadorIcon from '@/assets/user_avatars/ambassador-icon.svg'
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
import AnalyticsService from '@/services/AnalyticsService'

export default {
  namespaced: true,
  state: {
    user: {},
    session: {},
    recapSession: {},
    isFirstDashboardVisit: false,
    presessionSurvey: {},
    unreadChatMessageIndices: [],
    chatScrolledToMessageIndex: null,
    hadASession: false,
    prevSessionSubject: '',
    progressReportOverviewSubjectStats: [],
    latestProgressReportOverview: {},
    sessionIsEnding: false,
  },
  mutations: {
    setUser: (state, user = {}) => (state.user = user),

    updateUser: (state, user = {}) => {
      state.user = user
    },

    // TODO: Move session related stuff to session store.
    setSession: (state, session = {}) => (state.session = session),
    setRecapSession: (state, session = {}) => (state.recapSession = session),
    // For live voice chat message.
    // TODO: Make that more clear.
    addPendingMessage: (state, message) => {
      if (
        message &&
        !state.session.messages.some((m) => m.msgId === message.msgId)
      ) {
        if (!state.session.pendingMessages) {
          state.session.pendingMessages = []
        }
        state.session.pendingMessages.push(message)
      }
    },
    // For live voice chat message.
    // TODO: Make that more clear.
    removePendingMessage: (state, message) => {
      if (message)
        state.session.pendingMessages =
          state.session.pendingMessages?.filter(
            (m) => m?.msgId !== message.msgId
          ) ?? []
    },
    addMessage: (state, message) => {
      if (message.sessionId === state.session.id) {
        state.session.messages.push(message)
      } else if (message.sessionId === state.recapSession.id) {
        state.recapSession.messages.push(message)
      } else {
        LoggerService.noticeError(
          'Received message for unknown session: ' + message.sessionId
        )
      }
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
    setSessionIsEnding: (state, isEnding) => {
      state.sessionIsEnding = isEnding
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
      commit('clearUnreadChatMessages')
      commit('clearChatScrolledToMessageIndex')
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
    addPendingMessage: ({ commit }, message) => {
      commit('addPendingMessage', message)
      // We've seen some cases where the message fails to be emitted back to the client
      // when that happens, the message will be stuck in the pending messages array
      // and just float at the bottom of the chat.
      // to get around that, we clear the pending messages after 7 seconds.
      // This can be reproduced by stopping redis while transcription is happening.
      // In practice, I'm not sure where the break down is but this should at latest
      // let the chat make sense.
      setTimeout(() => {
        commit('removePendingMessage', message)
      }, 7000)
    },
    addMessage: ({ commit }, message) => {
      commit('removePendingMessage', message)
      commit('addMessage', message)
    },

    firstDashboardVisit: ({ commit }, isFirstDashboardVisit) => {
      commit('setIsFirstDashboardVisit', isFirstDashboardVisit)
    },

    addToUser: ({ commit, state, getters }, data) => {
      const { user } = state
      const updatedUser = { ...user, ...data }
      commit('updateUser', updatedUser)
      // Ensure that properties are up to date with for feature flag evaluation
      const personProps = getters.getUserPropsForAnalytics()
      FeatureFlagService.setPersonPropertiesForFlags(personProps)
      AnalyticsService.identify(user.id, personProps)
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
    avatar(_state, getters) {
      if (getters.showAmbassadorTitle) {
        return { component: AmbassadorIcon, id: 'ambassador-avatar' }
      } else if (getters.isVolunteer) {
        return { component: VolunteerIcon, id: 'volunteer-avatar' }
      } else if (getters.isStudent) {
        return { component: StudentIcon, id: 'student-avatar' }
      } else if (getters.isTeacher) {
        return { component: TeacherIcon, id: 'teacher-avatar' }
      }
      return ''
    },

    firstName: (state, getters) =>
      state.user.firstname || Case.capital(getters.userType),
    lastName: (state) => state.user.lastname,
    fullName: (state, getters) =>
      [getters.firstName, getters.lastName].join(' '),

    userType: (state) => state.user.userType,
    userRoles: (state) =>
      state.user.roleContext?.roles ?? [state.user.userType],
    isVolunteer: (state) => isVolunteerUserType(state.user.userType),
    isStudent: (state) => isStudentUserType(state.user.userType),
    isTeacher: (state) => isTeacherUserType(state.user.userType),
    isAdmin: (state) => state.user.isAdmin,
    isStudentVolunteer: (_state, getters) =>
      getters.userRoles.includes('student') &&
      getters.userRoles.includes('volunteer'),
    hasStudentRole: (_state, getters) => getters.userRoles.includes('student'),
    hasVolunteerRole: (_state, getters) =>
      getters.userRoles.includes('volunteer'),
    hasTeacherRole: (_state, getters) => getters.userRoles.includes('teacher'),
    hasAmbassadorRole: (_state, getters) =>
      getters.userRoles.includes('ambassador'),
    isVolunteerProgramAmbassador: (_state, getters) =>
      getters.hasAmbassadorRole && getters.hasVolunteerRole,
    isVolunteerReferralAmbassador: (state) =>
      state.user?.numReferredVolunteers &&
      state.user?.numReferredVolunteers >= 5,
    isAmbassador: (_state, getters) =>
      getters.isVolunteerReferralAmbassador ||
      getters.isVolunteerProgramAmbassador,
    showAmbassadorTitle: (state, getters, _rootState, rootGetters) => {
      return (
        rootGetters['featureFlags/isShowAmbassadorTitleEnabled'] &&
        getters.hasVolunteerRole &&
        getters.isAmbassador
      )
    },

    isAuthenticated: (state) => !!(state.user && state.user.id),

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

    roleInCurrentSession: (state) => {
      if (!state.session) return undefined
      const studentId = state.session.student.id
      return studentId === state.user.id ? 'student' : 'volunteer'
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

    isSessionEnding: (state) => {
      return state.session.isEnding
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
        !getters.hasCertification &&
        !!state.user.phone
      )
    },

    isInStudentVolunteerVerifyFlow: (state, getters) => {
      return (
        getters.isVolunteer && // in volunteer mode
        getters.userRoles.includes('student') && // but also a student account
        (!state.user.phone || !state.user.phoneVerified) // unverified phone number
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

    // This getter returns a function to help bypass Vuex's caching.
    // We can ensure that the latest user properties are computed each time,
    // preventing any caching issues that might interfere
    // with the dynamic loading of feature flags
    getUserPropsForAnalytics: (state, getters, rootState) => () => {
      let userProps = {
        ucId: state.user.id,
        userType: state.user.userType,
        createdAt: state.user.createdAt,
        totalSessions: state.user.pastSessions.length,
        banType: state.user.banType,
        isTestUser: state.user.isTestUser,
        hasStudentRole: getters.hasStudentRole,
        hasVolunteerRole: getters.hasVolunteerRole,
        hasTeacherRole: getters.hasTeacherRole,
        occupation: state.user.occupation?.join(', '),
      }
      userProps.partner =
        state.user.volunteerPartnerOrg ?? state.user.studentPartnerOrg
      if (!userProps.partner) delete userProps.partner

      if (state.user.isSchoolPartner) {
        userProps.schoolPartner = state.user.schoolName
      }

      if (state.user?.ratings) {
        // Old schema for accounts w/ only one role (student or volunteer)
        userProps.averageRatingSelfReported =
          state.user.ratings?.selfReportedRating?.average ?? 0
        userProps.averageRatingPartnerReported =
          state.user.ratings?.partnerReportedRating?.average ?? 0
        userProps.totalSelfReportedRatings =
          state.user.ratings?.selfReportedRating?.total ?? 0
        userProps.totalPartnerReportedRatings =
          state.user.ratings?.partnerReportedRating?.total ?? 0

        // New schema for accounts w/ multiple roles
        userProps.averageSelfReportedStudentRating =
          state.user.ratings?.selfReportedStudentRating?.average ?? 0
        userProps.totalSelfReportedStudentRatings =
          state.user.ratings?.selfReportedStudentRating?.total ?? 0
        userProps.averageSelfReportedVolunteerRating =
          state.user.ratings?.selfReportedVolunteerRating?.average ?? 0
        userProps.totalSelfReportedVolunteerRatings =
          state.user.ratings?.selfReportedVolunteerRating?.total ?? 0
        userProps.averagePartnerReportedStudentRating =
          state.user.ratings?.partnerReportedStudentRating?.average ?? 0
        userProps.totalPartnerReportedStudentRatings =
          state.user.ratings?.partnerReportedStudentRating?.total ?? 0
        userProps.averagePartnerReportedVolunteerRating =
          state.user.ratings?.partnerReportedVolunteerRating?.average ?? 0
        userProps.totalPartnerReportedVolunteerRatings =
          state.user.ratings?.partnerReportedVolunteerRating?.total ?? 0
      }

      // Add role-specific props
      if (getters.hasVolunteerRole) {
        userProps.onboarded = state.user.isOnboarded
        userProps.approved = state.user.isApproved

        const certificationInfo = Object.entries(
          state.user.certifications ?? {}
        ).reduce((acc, [subject, quizInfo]) => {
          acc[subject] = quizInfo.passed
          return acc
        }, {})

        const hasSubjectCertification = getters.hasCertification
        userProps = {
          ...userProps,
          ...certificationInfo,
        }
        userProps.hasSubjectCertification = hasSubjectCertification
      }
      if (getters.hasStudentRole) {
        userProps.gradeLevel = state.user.gradeLevel

        if (rootState.featureFlags.eligibleForChooseTutorType) {
          userProps.eligibleForChooseTutorType =
            rootState.featureFlags.eligibleForChooseTutorType
        }
      }

      if (getters.hasStudentRole || getters.hasTeacherRole) {
        userProps.usesGoogle = !!state.user.usesGoogle
        userProps.usesClever = !!state.user.usesClever
        userProps.usesClassLink = !!state.user.usesClassLink
      }

      // Although 'fallIncentiveEnrollmentAt' is only relevant to student users,
      // we apply it to all users to override any existing values in the merged PostHog
      // Person profiles. This allows for consistent rollout for the Fall Incentive program
      userProps.fallIncentiveEnrollmentAt =
        rootState.productFlags.flags.fallIncentiveEnrollmentAt ?? null

      return userProps
    },

    hasUnreadProgressOverviewReports: (state) => {
      return state.progressReportOverviewSubjectStats.some(
        (subject) => subject.totalUnreadReports > 0
      )
    },

    showNationalPhoneNumbersOnly: (
      _state,
      getters,
      _rootState,
      rootGetters
    ) => {
      return (
        getters.isStudent &&
        rootGetters['featureFlags/isNationalStudentPhoneEnabled']
      )
    },

    banType: (state) => {
      return state.user?.banType ?? null
    },
  },
}
