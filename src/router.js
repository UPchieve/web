import { createRouter, createWebHistory } from 'vue-router'
import store from './store'
import AddClassView from './views/AddClassView.vue'
import AdminView from './views/Admin/index.vue'
import AdminEditSchool from './views/Admin/AdminEditSchool.vue'
import AdminIneligibleStudents from './views/Admin/AdminIneligibleStudents.vue'
import AdminPendingVolunteers from './views/Admin/AdminPendingVolunteers.vue'
import AdminSchoolDetail from './views/Admin/AdminSchoolDetail.vue'
import AdminSchools from './views/Admin/AdminSchools.vue'
import AdminSessionDetail from './views/Admin/AdminSessionDetail.vue'
import AdminSessionNotifications from './views/Admin/AdminSessionNotifications.vue'
import AdminSessionReview from './views/Admin/AdminSessionReview.vue'
import AdminSessions from './views/Admin/AdminSessions.vue'
import AdminStudentReports from './views/Admin/AdminStudentReports.vue'
import AdminUserDetail from './views/Admin/AdminUserDetail.vue'
import AdminUsers from './views/Admin/AdminUsers.vue'
import AdminVolunteerReports from './views/Admin/AdminVolunteerReports.vue'
import AdminZipCodes from './views/Admin/AdminZipCodes.vue'
import AdminRosterStudents from './views/Admin/AdminRosterStudents.vue'
import VolunteerCoverage from './views/Admin/VolunteerCoverage.vue'
import BackgroundInfoView from './views/BackgroundInfoView.vue'
import CalendarView from './views/CalendarView.vue'
import ContactView from './views/ContactView.vue'
import DashboardView from './views/DashboardView/index.vue'
import FavoriteCoachesView from './views/FavoriteCoachesView.vue'
import FeedbackView from './views/FeedbackView.vue'
import LoginView from './views/LoginView.vue'
import LogoutView from './views/LogoutView.vue'
import ProfileView from './views/ProfileView/index.vue'
import QuizView from './views/QuizView/index.vue'
import ReferenceView from './views/ReferenceView.vue'
import ReferFriendsView from './views/ReferFriendsView.vue'
import ResetPasswordView from './views/ResetPasswordView.vue'
import ResourcesView from './views/ResourcesView.vue'
import ReviewMaterialsView from './views/ReviewMaterialsView.vue'
import SessionView from './views/SessionView/index.vue'
import SetPasswordView from './views/SetPasswordView.vue'
import SignupView from './views/SignupView/index.vue'
import StudentPartnerSignupView from './views/SignupView/StudentPartnerSignupView.vue'
import TrainingCourseView from './views/TrainingCourseView/index.vue'
import TrainingView from './views/TrainingView.vue'
import VerificationView from './views/VerificationView/index.vue'
import VolunteerPartnerSignupView from './views/VolunteerPartnerSignupView.vue'
import SessionHistoryView from './views/SessionHistoryView.vue'
import SessionRecapView from './views/SessionRecapView.vue'
import AdminTestAudience from './views/Admin/AdminTestAudience.vue'
import WelcomePage from './views/WelcomePage.vue'
import ProgressReportsOverviewView from './views/ProgressReportsOverviewView.vue'
import ProgressReportsOverviewSubjectView from './views/ProgressReportsOverviewSubjectView.vue'
import Gleap from 'gleap'
import NetworkService, { axiosInstance } from './services/NetworkService'
import { UserType } from '@/services/SignUpService'
import { beforeEnter as studentBeforeEnter } from '@/services/SignUpService/StudentSignUpService'
import { beforeEnter as teacherBeforeEnter } from '@/services/SignUpService/TeacherSignUpService'
import { INVALID_CSRF_ERROR } from '@/services/AuthService'
import Case from 'case'

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
            if (store.getters['user/isAutoFlowUser']) next('/welcome')
            else next('/dashboard')
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
        } catch (error) {
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
      window.location.href = 'https://upchieve.org/legal'
    },
  },
  {
    path: '/login',
    name: 'LoginView',
    component: LoginView,
    meta: { loggedOutOnly: true },
  },
  {
    path: '/logout',
    name: 'LogoutView',
    component: LogoutView,
  },
  {
    path: '/reference-form/:referenceId',
    name: 'ReferenceView',
    component: ReferenceView,
    meta: { authOptional: true },
  },
  {
    path: '/class',
    name: 'AddClass',
    component: AddClassView,
    meta: { authOptional: true },
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
    meta: { loggedOutOnly: true },
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
    meta: { loggedOutOnly: true },
    beforeEnter: async (to, _from, next) => {
      if (store.getters['featureFlags/useNewSignUpFlow']) {
        return next({
          name: 'SignupView',
          params: {
            step: 'info',
            userType: 'student',
          },
          query: {
            partner: to.params.partnerId,
            ...to.query,
          },
        })
      }
      return next()
    },
  },
  {
    path: '/signup/volunteer/:partnerId',
    name: 'VolunteerPartnerSignupView',
    component: VolunteerPartnerSignupView,
    meta: { loggedOutOnly: true },
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
    path: '/integration',
    name: 'Integration',
    beforeEnter: (to, from, next) => {
      const {
        query: { assignmentId, partner, problemId, studentId },
      } = to

      localStorage.setItem('assignmentId', assignmentId)
      localStorage.setItem('problemId', problemId)
      localStorage.setItem('studentId', studentId)

      getUser().then(() => {
        if (store.getters['user/isAuthenticated']) {
          next('/dashboard')
        } else {
          next(`/signup/student/${partner}`)
        }
      })
    },
  },
  {
    path: '/resetpassword',
    name: 'ResetPasswordView',
    component: ResetPasswordView,
  },
  {
    path: '/setpassword',
    name: 'SetPasswordView',
    component: SetPasswordView,
    props: (route) => ({ token: route.query.token }),
  },
  {
    path: '/dashboard',
    name: 'DashboardView',
    component: DashboardView,
    meta: { protected: true },
    beforeEnter: async (to, from, next) => {
      if (store.getters['user/isAutoFlowUser']) next('/welcome')
      else next()
    },
  },
  {
    path: '/session/:topic/:subTopic/:sessionId?',
    name: 'SessionView',
    component: SessionView,
    meta: { protected: true },
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
    meta: { protected: true },
  },
  {
    path: '/verify',
    name: 'VerificationView',
    component: VerificationView,
    meta: { protected: true },
    beforeEnter: (to, from, next) => {
      getUser()
        .then(() => {
          if (store.getters['user/isVerified']) {
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
    path: '/training/course/:courseKey',
    name: 'TrainingCourseView',
    component: TrainingCourseView,
    meta: { protected: true },
  },
  {
    path: '/profile',
    name: 'ProfileView',
    component: ProfileView,
    meta: { protected: true },
    beforeEnter: (to, from, next) => {
      if (store.getters['user/isAutoFlowUser']) next('/welcome')
      else next()
    },
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
    beforeEnter: (to, from, next) => {
      if (store.getters['user/isAutoFlowUser']) next('/welcome')
      else next()
    },
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
    meta: { protected: true },
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
        } else if (!store.getters['user/isVerified']) {
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
  if (to.name !== from.name) store.dispatch('app/showNavigation')
  store.dispatch('app/modal/hide')

  // Google Analytics.
  if (window.gtag) {
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
