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
import { minutesInMs } from '@/utils/time-utils'
import type {
  CurrentSessionPublic,
  SessionMessage,
  PendingMessage,
  UserMessage,
} from '@/types/sessions'
import type { ActionContext } from 'vuex'
import type { RootGetters, RootState } from '@/store/index'
import type { Uuid } from '@/types/shared'

export type SessionState = Omit<CurrentSessionPublic, 'messages'> & {
  messages: SessionMessage[]
  pendingMessages: PendingMessage[]
}

export type UserStoreState = {
  user: Record<string, any>
  // TODO: Add a union for `null`. We'll start moving to `null`
  // instead of an empty object
  session: SessionState | Record<string, never>
  recapSession: Record<string, any>
  isFirstDashboardVisit: boolean
  presessionSurvey: Record<string, any>
  unreadChatMessageIndices: number[]
  chatScrolledToMessageIndex: number | null
  hadASession: boolean
  prevSessionSubject: string
  progressReportOverviewSubjectStats: Array<any>
  latestProgressReportOverview: Record<string, any>
  sessionIsEnding: boolean
  hasSharedMilestone: boolean
  progressReportIntervalId: number | null
  hasUnreadDMs: boolean
  sessionsWithUnreadDMs: string[]
  fetchingSessionPromise: null | Promise<Record<string, never>>
}

type UserStoreGetterValues = {
  firstName: string
  lastName: string
  userType: string
  userRoles: string[]
  isVolunteer: boolean
  isStudent: boolean
  isTeacher: boolean
  hasStudentRole: boolean
  hasVolunteerRole: boolean
  hasTeacherRole: boolean
  isAmbassador: boolean
  hasAmbassadorRole: boolean
  showAmbassadorTitle: boolean
  isVolunteerReferralAmbassador: boolean
  isVolunteerProgramAmbassador: boolean
  getUserPropsForAnalytics: () => Record<string, unknown>
  sessionsWithUnreadDMs: string[]
  hasUnreadDMs: boolean
}

type UserActionContext = Omit<
  ActionContext<UserStoreState, RootState>,
  'getters' | 'rootGetters'
> & {
  getters: UserStoreGetterValues
  rootGetters: RootGetters
}

