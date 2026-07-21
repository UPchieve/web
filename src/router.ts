import {
  createRouter,
  createWebHistory,
  type NavigationGuard,
  type NavigationGuardNext,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from 'vue-router'
import store from './store'
const AdminView = () => import('./views/Admin/index.vue')
const AdminCleverRoster = () => import('./views/Admin/AdminCleverRoster.vue')
const AdminNTHS = () => import('./views/Admin/AdminNTHS.vue')
const AdminEditSchool = () => import('./views/Admin/AdminEditSchool.vue')
const AdminIneligibleStudents = () =>
  import('./views/Admin/AdminIneligibleStudents.vue')
const AdminPendingVolunteers = () =>
  import('./views/Admin/AdminPendingVolunteers.vue')
const AdminSchoolDetail = () => import('./views/Admin/AdminSchoolDetail.vue')
const AdminSchools = () => import('./views/Admin/AdminSchools.vue')
const AdminSessionDetail = () => import('./views/Admin/AdminSessionDetail.vue')
const AdminSessionNotifications = () =>
  import('./views/Admin/AdminSessionNotifications.vue')
const AdminSessionReview = () => import('./views/Admin/AdminSessionReview.vue')
const AdminSessions = () => import('./views/Admin/AdminSessions.vue')
const AdminStudentReports = () =>
  import('./views/Admin/AdminStudentReports.vue')
const AdminUserDetail = () => import('./views/Admin/AdminUserDetail.vue')
const AdminUsers = () => import('./views/Admin/AdminUsers.vue')
const AdminVolunteerReports = () =>
  import('./views/Admin/AdminVolunteerReports.vue')
const AdminZipCodes = () => import('./views/Admin/AdminZipCodes.vue')
const AdminRosterStudents = () =>
  import('./views/Admin/AdminRosterStudents.vue')
const VolunteerCoverage = () => import('./views/Admin/VolunteerCoverage.vue')
const BackgroundInfoView = () => import('./views/BackgroundInfoView.vue')
const CalendarView = () => import('./views/CalendarView.vue')
const ContactView = () => import('./views/ContactView.vue')
const DashboardView = () => import('./views/DashboardView/index.vue')
const FavoriteCoachesView = () => import('./views/FavoriteCoachesView.vue')
const FeedbackView = () => import('./views/FeedbackView.vue')
const JoinClassView = () => import('./views/JoinClassView.vue')
const JoinNTHSGroupView = () => import('./views/JoinNTHSGroupView.vue')
const LoginView = () => import('./views/LoginView.vue')
const LogoutView = () => import('./views/LogoutView.vue')
const ProfileView = () => import('./views/ProfileView/index.vue')
const QuizView = () => import('./views/QuizView/index.vue')
const ReferenceView = () => import('./views/ReferenceView.vue')
const ReferFriendsView = () => import('./views/ReferFriendsView.vue')
const ResetPasswordView = () => import('./views/ResetPasswordView.vue')
const ResourcesView = () => import('./views/ResourcesView.vue')
const ReviewMaterialsView = () => import('./views/ReviewMaterialsView.vue')
const SessionView = () => import('./views/SessionView/index.vue')
const SetPasswordView = () => import('./views/SetPasswordView.vue')
const SignupView = () => import('./views/SignupView/index.vue')
const StudentAssignmentView = () => import('./views/StudentAssignmentView.vue')
const StudentClassesView = () => import('./views/StudentClassesView.vue')
const StudentPartnerSignupView = () =>
  import('./views/SignupView/StudentPartnerSignupView.vue')
const TrainingView = () => import('./views/TrainingView.vue')
const TrainingCourseView = () => import('@/views/TrainingCourseView/index.vue')
const VerificationView = () => import('./views/VerificationView/index.vue')
const VolunteerPartnerSignupView = () =>
  import('./views/VolunteerPartnerSignupView.vue')
const SessionHistoryView = () => import('./views/SessionHistoryView.vue')
const SessionRecapView = () => import('./views/SessionRecapView.vue')
const AdminTestAudience = () => import('./views/Admin/AdminTestAudience.vue')
const WelcomePage = () => import('./views/WelcomePage.vue')
const ProgressReportsOverviewView = () =>
  import('./views/ProgressReportsOverviewView.vue')
const ProgressReportsOverviewSubjectView = () =>
  import('./views/ProgressReportsOverviewSubjectView.vue')
const TeacherDashboardView = () =>
  import('./views/DashboardView/TeacherDashboard/index.vue')
const TeacherClassDetailsView = () =>
  import('./views/DashboardView/TeacherDashboard/ClassDetailsView.vue')
const TeacherStudentDetailsView = () =>
  import('./views/DashboardView/TeacherDashboard/StudentDetailsView.vue')
const TeacherAssignmentView = () =>
  import('./views/DashboardView/TeacherDashboard/AssignmentView.vue')
const CleverSigninInstructions = () =>
  import('./views/SignupView/CleverSigninInstructions.vue')
const RewardsView = () => import('./views/RewardsView.vue')
const SurveysView = () => import('./views/SurveysView.vue')
const SocialMediaSharingInstructions = () =>
  import('@/views/DashboardView/VolunteerDashboard/SocialMediaSharingInstructions.vue')
const JourneysView = () => import('./views/JourneysView.vue')
const VolunteerHoursView = () => import('@/components/VolunteerHours.vue')
const NTHSGroupsView = () => import('./views/NTHS/NTHSGroupsView.vue')
const NTHSCreateGroupView = () => import('./views/NTHS/NTHSCreateGroupView.vue')
const NTHSGroupDashboardView = () =>
  import('./views/NTHS/Tabs/NTHSGroupDashboardView.vue')
const NTHSManageTeamView = () =>
  import('./views/NTHS/Tabs/NTHSManageTeamView.vue')
const NTHSSettingsView = () => import('./views/NTHS/Tabs/NTHSSettingsView.vue')
const NTHSApplicationView = () => import('@/views/NTHS/NTHSApplicationView.vue')
const NTHSApplicationPending = () =>
  import('./views/NTHS/NTHSApplicationPending.vue')
const StandaloneBotChatView = () =>
  import('./views/BotConversationsView/StandaloneBotChatView.vue')
const Totp = () => import('./views/Totp/index.vue')
const TotpEnroll = () => import('./views/Totp/Enroll.vue')

import {
  shouldGoToApply,
  shouldGoToCreate,
  shouldGoToGroup,
  shouldGoToPending,
} from './views/NTHS/nths-route-helpers'
import Gleap from 'gleap'
import NetworkService, { axiosInstance } from './services/NetworkService'
import AnalyticsService from './services/AnalyticsService'
import UserService from './services/UserService'
import { UserType } from '@/services/SignUpService/types'
import { beforeEnter as studentBeforeEnter } from '@/services/SignUpService/StudentSignUpService'
import { beforeEnter as teacherBeforeEnter } from '@/services/SignUpService/TeacherSignUpService'
import { beforeEnter as volunteerBeforeEnter } from '@/services/SignUpService/VolunteerSignUpService'
import Case from 'case'
import { quizRoute } from '@/utils/quiz-route'
import { getStatus } from '@/services/AuthService'
import LoggerService from './services/LoggerService'
import { EVENTS } from './consts'
import CoachModeTransition from '@/views/CoachModeTransition.vue'

const autoflowRedirect: NavigationGuard = (_to, _from, next) => {
  if (store.getters['user/isAutoFlowUser']) next('/welcome')
  else next()
}
const switchToVolunteerOrCancel: NavigationGuard = async (_to, _from, next) => {
  if (store.getters['user/isVolunteer']) {
    next() // already volunteer, continue
  } else if (store.getters['user/hasVolunteerRole']) {
    try {
      await UserService.switchActiveRole({ $store: store }, 'volunteer')
      next() // switch and continue
    } catch {
      next('/dashboard')
    }
  } else {
    next('/dashboard') // not a volunteer at all, prevent nav
  }
}
const switchToTeacherOrCancel: NavigationGuard = async (_to, _from, next) => {
  if (store.getters['user/isTeacher']) {
    next()
  } else {
    next('/dashboard')
  }
}

const ensureActiveRoleMatchesSessionRole: NavigationGuard = async (
  _to,
  _from,
  next
) => {
  if (typeof store.getters['user/roleInCurrentSession'] === 'undefined') {
    await store.dispatch('user/fetchSession')
  }

  if (
    store.getters['user/roleInCurrentSession'] &&
    store.getters['user/userType'] !==
      store.getters['user/roleInCurrentSession']
  ) {
    await UserService.switchActiveRole(
      { $store: store },
      store.getters['user/roleInCurrentSession']
    )
  }
  next()
}

/**
 * Locked alias subjects (e.g. apChemistry) reuse another subject's quiz and
 * have none of their own, so `/training/ap-chemistry/quiz` 500s. Redirect to
 * the reused quiz (`unlockQuizName`) so it loads regardless of entry point.
 */
const redirectQuizAlias: NavigationGuard = async (to, _from, next) => {
  if (!store.getters['subjects/allSubtopicNames'].length) {
    await store.dispatch('subjects/getSubjects')
  }
  const category = Case.camel(to.params.category as string)
  const quizSubject = store.getters['subjects/quizSubjectToUnlock'](category)
  if (quizSubject !== category) {
    next({ path: quizRoute(quizSubject), replace: true })
  } else {
    next()
  }
}

async function getAuthStatus(
  to: RouteLocationNormalized,
  isBlockingRoute?: boolean
) {
  try {
    const isAuthenticated = store.getters['user/isAuthenticated']
    // When we are already authenticated, let's re-fetch in the background
    // that way we don't block the route transition.
    if (isAuthenticated && !isBlockingRoute) {
      getStatus().then(async ({ data }) => {
        if (data.authenticated) {
          store.dispatch('user/fetchUser')
        } else {
          store.commit('user/setUser', {})
          router.push({
            path: '/login',
            query: {
              redirect: to.fullPath,
              401: 'true',
            },
          })
        }
      })
      return { authenticated: true }
    } else {
      // When we are not authenticated or we definitely want to know the status of
      //  the user before navigating to the page (like admin pages), block route
      // transitions until we hear back.
      const { data } = await getStatus()
      if (data.authenticated) {
        await store.dispatch('user/fetchUser')
      }
      return data
    }
  } catch (e) {
    LoggerService.noticeError(e)
    return {
      authenticated: false,
    }
  }
}
const VOLUNTEER_SIDEBAR_LINKED_VIEWS = [
  ProfileView,
  TrainingView,
  CalendarView,
  SessionHistoryView,
  SessionView,
]
const STUDENT_SIDEBAR_LINKED_VIEWS = [
  ProfileView,
  SessionHistoryView,
  ProgressReportsOverviewView,
  SessionView,
  FavoriteCoachesView,
  StudentClassesView,
  JourneysView,
]
const TEACHER_SIDEBAR_LINKED_VIEWS = [ProfileView, TeacherDashboardView]

function preloadViews({
  volunteer,
  student,
  teacher,
  admin,
}: {
  volunteer?: Array<() => Promise<unknown>>
  student?: Array<() => Promise<unknown>>
  teacher?: Array<() => Promise<unknown>>
  admin?: Array<() => Promise<unknown>>
}) {
  const isVolunteer = store.getters['user/isVolunteer']
  const isStudent = store.getters['user/isStudent']
  const isTeacher = store.getters['user/isTeacher']
  const isAdmin = store.getters['user/isAdmin']

  if (isVolunteer && volunteer?.length) volunteer.forEach((fn) => fn())
  if (isStudent && student?.length) student.forEach((fn) => fn())
  if (isTeacher && teacher?.length) teacher.forEach((fn) => fn())
  if (isAdmin && admin?.length) admin.forEach((fn) => fn())
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: { render: () => null },
    beforeEnter: (
      to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      getAuthStatus(to)
        .then(({ authenticated }) => {
          if (authenticated) {
            if (store.getters['user/isAutoFlowUser']) {
              return next('/welcome')
            }
            next('/dashboard')
          } else {
            next('/login')
          }
        })
        .catch(() => {})
    },
  },
  {
    path: '/contact',
    name: 'ContactView',
    component: ContactView,
    meta: {
      authOptional: true,
      preloadViews: {
        student: STUDENT_SIDEBAR_LINKED_VIEWS,
        volunteer: VOLUNTEER_SIDEBAR_LINKED_VIEWS,
        teacher: TEACHER_SIDEBAR_LINKED_VIEWS,
      },
    },
    beforeEnter: (
      _to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      const instance = Gleap.getInstance()
      if (instance.initialized) {
        try {
          Gleap.open()
          if (!Gleap.isOpened) throw new Error('Unable to open Gleap.')
          store.commit('app/setIsLoading', false)
        } catch {
          next()
        }
      } else {
        next()
      }
    },
  },
  {
    path: '/legal',
    name: 'LegalView',
    component: { render: () => null },
    beforeEnter: () => {
      if (typeof window !== 'undefined')
        window.location.href = 'https://upchieve.org/legal'
    },
  },
  {
    path: '/login',
    name: 'LoginView',
    component: LoginView,
    meta: {
      loggedOutOnly: true,
      hideNavigation: true,
      preloadViews: {
        student: STUDENT_SIDEBAR_LINKED_VIEWS,
        teacher: TEACHER_SIDEBAR_LINKED_VIEWS,
        volunteer: VOLUNTEER_SIDEBAR_LINKED_VIEWS,
      },
    },
  },
  {
    path: '/logout',
    name: 'LogoutView',
    component: LogoutView,
    meta: { hideNavigation: true },
  },
  {
    path: '/reference-form/:referenceId',
    name: 'ReferenceView',
    component: ReferenceView,
    meta: { authOptional: true, hideNavigation: true },
  },
  {
    path: '/join-class/:classCode?',
    name: 'JoinClassView',
    component: JoinClassView,
    meta: { authOptional: true, hideNavigation: true },
  },
  {
    path: '/join-team/:inviteCode?',
    name: 'JoinNTHSGroupView',
    component: JoinNTHSGroupView,
    meta: { authOptional: true, hideNavigation: true },
  },
  {
    path: '/signup',
    name: 'Signup',
    redirect: '/sign-up',
  },
  {
    path: '/sign-up/:userType?/:step?',
    name: 'SignupView',
    component: SignupView,
    meta: { loggedOutOnly: true, hideNavigation: true },
    props: true,
    beforeEnter: async (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      switch (to.params.userType) {
        case UserType.student:
          return studentBeforeEnter(to, from, next)
        case UserType.teacher:
          return teacherBeforeEnter(to, from, next)
        case UserType.volunteer:
          return volunteerBeforeEnter(to, from, next)
        default:
          // Unknown userType.
          delete to.params.userType
          delete to.params.step
          return next()
      }
    },
  },
  {
    path: '/signup/student/:partnerId',
    name: 'StudentPartnerSignupView',
    component: StudentPartnerSignupView,
    meta: { loggedOutOnly: true, hideNavigation: true },
  },
  {
    path: '/signup/volunteer/:partnerId',
    name: 'VolunteerPartnerSignupView',
    component: VolunteerPartnerSignupView,
    meta: { loggedOutOnly: true, hideNavigation: true },
    beforeEnter: async (
      to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      if (store.getters['featureFlags/isNewVolunteerSignUpFlowEnabled']) {
        const partner = to.params.partnerId
        next(`sign-up/volunteer?partnerId=${partner}`)
      } else {
        next()
      }
    },
  },
  {
    path: '/sessions/history',
    name: 'SessionHistoryView',
    component: SessionHistoryView,
    meta: {
      protected: true,
      preloadViews: {
        volunteer: [SessionRecapView, ...VOLUNTEER_SIDEBAR_LINKED_VIEWS],
        student: [SessionRecapView, ...STUDENT_SIDEBAR_LINKED_VIEWS],
      },
    },
  },
  {
    path: '/referral/:referredByCode',
    name: 'Referred By',
    redirect: (to) => `/sign-up?referral=${to.params.referredByCode}`,
  },
  {
    path: '/resetpassword',
    name: 'ResetPasswordView',
    component: ResetPasswordView,
    meta: { hideNavigation: true },
  },
  {
    path: '/setpassword',
    name: 'SetPasswordView',
    component: SetPasswordView,
    meta: { hideNavigation: true },
    props: (route) => ({ token: route.query.token }),
  },
  {
    path: '/dashboard',
    name: 'DashboardView',
    component: DashboardView,
    meta: {
      protected: true,
      preloadViews: {
        volunteer: VOLUNTEER_SIDEBAR_LINKED_VIEWS,
        student: STUDENT_SIDEBAR_LINKED_VIEWS,
        teacher: TEACHER_SIDEBAR_LINKED_VIEWS,
        admin: [AdminView],
      },
    },
    beforeEnter: async (
      to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      if (to.query.inviteCode) {
        localStorage.setItem('joinedTeamCode', String(to.query.inviteCode))
        delete to.query.inviteCode
      }
      if (store.getters['user/isAutoFlowUser']) {
        next('/welcome')
      }
      if (to.query.classCode) {
        localStorage.setItem('joinedClassCode', String(to.query.classCode))
        delete to.query.classCode
        return next(to)
      }

      return next()
    },
  },
  {
    path: '/classes/:classId?',
    name: 'StudentClassesView',
    component: StudentClassesView,
    meta: {
      protected: true,
      preloadViews: {
        student: [StudentAssignmentView, ...STUDENT_SIDEBAR_LINKED_VIEWS],
      },
    },
    props: true,
    beforeEnter: async (
      _to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      if (!store.getters['user/isStudent']) {
        return next('/dashboard')
      }
      return next()
    },
    children: [
      {
        path: 'assignments/:assignmentId',
        name: 'StudentAssignmentView',
        props: true,
        component: StudentAssignmentView,
      },
    ],
  },
  {
    path: '/session/:topic/:subTopic/:sessionId?',
    name: 'SessionView',
    component: SessionView,
    meta: {
      protected: true,
      hideNavigation: true,
      disableComponentReuse: true,
      preloadViews: {
        student: [FeedbackView, ...STUDENT_SIDEBAR_LINKED_VIEWS],
        volunteer: [FeedbackView, ...VOLUNTEER_SIDEBAR_LINKED_VIEWS],
      },
    },
    beforeEnter: [ensureActiveRoleMatchesSessionRole],
  },
  {
    path: '/resources',
    name: 'ResourcesView',
    component: ResourcesView,
    meta: { protected: true },
  },
  {
    path: '/refer-friends',
    name: 'ReferFriendsView',
    component: ReferFriendsView,
    meta: { protected: true },
    beforeEnter: (
      _to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      if (store.getters['featureFlags/isReferFriendsActive']) next()
      else next('/dashboard')
    },
  },
  {
    path: '/feedback/:sessionId',
    name: 'FeedbackView',
    component: FeedbackView,
    meta: { protected: true, hideNavigation: true },
  },
  {
    path: '/verify',
    name: 'VerificationView',
    component: VerificationView,
    meta: { protected: true },
    beforeEnter: (
      to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      getAuthStatus(to)
        .then(({ authenticated }) => {
          if (authenticated && store.getters['user/isVerified']) {
            next('/dashboard')
          } else {
            next()
          }
        })
        .catch(() => {})
    },
  },

  {
    path: '/training',
    name: 'TrainingView',
    component: TrainingView,
    meta: {
      protected: true,
      preloadViews: {
        volunteer: [
          ReviewMaterialsView,
          TrainingCourseView,
          QuizView,
          ...VOLUNTEER_SIDEBAR_LINKED_VIEWS,
        ],
      },
    },
    beforeEnter: [autoflowRedirect, switchToVolunteerOrCancel],
  },
  {
    path: '/training/review/:category',
    name: 'ReviewMaterialsView',
    component: ReviewMaterialsView,
    meta: { protected: true },
    beforeEnter: [autoflowRedirect, switchToVolunteerOrCancel],
  },
  {
    path: '/training/:category/quiz',
    name: 'QuizView',
    component: QuizView,
    meta: { protected: true },
    beforeEnter: redirectQuizAlias,
  },
  {
    path: '/training/course/:courseKey',
    name: 'TrainingCourseView',
    component: TrainingCourseView,
    meta: { protected: true },
    beforeEnter: [switchToVolunteerOrCancel],
  },
  {
    path: '/profile',
    name: 'ProfileView',
    component: ProfileView,
    meta: {
      protected: true,
      preloadViews: {
        volunteer: [ResetPasswordView, ...VOLUNTEER_SIDEBAR_LINKED_VIEWS],
        teacher: [ResetPasswordView, ...TEACHER_SIDEBAR_LINKED_VIEWS],
        student: [ResetPasswordView, ...STUDENT_SIDEBAR_LINKED_VIEWS],
      },
    },
    beforeEnter: autoflowRedirect,
  },
  {
    path: '/favorite-coaches',
    name: 'FavoriteCoachesView',
    component: FavoriteCoachesView,
    meta: {
      protected: true,
      preloadViews: { student: STUDENT_SIDEBAR_LINKED_VIEWS },
    },
  },
  {
    path: '/calendar',
    name: 'CalendarView',
    component: CalendarView,
    meta: {
      protected: true,
      preloadViews: { volunteer: VOLUNTEER_SIDEBAR_LINKED_VIEWS },
    },
    beforeEnter: [autoflowRedirect, switchToVolunteerOrCancel],
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/volunteer-coverage',
    name: 'VolunteerCoverage',
    component: VolunteerCoverage,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/sessions',
    name: 'AdminSessions',
    component: AdminSessions,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/sessions/review',
    name: 'AdminSessionReview',
    component: AdminSessionReview,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/sessions/:sessionId',
    name: 'AdminSessionDetail',
    component: AdminSessionDetail,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/sessions/:sessionId/notifications',
    name: 'AdminSessionNotifications',
    component: AdminSessionNotifications,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: AdminUsers,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/users/:userId',
    name: 'AdminUserDetail',
    component: AdminUserDetail,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/volunteers/review',
    name: 'AdminPendingVolunteers',
    component: AdminPendingVolunteers,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/ineligible-students',
    name: 'AdminIneligibleStudents',
    component: AdminIneligibleStudents,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/school/edit',
    name: 'AdminEditSchool',
    component: AdminEditSchool,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/school/:schoolId',
    name: 'AdminSchoolDetail',
    component: AdminSchoolDetail,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/schools',
    name: 'AdminSchools',
    component: AdminSchools,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/reports/students',
    name: 'AdminStudentReports',
    component: AdminStudentReports,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/reports/volunteers',
    name: 'AdminVolunteerReports',
    component: AdminVolunteerReports,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/zip-codes',
    name: 'AdminZipCodes',
    component: AdminZipCodes,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/roster-students',
    name: 'AdminRosterStudents',
    component: AdminRosterStudents,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/clever-roster',
    name: 'AdminCleverRoster',
    component: AdminCleverRoster,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/admin/nths',
    name: 'AdminNTHS',
    component: AdminNTHS,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/background-information',
    name: 'BackgroundInfoView',
    component: BackgroundInfoView,
    meta: { protected: true },
  },
  {
    path: '/sessions/:sessionId/recap',
    name: 'SessionRecapView',
    component: SessionRecapView,
    meta: { protected: true },
  },
  {
    path: '/admin/test-audience',
    name: 'AdminTestAudience',
    component: AdminTestAudience,
    meta: { protected: true, requiresAdmin: true },
  },
  {
    path: '/welcome',
    name: 'WelcomePage',
    component: WelcomePage,
    meta: { protected: true, hideNavigation: true },
  },

  {
    path: '/sessions/progress',
    name: 'ProgressReportsOverview',
    component: ProgressReportsOverviewView,
    meta: {
      protected: true,
      preloadViews: {
        student: [
          ProgressReportsOverviewSubjectView,
          ...STUDENT_SIDEBAR_LINKED_VIEWS,
        ],
      },
    },
    beforeEnter: async (
      _to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      //Don't capture click event on refresh
      if (_from.path !== '/' && !_from.path.startsWith('/sessions/progress')) {
        AnalyticsService.captureEvent(
          EVENTS.USER_CLICKED_MY_PROGRESS_SIDEBAR_LINK,
          {
            hadUnreadIndicator:
              store.getters['user/hasUnreadProgressOverviewReports'],
          }
        )
      }
      const response =
        await NetworkService.getLatestProgressReportOverviewSubject()
      const subject = response.data
      if (subject) next(`/sessions/progress/${Case.kebab(subject)}`)
      else next()
    },
  },
  {
    path: '/sessions/progress/:subject',
    name: 'ProgressReportsOverviewSubjectView',
    component: ProgressReportsOverviewSubjectView,
    meta: { protected: true },
  },
  {
    path: '/dashboard/teacher',
    name: 'TeacherDashboard',
    component: TeacherDashboardView,
    meta: { protected: true, breadcrumb: 'Classes' },
    beforeEnter: [switchToTeacherOrCancel],
    children: [
      {
        path: 'class/:classId',
        name: 'ClassDetailsView',
        component: TeacherClassDetailsView,
        meta: { breadcrumb: 'Class Details' },
        children: [
          {
            path: 'student/:studentId',
            name: 'StudentDetailsView',
            component: TeacherStudentDetailsView,
            meta: { breadcrumb: 'Student Details' },
          },
        ],
      },
      {
        path: 'class/:classId/assignments',
        name: 'ClassAssignmentsView',
        component: TeacherClassDetailsView,
        meta: { breadcrumb: 'Class Details' },
        children: [
          {
            path: ':assignmentId',
            name: 'AssignmentView',
            component: TeacherAssignmentView,
            meta: { breadcrumb: 'Assignment Details' },
          },
        ],
      },
    ],
  },
  {
    path: '/rewards',
    name: 'RewardsView',
    component: RewardsView,
    meta: { protected: true },
  },
  {
    path: '/surveys/:surveyType',
    name: 'SurveysView',
    component: SurveysView,
    meta: { protected: true },
  },
  {
    path: '/surveys/:surveyType/:surveyId',
    name: 'SurveysView',
    component: SurveysView,
    meta: { protected: true },
  },
  {
    path: '/clever-signin-instructions',
    name: 'CleverSigninInstructions',
    component: CleverSigninInstructions,
    meta: { loggedOutOnly: true, hideNavigation: true },
  },
  {
    path: '/social-media-sharing-instructions',
    name: 'SocialMediaSharingInstructions',
    component: SocialMediaSharingInstructions,
    meta: { hideNavigation: true },
  },
  {
    path: '/journeys',
    name: 'JourneysView',
    component: JourneysView,
    meta: {
      protected: true,
      preloadViews: {
        student: STUDENT_SIDEBAR_LINKED_VIEWS,
      },
    },
  },
  {
    path: '/hour-calculator',
    redirect: '/volunteer-hours',
  },
  {
    path: '/volunteer-hours',
    name: 'VolunteerHoursView',
    component: VolunteerHoursView,
    meta: {
      protected: true,
      preloadViews: {
        student: STUDENT_SIDEBAR_LINKED_VIEWS,
      },
    },
  },
  {
    path: '/groups/apply',
    name: 'NTHSApplicationView',
    component: NTHSApplicationView,
    meta: { protected: true },
    beforeEnter: async (
      _to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      if (await shouldGoToGroup(store)) return next('/groups')
      if (shouldGoToCreate(store)) return next('/groups/create')
      if (shouldGoToPending(store)) return next('/groups/application-pending')
      if (shouldGoToApply(store)) return next()

      return next('/dashboard')
    },
  },
  {
    path: '/groups/application-pending',
    name: 'NTHSApplicationPending',
    component: NTHSApplicationPending,
    meta: { protected: true },
    beforeEnter: async (
      _to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      if (await shouldGoToGroup(store)) return next('/groups')
      if (shouldGoToCreate(store)) return next('/groups/create')
      if (shouldGoToApply(store)) return next('/groups/apply')
      if (shouldGoToPending(store)) return next()

      return next('/dashboard')
    },
  },
  {
    path: '/groups/create',
    name: 'NTHSCreateGroupView',
    component: NTHSCreateGroupView,
    meta: { protected: true },
    beforeEnter: async (
      _to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      if (await shouldGoToGroup(store)) return next('/groups')
      if (shouldGoToApply(store)) return next('/groups/apply')
      if (shouldGoToPending(store)) return next('/groups/application-pending')
      if (shouldGoToCreate(store)) return next()

      return next('/dashboard')
    },
  },

  {
    path: '/groups',
    name: 'NTHSGroupsView',
    component: NTHSGroupsView,
    meta: {
      protected: true,
      preloadViews: {
        volunteer: [
          NTHSGroupDashboardView,
          NTHSManageTeamView,
          NTHSSettingsView,
          NTHSApplicationView,
          NTHSCreateGroupView,
          NTHSApplicationPending,
          ...VOLUNTEER_SIDEBAR_LINKED_VIEWS,
        ],
      },
    },
    beforeEnter: async (
      _to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      if (await shouldGoToGroup(store)) return next()
      if (shouldGoToApply(store)) return next('/groups/apply')
      if (shouldGoToPending(store)) return next('/groups/application-pending')
      if (shouldGoToCreate(store)) return next('/groups/create')

      return next('/dashboard')
    },
    children: [
      {
        path: '/groups/dashboard',
        name: 'NTHSGroupDashboardView',
        component: NTHSGroupDashboardView,
      },
      {
        path: '/groups/manage-team',
        name: 'NTHSManageTeamView',
        component: NTHSManageTeamView,
      },
      {
        path: '/groups/settings',
        name: 'NTHSSettingsView',
        component: NTHSSettingsView,
      },
      { path: '', redirect: '/groups/dashboard' },
    ],
  },
  {
    path: '/ai-tutor-conversations/:conversationId?',
    name: 'StandaloneBotChat',
    component: StandaloneBotChatView,
    meta: { protected: true },
  },
  {
    path: '/totp',
    name: 'Totp',
    component: Totp,
    meta: { protected: true, requiresAdmin: true, hideNavigation: true },
  },
  {
    path: '/totp-enroll',
    name: 'TotpEnroll',
    component: TotpEnroll,
    meta: { protected: true, requiresAdmin: true, hideNavigation: true },
  },
  {
    path: '/building-your-coach-experience',
    name: 'CoachModeTransition',
    component: CoachModeTransition,
    meta: { protected: true, hideNavigation: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'Not Found',
    redirect: '/',
  },
]

/**
 * @todo Consider refactoring this file
 */
const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'active',
  scrollBehavior() {
    return { left: 0, top: 0 }
  },
})

