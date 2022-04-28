import Case from 'case'
import Vue from 'vue'
import VueResource from 'vue-resource'
import VueRouter from 'vue-router'
import store from './store'
import { topics } from './utils/topics'
import AdminView from './views/Admin'
import AdminAddSchool from './views/Admin/AdminAddSchool'
import AdminEditSchool from './views/Admin/AdminEditSchool'
import AdminIneligibleStudents from './views/Admin/AdminIneligibleStudents'
import AdminPendingVolunteers from './views/Admin/AdminPendingVolunteers'
import AdminSchoolDetail from './views/Admin/AdminSchoolDetail'
import AdminSchools from './views/Admin/AdminSchools'
import AdminSessionDetail from './views/Admin/AdminSessionDetail'
import AdminSessionNotifications from './views/Admin/AdminSessionNotifications'
import AdminSessionReview from './views/Admin/AdminSessionReview'
import AdminSessions from './views/Admin/AdminSessions'
import AdminStudentReports from './views/Admin/AdminStudentReports'
import AdminUserDetail from './views/Admin/AdminUserDetail'
import AdminUsers from './views/Admin/AdminUsers'
import AdminVolunteerReports from './views/Admin/AdminVolunteerReports'
import AdminZipCodes from './views/Admin/AdminZipCodes'
import VolunteerCoverage from './views/Admin/VolunteerCoverage'
import BackgroundInfoView from './views/BackgroundInfoView'
import CalendarView from './views/CalendarView'
import ContactView from './views/ContactView'
import DashboardView from './views/DashboardView'
import FavoriteCoachesView from './views/FavoriteCoachesView'
import FeedbackView from './views/FeedbackView'
import LegalView from './views/LegalView'
import LoginView from './views/LoginView'
import LogoutView from './views/LogoutView'
import ProfileView from './views/ProfileView'
import QuizView from './views/QuizView'
import ReferenceView from './views/ReferenceView'
import ReferFriendsView from './views/ReferFriendsView'
import ResetPasswordView from './views/ResetPasswordView'
import ResourcesView from './views/ResourcesView'
import ReviewMaterialsView from './views/ReviewMaterialsView'
import SessionView from './views/SessionView'
import SetPasswordView from './views/SetPasswordView'
import SignupView from './views/SignupView'
import StudentCounselingFeedbackView from './views/StudentCounselingFeedbackView'
import StudentPartnerSignupView from './views/StudentPartnerSignupView'
import TrainingCourseView from './views/TrainingCourseView'
import TrainingView from './views/TrainingView'
import VerificationView from './views/VerificationView'
import VolunteerPartnerSignupView from './views/VolunteerPartnerSignupView'
import SessionHistoryView from './views/SessionHistoryView'

Vue.use(VueResource)
Vue.http.options.credentials = true

