import { createRouter, createWebHistory } from 'vue-router'
import store from './store'
const AdminView = () => import('./views/Admin/index.vue')
const AdminCleverRoster = () => import('./views/Admin/AdminCleverRoster.vue')
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
import BackgroundInfoView from './views/BackgroundInfoView.vue'
import CalendarView from './views/CalendarView.vue'
import ContactView from './views/ContactView.vue'
import DashboardView from './views/DashboardView/index.vue'
import FavoriteCoachesView from './views/FavoriteCoachesView.vue'
import FeedbackView from './views/FeedbackView.vue'
import JoinClassView from './views/JoinClassView.vue'
import LoginView from './views/LoginView.vue'
import LogoutView from './views/LogoutView.vue'
import ProfileView from './views/ProfileView/index.vue'
import QuizView from './views/QuizView/index.vue'
import ReferenceView from './views/ReferenceView.vue'
import ReferFriendsView from './views/ReferFriendsView.vue'
import ResetPasswordView from './views/ResetPasswordView.vue'
import ResourcesView from './views/ResourcesView.vue'
import ReviewMaterialsView from './views/ReviewMaterialsView.vue'
const SessionView = () => import('./views/SessionView/index.vue')
import SetPasswordView from './views/SetPasswordView.vue'
const SignupView = () => import('./views/SignupView/index.vue')
import StudentAssignmentView from './views/StudentAssignmentView.vue'
import StudentClassesView from './views/StudentClassesView.vue'
const StudentPartnerSignupView = () =>
  import('./views/SignupView/StudentPartnerSignupView.vue')
import TrainingView from './views/TrainingView.vue'
const VerificationView = () => import('./views/VerificationView/index.vue')
import VolunteerPartnerSignupView from './views/VolunteerPartnerSignupView.vue'
import SessionHistoryView from './views/SessionHistoryView.vue'
import SessionRecapView from './views/SessionRecapView.vue'
const AdminTestAudience = () => import('./views/Admin/AdminTestAudience.vue')
import WelcomePage from './views/WelcomePage.vue'
const ProgressReportsOverviewView = () =>
  import('./views/ProgressReportsOverviewView.vue')
const ProgressReportsOverviewSubjectView = () =>
  import('./views/ProgressReportsOverviewSubjectView.vue')
import TeacherDashboardView from './views/DashboardView/TeacherDashboard/index.vue'
import CleverSigninInstructions from './views/SignupView/CleverSigninInstructions.vue'
import Gleap from 'gleap'
import NetworkService, { axiosInstance } from './services/NetworkService'
import { UserType } from '@/services/SignUpService'
import { beforeEnter as studentBeforeEnter } from '@/services/SignUpService/StudentSignUpService'
import { beforeEnter as teacherBeforeEnter } from '@/services/SignUpService/TeacherSignUpService'
import { INVALID_CSRF_ERROR } from '@/services/AuthService'
import Case from 'case'
import RewardsView from './views/RewardsView.vue'
import SurveysView from './views/SurveysView.vue'
import CombinedQuizView from '@/views/CombinedQuizView/index.vue'
import { camelCase } from 'lodash-es'
import TrainingViewWrapper from '@/views/Training/TrainingViewWrapper.vue'
import SocialMediaSharingInstructions from '@/views/DashboardView/VolunteerDashboard/SocialMediaSharingInstructions.vue'
import JourneysView from './views/JourneysView.vue'

const VolunteerGoogleSSOSignupStep2View = () =>
  import('./views/SignupView/VolunteerGoogleSSOSignupStep2View.vue')

const autoflowRedirect = (to, from, next) => {
  if (store.getters['user/isAutoFlowUser']) next('/welcome')
  else next()
}

const getUser = () => {
  if (store.getters['user/isAuthenticated']) {
    return new Promise((resolve) => {
      store.dispatch('user/fetchUser')
      resolve()
    })
  } else {
    return store.dispatch('user/fetchUser')
  }
}