export default router

// Router middleware to check authentication for protected routes.
router.beforeEach(async (to, _from, next) => {
  store.commit('app/setIsLoading', true)
  if (to.matched.some((route) => route.meta.requiresAdmin)) {
    try {
      const { authenticated, isAdmin, totpVerified } = await getAuthStatus(
        to,
        true
      )
      if (!authenticated) {
        return next({
          path: '/login',
          query: {
            redirect: to.fullPath,
          },
        })
      }

      if (!isAdmin) {
        return next('/dashboard')
      } else if (
        !totpVerified &&
        to.fullPath !== '/totp' &&
        to.fullPath !== '/totp-enroll'
      ) {
        return next('/totp')
      } else {
        return next()
      }
    } catch {
      return next('/login')
    }
  } else if (to.matched.some((route) => route.meta.protected)) {
    return getAuthStatus(to)
      .then(({ authenticated }) => {
        if (!authenticated) {
          next({
            path: '/login',
            query: {
              redirect: to.fullPath,
              401: 'true',
            },
          })
        } else if (!store.getters['user/isVerified']) {
          const route = '/verify'
          if (to.path.indexOf(route) !== -1) next()
          else
            next({
              path: route,
              query: { redirect: to.fullPath },
            })
        } else {
          next()
        }
      })
      .catch(() => next('/login'))
  } else if (to.matched.some((route) => route.meta.loggedOutOnly)) {
    return getAuthStatus(to).then(({ authenticated }) => {
      if (authenticated) {
        next('/dashboard')
      } else {
        next()
      }
    })
  } else {
    return next()
  }
})