const getUser = () => {
  if (store.getters['user/isAuthenticated']) {
    return new Promise(resolve => {
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
    beforeEnter: (to, from, next) => {
      getUser()
        .then(() => {
          if (store.getters['user/isAuthenticated']) {
            next('/dashboard')
          } else {
            next('/login')
          }
        })
        .catch(() => {})
    }
  },
  {
    path: '/contact',
    name: 'ContactView',
    component: ContactView,
    meta: { authOptional: true }
  },
  {
    path: '/legal',
    name: 'LegalView',
    component: LegalView,
    meta: { authOptional: true }
  },
  {
    path: '/login',
    name: 'LoginView',
    component: LoginView,
    meta: { loggedOutOnly: true }
  },
  {
    path: '/logout',
    name: 'LogoutView',
    component: LogoutView,
    meta: { loggedOutOnly: true }
  },
  {
    path: '/reference-form/:referenceId',
    name: 'ReferenceView',
    component: ReferenceView,
    meta: { authOptional: true }
  },
  {
    path: '/signup',
    beforeEnter: (to, from, next) => {
      next('/sign-up')
    }
  },
  {
    path: '/sign-up/:userType?/:step?',
    name: 'SignupView',
    component: SignupView,
    meta: { loggedOutOnly: true }
  },
  {
    path: '/signup/student/:partnerId',
    name: 'StudentPartnerSignupView',
    component: StudentPartnerSignupView,
    meta: { loggedOutOnly: true }
  },
  {
    path: '/signup/volunteer/:partnerId',
    name: 'VolunteerPartnerSignupView',
    component: VolunteerPartnerSignupView,
    meta: { loggedOutOnly: true }
  },
  { 
    path: '/sessions/history',
    name: 'SessionHistoryView',
    component: SessionHistoryView,
    meta: { protected: true }
  },
  {
    path: '/referral/:referredByCode',
    beforeEnter: (to, from, next) => {
      const referredByCode = to.params.referredByCode
      next(`/sign-up?referral=${referredByCode}`)
    }
  },
  {
    path: '/integration',
    beforeEnter: (to, from, next) => {
      const {
        query: { assignmentId, partner, problemId, studentId }
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
    }
  },
  {
    path: '/resetpassword',
    name: 'ResetPasswordView',
    component: ResetPasswordView
  },
  {
    path: '/setpassword',
    name: 'SetPasswordView',
    component: SetPasswordView,
    props: route => ({ token: route.query.token })
  },
  {
    path: '/dashboard',
    name: 'DashboardView',
    component: DashboardView,
    meta: { protected: true }
  },
  {
    path: '/session/:topic/:subTopic/:sessionId?',
    name: 'SessionView',
    component: SessionView,
    meta: { protected: true },
    beforeEnter: (to, from, next) => {
      const topic = Case.camel(to.params.topic)
      const subtopic = Case.camel(to.params.subTopic)
      const isValidTopicAndSubtopic =
        Object.prototype.hasOwnProperty.call(topics, topic) &&
        Object.prototype.hasOwnProperty.call(topics[topic].subtopics, subtopic)
      if (isValidTopicAndSubtopic) next()
      else next('/dashboard')
    }
  },
  {
    path: '/resources',
    name: 'ResourcesView',
    component: ResourcesView,
    meta: { protected: true }
  },
  {
    path: '/refer-friends',
    name: 'ReferFriendsView',
    component: ReferFriendsView,
    meta: { protected: true },
    beforeEnter: (to, from, next) => {
      if (store.getters['featureFlags/isReferFriendsActive']) next()
      else next('/dashboard')
    }
  },
  {
    path: '/feedback/:sessionId',
    name: 'FeedbackView',
    component: FeedbackView,
    meta: { protected: true }
  },
  {
    path:
      '/feedback/:sessionId/:topic/:subTopic/:userType/:studentId/:volunteerId',
    name: 'StudentCounselingFeedbackView',
    component: StudentCounselingFeedbackView,
    meta: { protected: true }
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
    }
  },
  {
    path: '/training',
    name: 'TrainingView',
    component: TrainingView,
    meta: { protected: true }
  },
  {
    path: '/training/review/:category',
    name: 'ReviewMaterialsView',
    component: ReviewMaterialsView,
    meta: { protected: true }
  },
  {
    path: '/training/:category/quiz',
    name: 'QuizView',
    component: QuizView,
    meta: { protected: true }
  },
  {
    path: '/training/course/:courseKey',
    name: 'TrainingCourseView',
    component: TrainingCourseView,
    meta: { protected: true }
  },
  {
    path: '/profile',
    name: 'ProfileView',
    component: ProfileView,
    meta: { protected: true }
  },
  {
    path: '/favorite-coaches',
    name: 'FavoriteCoachesView',
    component: FavoriteCoachesView,
    meta: { protected: true }
  },
  {
    path: '/calendar',
    name: 'CalendarView',
    component: CalendarView,
    meta: { protected: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/volunteer-coverage',
    name: 'VolunteerCoverage',
    component: VolunteerCoverage,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/sessions',
    name: 'AdminSessions',
    component: AdminSessions,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/sessions/review',
    name: 'AdminSessionDetail',
    component: AdminSessionReview,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/sessions/:sessionId',
    name: 'AdminSessionDetail',
    component: AdminSessionDetail,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/sessions/:sessionId/notifications',
    name: 'AdminSessionNotifications',
    component: AdminSessionNotifications,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: AdminUsers,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/users/:userId',
    name: 'AdminUserDetail',
    component: AdminUserDetail,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/volunteers/review',
    name: 'AdminPendingVolunteers',
    component: AdminPendingVolunteers,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/ineligible-students',
    name: 'AdminIneligibleStudents',
    component: AdminIneligibleStudents,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/school/new',
    name: 'AdminAddSchool',
    component: AdminAddSchool,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/school/edit',
    name: 'AdminAddSchool',
    component: AdminEditSchool,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/school/:schoolId',
    name: 'AdminSchoolDetail',
    component: AdminSchoolDetail,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/schools',
    name: 'AdminSchools',
    component: AdminSchools,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/reports/students',
    name: 'AdminStudentReports',
    component: AdminStudentReports,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/reports/volunteers',
    name: 'AdminVolunteerReports',
    component: AdminVolunteerReports,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/admin/zip-codes',
    name: 'AdminZipCodes',
    component: AdminZipCodes,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: '/background-information',
    name: 'BackgroundInfoView',
    component: BackgroundInfoView,
    meta: { protected: true }
  },
  {
    path: '/edu', // TODO: make this be "/admin/edu"
    component: () => {
      window.location.href = '/edu'
    }
  }
]

/**
 * @todo Consider refactoring this file
 */
const router = new VueRouter({
  routes,
  linkActiveClass: 'active',
  mode: 'history',
  scrollBehavior() {
    return { x: 0, y: 0 }
  }
})

export default router

// Router middleware to check authentication for protect routes
router.beforeEach((to, from, next) => {
  if (to.matched.some(route => route.meta.requiresAdmin)) {
    getUser()
      .then(() => {
        if (!store.state.user.user.isAdmin) {
          next({
            path: '/login',
            query: {
              redirect: to.fullPath
            }
          })
        } else {
          next()
        }
      })
      .catch(() => {})
  } else if (to.matched.some(route => route.meta.protected)) {
    getUser()
      .then(() => {
        if (!store.getters['user/isAuthenticated']) {
          next({
            path: '/login',
            query: {
              redirect: to.fullPath
            }
          })
        } else if (!store.getters['user/isVerified']) {
          const route = '/verify'
          if (to.path.indexOf(route) !== -1) next()
          else
            next({
              path: route,
              redirect: to.fullPath
            })
        } else {
          next()
        }
      })
      .catch(() => {})
  } else if (to.matched.some(route => route.meta.loggedOutOnly)) {
    getUser()
      .then(() => {
        if (store.getters['user/isAuthenticated']) {
          next('/dashboard')
        } else {
          next()
        }
      })
      .catch(() => {})
  } else if (to.matched.some(route => route.meta.authOptional)) {
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

  // Google Analytics
  if (window.gtag) {
    // Send page view
    // @todo: put GA ID in config
    // @todo: only track on prod
    window.gtag('config', 'UA-133171872-1', {
      page_path: router.currentRoute.path,
      custom_map: { dimension1: 'is_volunteer', dimension2: 'is_authenticated' }
    })

    const isAuthenticated = store.getters['user/isAuthenticated']
    const isVolunteer = store.getters['user/isVolunteer']
    const gtagDimensions = { is_authenticated: isAuthenticated ? '1' : '0' }
    if (isAuthenticated) gtagDimensions.is_volunteer = isVolunteer ? '1' : '0'

    // Send custom dimensions data
    window.gtag('event', 'upc_page_transition', gtagDimensions)
  }
})

// If endpoint returns 401, redirect to login (except for requests to get user or user's
// session)
Vue.http.interceptors.push((request, next) => {
  next(response => {
    const is401 = response.status === 401
    const isGetUserAttempt =
      request.url.indexOf('/api/user') !== -1 && request.method === 'GET'
    const isGetSessionAttempt =
      request.url.indexOf('/api/session/current') !== -1

    if (is401 && !(isGetUserAttempt || isGetSessionAttempt)) {
      router.push('/login?401=true').catch(() => {})
    }
  })
})

// using the double submit cookie pattern to send csrf token stored in cookie as a request parameter
Vue.http.interceptors.push((request) => {
  const csrfToken = store.getters['app/csrfToken']
  if (csrfToken) {
    request.headers.set('X-CSRF-TOKEN', csrfToken);
  }   
});