const routes = [
  {
    path: '/',
    name: 'Home',
    beforeEnter: (to, from, next) => {
      getUser()
        .then(() => {
          if (store.getters['user/isAuthenticated']) {
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
    meta: { authOptional: true },
    beforeEnter: (to, from, next) => {
      const instance = Gleap.getInstance()
      if (instance.initialized) {
        try {
          Gleap.open()
          if (!Gleap.isOpened) throw new Error('Unable to open Gleap.')
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
    beforeEnter: () => {
      if (typeof window !== 'undefined')
        window.location.href = 'https://upchieve.org/legal'
    },
  },
  {
    path: '/login',
    name: 'LoginView',
    component: LoginView,
    meta: { loggedOutOnly: true, hideNavigation: true },
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
    path: '/signup',
    name: 'Signup',
    beforeEnter: (to, from, next) => {
      next('/sign-up')
    },
  },
  {
    path: '/sign-up/:userType?/:step?',
    name: 'SignupView',
    component: SignupView,
    meta: { loggedOutOnly: true, hideNavigation: true },
    props: true,
    beforeEnter: async (to, from, next) => {
      switch (to.params.userType) {
        case UserType.student:
          return studentBeforeEnter(to, from, next)
        case UserType.teacher:
          return teacherBeforeEnter(to, from, next)
        case UserType.volunteer:
          return next()
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
  },
  {
    path: '/sessions/history',
    name: 'SessionHistoryView',
    component: SessionHistoryView,
    meta: { protected: true },
  },
  {
    path: '/referral/:referredByCode',
    name: 'Referred By',
    beforeEnter: (to, from, next) => {
      const referredByCode = to.params.referredByCode
      next(`/sign-up?referral=${referredByCode}`)
    },
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
    meta: { protected: true },
    beforeEnter: async (to, from, next) => {
      if (store.getters['user/isAutoFlowUser']) {
        next('/welcome')
      }
      if (to.query.classCode) {
        localStorage.setItem('joinedClassCode', to.query.classCode)
        delete to.query.classCode
        return next(to, from)
      }

      return next()
    },
  },
  {
    path: '/classes/:classId?',
    name: 'StudentClassesView',
    component: StudentClassesView,
    meta: { protected: true },
    props: true,
    beforeEnter: async (_to, _from, next) => {
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
    meta: { protected: true, hideNavigation: true },
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
    beforeEnter: (to, from, next) => {
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
    path: '/about-you',
    name: 'VolunteerGoogleSSOSignupStep2View',
    component: VolunteerGoogleSSOSignupStep2View,
    meta: { protected: true },
    beforeEnter: (to, from, next) => {
      getUser()
        .then(() => {
          if (store.getters['user/shouldForceAboutPage']) {
            next()
          } else {
            next('/dashboard')
          }
        })
        .catch(() => {})
    },
  },
  {
    path: '/verify',
    name: 'VerificationView',
    component: VerificationView,
    meta: { protected: true },
    beforeEnter: (to, from, next) => {
      getUser()
        .then(() => {
          if (
            store.getters['user/isVerified'] &&
            !store.getters['user/isInStudentVolunteerVerifyFlow']
          ) {
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
    meta: { protected: true },
    beforeEnter: autoflowRedirect,
  },
  {
    path: '/training/review/:category',
    name: 'ReviewMaterialsView',
    component: ReviewMaterialsView,
    meta: { protected: true },
  },
  {
    path: '/training/:category/quiz',
    name: 'QuizView',
    component: QuizView,
    meta: { protected: true },
  },
  {
    path: '/training/:category/quiz/combined',
    name: 'CombinedQuizView',
    component: CombinedQuizView,
    meta: { protected: true },
    props: (route) => {
      const category = camelCase(route.params.category ?? '')
      return {
        subjectDisplayName: store.state.subjects.subjects[category].displayName,
      }
    },
  },
  {
    path: '/training/course/:courseKey',
    name: 'TrainingCourseView',
    component: TrainingViewWrapper,
    meta: { protected: true },
  },
  {
    path: '/profile',
    name: 'ProfileView',
    component: ProfileView,
    meta: { protected: true },
    beforeEnter: autoflowRedirect,
  },
  {
    path: '/favorite-coaches',
    name: 'FavoriteCoachesView',
    component: FavoriteCoachesView,
    meta: { protected: true },
  },
  {
    path: '/calendar',
    name: 'CalendarView',
    component: CalendarView,
    meta: { protected: true },
    beforeEnter: autoflowRedirect,
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
    meta: { protected: true },
    beforeEnter: async (_to, _from, next) => {
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
    meta: { protected: true },
    children: [
      {
        path: 'class/:classId',
        name: 'ClassDetailsView',
        children: [
          {
            path: 'student/:studentId',
            name: 'StudentDetailsView',
          },
          {
            path: 'assignment/:assignmentId',
            name: 'AssignmentView',
          },
          {
            path: 'assignments',
            name: 'ClassAssignmentsView',
            component: TeacherDashboardView,
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
    meta: { protected: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'Not Found',
    beforeEnter: async (_to, _from, next) => next('/'),
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

// Router middleware to check authentication for protect routes
router.beforeEach((to, from, next) => {
  if (to.matched.some((route) => route.meta.requiresAdmin)) {
    getUser()
      .then(() => {
        if (!store.state.user.user.isAdmin) {
          next({
            path: '/login',
            query: {
              redirect: to.fullPath,
            },
          })
        } else {
          next()
        }
      })
      .catch(() => {})
  } else if (to.matched.some((route) => route.meta.protected)) {
    getUser()
      .then(() => {
        if (!store.getters['user/isAuthenticated']) {
          next({
            path: '/login',
            query: {
              redirect: to.fullPath,
            },
          })
        } else if (store.getters['user/shouldForceAboutPage']) {
          const route = '/about-you'
          if (to.path.indexOf(route) !== -1) {
            next()
          } else {
            next({
              path: route,
              redirect: to.fullPath,
            })
          }
        } else if (
          !store.getters['user/isVerified'] ||
          store.getters['user/isInStudentVolunteerVerifyFlow']
        ) {
          const route = '/verify'
          if (to.path.indexOf(route) !== -1) next()
          else
            next({
              path: route,
              redirect: to.fullPath,
            })
        } else {
          next()
        }
      })
      .catch(() => {})
  } else if (to.matched.some((route) => route.meta.loggedOutOnly)) {
    getUser()
      .then(() => {
        if (store.getters['user/isAuthenticated']) {
          next('/dashboard')
        } else {
          next()
        }
      })
      .catch(() => {})
  } else if (to.matched.some((route) => route.meta.authOptional)) {
    getUser()
      .then(() => {
        next()
      })
      .catch(() => {})
  } else {
    next()
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
    const gtagDimensions = {
      page_title: router.currentRoute.name,
      page_location: window.location.href,
      page_path: router.currentRoute.path,
      is_authenticated: isAuthenticated ? '1' : '0',
    }
    if (isAuthenticated) {
      const userType = store.getters['user/userType']
      gtagDimensions.userType = userType
    }

    // Send page view.
    window.gtag('event', 'page_view', gtagDimensions)
  }
})

// If endpoint returns 401, redirect to login (except for requests to get user or user's
// session)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const is401 = error.request.status === 401
    const isGetUserAttempt =
      error.request.responseURL.indexOf('/api/user') !== -1 &&
      error.response.config.method === 'get'
    const isGetSessionAttempt =
      error.request.responseURL.indexOf('/api/session/current') !== -1
    const isGetSubjectsAttempt =
      error.request.responseURL.indexOf('/api/subjects') !== -1

    if (
      is401 &&
      !(isGetUserAttempt || isGetSessionAttempt || isGetSubjectsAttempt)
    )
      router.push('/login?401=true').catch(() => {})
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.data?.err === INVALID_CSRF_ERROR) {
      store.commit('app/setShowCsrfRefreshAlert', true)
    }
    return Promise.reject(error)
  }
)