// Called after each route change
router.afterEach((to, from) => {
  if (to.name !== from.name) {
    if (to.meta.hideNavigation) {
      store.dispatch('app/hideNavigation')
    } else {
      store.dispatch('app/showNavigation')
    }
  }
  store.dispatch('app/modal/hide')

  // check after a route change if there are any waiting, eligible sessions to auto-join
  store.dispatch('americaCountsVolunteer/maybeJoin')

  // Google Analytics.
  // Use typeof to avoid ReferenceError in Vitest
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    const isAuthenticated = store.getters['user/isAuthenticated']
    const gtagDimensions: any = {
      page_title: to.name,
      page_location: window.location.href,
      page_path: to.path,
      is_authenticated: isAuthenticated ? '1' : '0',
    }
    if (isAuthenticated) {
      const userType = store.getters['user/userType']
      gtagDimensions.userType = userType
    }

    // Send page view.
    window.gtag('event', 'page_view', gtagDimensions)
  }
  store.commit('app/setIsLoading', false)
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => preloadViews(to.meta?.preloadViews ?? {}))
  } else {
    setTimeout(() => preloadViews(to.meta?.preloadViews ?? {}), 200)
  }
  store.commit('app/setFromRoute', from.path)
})

// If endpoint returns 401, redirect to login (except for requests to get user or user's
// session)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const is401 = error.request.status === 401
    const isAuthenticatedRoute =
      error.request.responseURL.indexOf('/api/') !== -1

    const isGetUserAttempt =
      error.request.responseURL.indexOf('/api/user') !== -1 &&
      error.response.config.method === 'get'

    const isGetSessionAttempt =
      error.request.responseURL.indexOf('/api/session/current') !== -1
    const isGetSubjectsAttempt =
      error.request.responseURL.indexOf('/api/subjects') !== -1

    if (
      is401 &&
      !(isGetUserAttempt || isGetSessionAttempt || isGetSubjectsAttempt) &&
      isAuthenticatedRoute
    ) {
      router
        .push(`login/?401=true&redirect=${router.currentRoute.value.path}`)
        .catch((err) => {
          LoggerService.noticeError(
            err,
            'Could not navigate to login page after 401 error'
          )
        })
    }

    const is403 = error.request.status === 403
    const redirect = error.response.data.redirect
    if (is403 && redirect) {
      router.push({
        path: redirect,
        query: { redirect: router.currentRoute.value.fullPath },
      })
    }

    return Promise.reject(error)
  }
)