export default {
  namespaced: true,
  state: {
    user: {},
    session: {} as Record<string, never>,
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
    hasSharedMilestone: false,
    progressReportIntervalId: null,
    hasUnreadDMs: false,
    sessionsWithUnreadDMs: [],
    fetchingSessionPromise: null,
  } as UserStoreState,
  mutations: {
    setUser: (state: UserStoreState, user = {}) => (state.user = user),

    updateUser: (state: UserStoreState, user = {}) => {
      state.user = user
    },

    // TODO: Move session related stuff to session store.
    setSession: (
      state: UserStoreState,
      session: UserStoreState['session'] = {} as Record<string, never>
    ) => (state.session = session),
    setRecapSession: (state: UserStoreState, session = {}) =>
      (state.recapSession = session),
    // For live voice chat message.
    // TODO: Make that more clear.
    addPendingMessage: (state: UserStoreState, message: PendingMessage) => {
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
    removePendingMessage: (state: UserStoreState, message: PendingMessage) => {
      if (message)
        state.session.pendingMessages =
          state.session.pendingMessages?.filter(
            (m: PendingMessage) => m?.msgId !== message.msgId
          ) ?? []
    },
    addMessage: (state: UserStoreState, message: UserMessage) => {
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

    setAvailability: (state: UserStoreState, availability) => {
      if (availability) {
        state.user.availability = availability
      }
    },

    setTimezone: (state: UserStoreState, timezone: string) => {
      if (timezone) {
        state.user.timezone = timezone
      }
    },

    setIsFirstDashboardVisit: (
      state: UserStoreState,
      isFirstDashboardVisit: boolean
    ) => {
      state.isFirstDashboardVisit = isFirstDashboardVisit
    },

    setPresessionSurvey: (state: UserStoreState, presessionSurvey = {}) =>
      (state.presessionSurvey = presessionSurvey),

    markChatMessageUnread: (state: UserStoreState, index: number) => {
      if (typeof index === 'number') {
        state.unreadChatMessageIndices.push(index)
      }
    },

    markChatMessageRead: (state: UserStoreState, index: number) => {
      if (typeof index === 'number') {
        state.unreadChatMessageIndices = state.unreadChatMessageIndices.filter(
          (v) => v !== index
        )
      }
    },

    markChatMessagesRead: (state: UserStoreState, indices: number[]) => {
      if (indices && indices.length > 0) {
        state.unreadChatMessageIndices = state.unreadChatMessageIndices.filter(
          (v) => indices.indexOf(v) === -1
        )
      }
    },

    clearUnreadChatMessages: (state: UserStoreState) => {
      state.unreadChatMessageIndices = []
    },

    scrollChatToMessage: (state: UserStoreState, index: number) => {
      if (typeof index === 'number') {
        state.chatScrolledToMessageIndex = index
      }
    },

    clearChatScrolledToMessageIndex: (state: UserStoreState) => {
      state.chatScrolledToMessageIndex = null
    },

    setHadASession: (state: UserStoreState, flag: boolean) => {
      state.hadASession = flag
    },

    setPrevSessionSubject: (state: UserStoreState, subject: string) => {
      state.prevSessionSubject = subject
    },

    setProgressReportOverviewSubjectStats: (state: UserStoreState, stats) => {
      state.progressReportOverviewSubjectStats = stats
    },
    setSessionIsEnding: (state: UserStoreState, isEnding: boolean) => {
      state.sessionIsEnding = isEnding
    },
    setHasSharedMilestone: (
      state: UserStoreState,
      hasSharedMilestone: boolean
    ) => {
      state.hasSharedMilestone = hasSharedMilestone
    },

    setProgressReportIntervalId: (
      state: UserStoreState,
      intervalId: number
    ) => {
      state.progressReportIntervalId = intervalId
    },

    setSessionsWithUnreadDMs: (state: UserStoreState, sessionIds: string[]) => {
      state.sessionsWithUnreadDMs = sessionIds
    },
    setFetchSessionPromise: (
      state: UserStoreState,
      p: Promise<Record<string, never>> | null
    ) => {
      state.fetchingSessionPromise = p
    },
  },
  actions: {
    fetch: ({ dispatch }: UserActionContext) => {
      dispatch('fetchUser')
      dispatch('fetchSession')
    },

    clear: ({ commit }: UserActionContext) => {
      commit('setUser', {})
      commit('setSession', {})
    },

    fetchUser: ({ commit }: UserActionContext) => {
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

    clearUser: ({ commit }: UserActionContext) => {
      commit('setUser', {})
    },

    fetchSession: ({ state, commit }: UserActionContext) => {
      if (state.user.fetchingSessionPromise)
        return state.user.fetchingSessionPromise
      const p = SessionService.getCurrentSession()
        .then(({ sessionData }) => {
          commit('setSession', sessionData)
        })
        .catch((err) => {
          commit('setSession', {})
          LoggerService.noticeError(err)
        })
        .finally(() => {
          commit('setFetchSessionPromise', null)
        })
      commit('setFetchSessionPromise', p)
      return p
    },

    fetchRecapSessionForDms: async (
      { commit }: UserActionContext,
      sessionId: Uuid
    ) => {
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

    fetchUnreadDMs: async ({ commit }: UserActionContext) => {
      try {
        const response = await NetworkService.checkForUnreadDMs()

        commit('setSessionsWithUnreadDMs', response.data.sessionsWithUnreadDMs)
      } catch (err) {
        LoggerService.noticeError(err)
      }
    },

    clearSession: ({ commit }: UserActionContext) => {
      commit('setSession', {})
      commit('clearUnreadChatMessages')
      commit('clearChatScrolledToMessageIndex')
    },

    updateSession: (
      { commit, dispatch, getters }: UserActionContext,
      sessionData
    ) => {
      commit('setSession', sessionData)
      if (sessionData.endedAt && getters.isVolunteer) {
        dispatch('americaCountsVolunteer/startCooldown', null, {
          root: true,
        })
      }
    },

    updateAvailability: ({ commit }: UserActionContext, availability) => {
      commit('setAvailability', availability)
    },

    updateTimezone: ({ commit }: UserActionContext, timezone: string) => {
      commit('setTimezone', timezone)
    },
    addPendingMessage: (
      { commit }: UserActionContext,
      message: PendingMessage
    ) => {
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
    addMessage: ({ commit }: UserActionContext, message) => {
      commit('removePendingMessage', message)
      commit('addMessage', message)
    },

    firstDashboardVisit: (
      { commit }: UserActionContext,
      isFirstDashboardVisit: boolean
    ) => {
      commit('setIsFirstDashboardVisit', isFirstDashboardVisit)
    },

    addToUser: ({ commit, state, getters }: UserActionContext, data) => {
      const { user } = state
      const updatedUser = { ...user, ...data }
      commit('updateUser', updatedUser)
      // Ensure that properties are up to date with for feature flag evaluation
      const personProps = getters.getUserPropsForAnalytics()
      FeatureFlagService.setPersonPropertiesForFlags(personProps)
      AnalyticsService.identify(user.id, personProps)
    },

    updatePresessionSurvey: ({ commit }: UserActionContext, surveyData) => {
      commit('setPresessionSurvey', surveyData)
    },

    clearPresessionSurvey: ({ commit }: UserActionContext) => {
      commit('setPresessionSurvey', {})
    },

    markChatMessageAsUnread: ({ commit }: UserActionContext, index: number) => {
      commit('markChatMessageUnread', index)
    },

    markChatMessageAsRead: ({ commit }: UserActionContext, index: number) => {
      commit('markChatMessageRead', index)
    },

    markChatMessagesAsRead: (
      { commit }: UserActionContext,
      indices: number[]
    ) => {
      commit('markChatMessagesRead', indices)
    },

    scrollChatToMessage: ({ commit }: UserActionContext, index: number) => {
      commit('scrollChatToMessage', index)
    },

    clearChatScrolledToMessageIndex: ({ commit }: UserActionContext) => {
      commit('clearChatScrolledToMessageIndex')
    },

    updateHadASession: ({ commit }: UserActionContext, flag: boolean) => {
      commit('setHadASession', flag)
    },

    updatePrevSessionSubject: (
      { commit }: UserActionContext,
      subject: string
    ) => {
      commit('setPrevSessionSubject', subject)
    },

    setProgressReportOverviewSubjectStats: (
      { commit }: UserActionContext,
      report
    ) => {
      commit('setProgressReportOverviewSubjectStats', report)
    },

    getProgressReportOverviewSubjectStats: async ({
      commit,
      dispatch,
      state,
      getters,
    }: UserActionContext) => {
      if (getters.isVolunteer) return

      const progressReport = await dispatch('progressReport')
      commit(
        'setProgressReportOverviewSubjectStats',
        progressReport?.data ?? []
      )

      if (state.progressReportIntervalId) {
        clearInterval(state.progressReportIntervalId)
      }

      const progressReportIntervalId = setInterval(async () => {
        const progressReport = await dispatch('progressReport')
        commit(
          'setProgressReportOverviewSubjectStats',
          progressReport?.data ?? []
        )
      }, minutesInMs(3))

      commit('setProgressReportIntervalId', progressReportIntervalId)
    },

    updateProgressReportsReadStatus: async (
      { state, commit }: UserActionContext,
      {
        reportIds,
        subjectName,
      }: { reportIds: Array<string>; subjectName: string }
    ) => {
      try {
        if (reportIds?.length) {
          //don't wait for the response since the DB isn't the source of truth immediately
          NetworkService.updateProgressReportsReadStatus(reportIds)
        }

        commit(
          'setProgressReportOverviewSubjectStats',
          state.progressReportOverviewSubjectStats.map((subjectStats) =>
            subjectStats.subject === subjectName
              ? {
                  ...subjectStats,
                  totalUnreadReports: 0,
                }
              : subjectStats
          )
        )
      } catch (error) {
        LoggerService.noticeError(error.response.data.err)
      }
    },

    addCertification: async (
      { state, dispatch }: UserActionContext,
      { certificationName, certificationInfo }
    ) => {
      const updatedCerts = {
        ...(state.user.certifications ?? {}),
        [certificationName]: certificationInfo,
      }
      await dispatch('addToUser', {
        certifications: updatedCerts,
      })
    },
    progressReport: async () => {
      try {
        const response = await NetworkService.getUnreadProgressReports()
        return response
      } catch (error) {
        LoggerService.noticeError(error.response.data.err)
      }

      return null
    },
  },
  getters: {
    avatar(_state: UserStoreState, getters: UserStoreGetterValues) {
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

    firstName: (state: UserStoreState, getters: UserStoreGetterValues) =>
      state.user.firstname || Case.capital(getters.userType),
    lastName: (state: UserStoreState) => state.user.lastname,
    fullName: (_state: UserStoreState, getters: UserStoreGetterValues) =>
      [getters.firstName, getters.lastName].join(' '),

    userType: (state: UserStoreState) => state.user.userType,
    userRoles: (state: UserStoreState) =>
      state.user.roleContext?.roles ?? [state.user.userType],
    isVolunteer: (state: UserStoreState) =>
      isVolunteerUserType(state.user.userType),
    isStudent: (state: UserStoreState) =>
      isStudentUserType(state.user.userType),
    isTeacher: (state: UserStoreState) =>
      isTeacherUserType(state.user.userType),
    isAdmin: (state: UserStoreState) => state.user.isAdmin,
    isStudentVolunteer: (
      _state: UserStoreState,
      getters: UserStoreGetterValues
    ) =>
      getters.userRoles.includes('student') &&
      getters.userRoles.includes('volunteer'),
    hasStudentRole: (_state: UserStoreState, getters: UserStoreGetterValues) =>
      getters.userRoles.includes('student'),
    hasVolunteerRole: (
      _state: UserStoreState,
      getters: UserStoreGetterValues
    ) => getters.userRoles.includes('volunteer'),
    hasTeacherRole: (_state: UserStoreState, getters: UserStoreGetterValues) =>
      getters.userRoles.includes('teacher'),
    hasAmbassadorRole: (
      _state: UserStoreState,
      getters: UserStoreGetterValues
    ) => getters.userRoles.includes('ambassador'),
    isVolunteerProgramAmbassador: (
      _state: UserStoreState,
      getters: UserStoreGetterValues
    ) => getters.hasAmbassadorRole && getters.hasVolunteerRole,
    isVolunteerReferralAmbassador: (state: UserStoreState) =>
      state.user?.numReferredVolunteers &&
      state.user?.numReferredVolunteers >= 5,
    isAmbassador: (_state: UserStoreState, getters: UserStoreGetterValues) =>
      getters.isVolunteerReferralAmbassador ||
      getters.isVolunteerProgramAmbassador,
    showAmbassadorTitle: (
      state: UserStoreState,
      getters: UserStoreGetterValues,
      _rootState: RootState,
      rootGetters: RootGetters
    ) => {
      return (
        rootGetters['featureFlags/isShowAmbassadorTitleEnabled'] &&
        getters.hasVolunteerRole &&
        getters.isAmbassador
      )
    },

    isAuthenticated: (state: UserStoreState) => !!(state.user && state.user.id),

    isVerified: (state: UserStoreState) => state.user.verified,

    hasCertification: (state: UserStoreState) => (certKey) => {
      return Object.entries(state.user.certifications).some(
        (certInfo) => certInfo[0] === certKey && certInfo[1].passed
      )
    },

    hasASubjectCertification: (state: UserStoreState) => {
      const certs = Object.assign({}, state.user.certifications)
      // TODO: Eventually clean this up. This is manually excluding all of the non-subject certs.
      // We should have the backend pass whether something is a subject cert or not.
      delete certs.upchieve101
      delete certs.dei
      delete certs.communitySafety
      delete certs.coachingStrategies
      delete certs.academicIntegrity
      return some(certs, { passed: true })
    },

    hasCompletedVolunteerTraining: (state: UserStoreState) => {
      return state.user?.hasCompletedVolunteerTraining ?? false
    },

    hasSelectedAvailability: (state: UserStoreState) =>
      !!state.user.availabilityLastModifiedAt,

    sessionPath: (state: UserStoreState) => {
      const { type, subTopic, _id } = state.session
      const path = `/session/${Case.kebab(type)}/${Case.kebab(subTopic)}/${_id}`

      return path
    },

    sessionPartner: (state: UserStoreState, getters: UserStoreGetterValues) => {
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

    roleInCurrentSession: (state: UserStoreState) => {
      if (!state.session?.id) return undefined
      const studentId = state.session?.student?.id
      return studentId === state.user.id ? 'student' : 'volunteer'
    },

    isSessionAlive: (state: UserStoreState) => {
      // Early exit if the session doesn't exist
      if (!state.session?.createdAt) {
        return false
      }

      // True if the session hasn't ended
      return !state.session.endedAt
    },

    isSessionWaitingForVolunteer: (state: UserStoreState) => {
      // Early exit if the session doesn't exist or has ended
      if (!state.session.createdAt || !!state.session.endedAt) {
        return false
      }

      // True if volunteer hasn't joined
      return !state.session.volunteerJoinedAt
    },

    isSessionMatched: (state: UserStoreState) => {
      return !!state.session?.volunteerJoinedAt
    },

    isSessionEnding: (state: UserStoreState) => {
      return state.sessionIsEnding
    },

    isSessionInProgress: (state: UserStoreState) => {
      // Early exit if the session doesn't exist
      if (!state.session.createdAt) {
        return false
      }

      // True if volunteer has joined and the session hasn't ended
      return !!state.session.volunteerJoinedAt && !state.session.endedAt
    },

    isSessionOver: (state: UserStoreState) => {
      // Early exit if the session doesn't exist
      if (!state.session.createdAt) {
        return false
      }

      // True if the session has ended
      return !!state.session.endedAt
    },

    numberOfUnreadChatMessages: (state: UserStoreState) => {
      return state.unreadChatMessageIndices.length
    },

    isAutoFlowUser: (state: UserStoreState, getters: RootGetters) => {
      return (
        !state.user.isOnboarded &&
        getters.isVolunteer &&
        !getters.hasASubjectCertification &&
        !getters.hasStudentRole
      )
    },

    isQuizStudyMaterialUser: (state: UserStoreState, getters: RootGetters) => {
      return (
        getters.isVolunteer &&
        !state.user.isOnboarded &&
        !getters.hasASubjectCertification
      )
    },

    showDashboardRedesign: (
      _state: UserStoreState,
      getters: UserStoreGetterValues,
      _rootState: RootState,
      rootGetters: RootGetters
    ) => {
      return (
        getters.isStudent && rootGetters['featureFlags/showDashboardRedesign']
      )
    },

    // This getter returns a function to help bypass Vuex's caching.
    // We can ensure that the latest user properties are computed each time,
    // preventing any caching issues that might interfere
    // with the dynamic loading of feature flags
    getUserPropsForAnalytics:
      (
        state: UserStoreState,
        getters: UserStoreGetterValues,
        rootState: RootState
      ) =>
      () => {
        let userProps = {
          ucId: state.user.id,
          userType: state.user.userType,
          createdAt: state.user.createdAt,
          totalSessions: state.user.pastSessions?.length ?? 0,
          banType: state.user.banType,
          isTestUser: state.user.isTestUser,
          hasStudentRole: getters.hasStudentRole,
          hasVolunteerRole: getters.hasVolunteerRole,
          hasTeacherRole: getters.hasTeacherRole,
          occupation: state.user.occupation?.join(', '),
          lastActivityAt: state.user.lastActivityAt,
          gradeLevel: state.user.gradeLevel ?? null,
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

          const hasSubjectCertification = getters.hasASubjectCertification
          userProps = {
            ...userProps,
            ...certificationInfo,
          }
          userProps.hasSubjectCertification = hasSubjectCertification
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

        if (rootState.nths.NTHSGroups.length) {
          userProps.NTHSGroupId = rootState.nths.NTHSGroups[0].groupInfo.id
        }

        return userProps
      },

    hasUnreadProgressOverviewReports: (state: UserStoreState) => {
      return state.progressReportOverviewSubjectStats.some(
        (subject) => subject.totalUnreadReports > 0
      )
    },

    showNationalPhoneNumbersOnly: (
      _state: UserStoreState,
      getters: UserStoreGetterValues,
      _rootState: RootState,
      rootGetters: RootGetters
    ) => {
      return (
        getters.isStudent &&
        rootGetters['featureFlags/isNationalStudentPhoneEnabled']
      )
    },

    banType: (state: UserStoreState) => {
      return state.user?.banType ?? null
    },

    hasUnreadDMs: (_state: UserStoreState, getters: UserStoreGetterValues) =>
      getters.sessionsWithUnreadDMs.length > 0,

    sessionsWithUnreadDMs: (state: UserStoreState) =>
      state.sessionsWithUnreadDMs,
  },
}
