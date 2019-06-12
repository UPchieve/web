import Vue from 'vue'
import VueResource from 'vue-resource'
import VueRouter from 'vue-router'
import VueSocketio from 'vue-socket.io'

import Contact from './components/Contact'
import Legal from './components/Legal'
import Logout from './components/Logout'
import LoginForm from './components/LoginForm'
import Registration from './components/Registration'
import ResetPasswordForm from './components/ResetPasswordForm'
import SetPasswordForm from './components/SetPasswordForm'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import Session from './components/Session'
import Action from './components/Action'
import Schedule from './components/Schedule'
import Resources from './components/Resources'
import Feedback from './components/Feedback'
import Training from './components/Training'
import Quiz from './components/Quiz'
import Review from './components/Review'
import Profile from './components/Profile'
import Calendar from './components/Calendar'
import SubmitQuestion from './components/views/SubmitQuestion'
import Inbox from './components/views/Inbox'
import SendAnswer from './components/views/SendAnswer'

import AuthService from './services/AuthService'
import OnboardingService from './services/OnboardingService'

Vue.use(VueResource)
Vue.use(VueRouter)
Vue.use(VueSocketio, process.env.SOCKET_ADDRESS)

Vue.http.options.credentials = true

const routes = [
  {
    path: '/',
    redirect: () => {
      if (AuthService.user.authenticated) {
        return '/dashboard'
      }
      return '/login'
    }
  },
  { path: '/contact', name: 'Contact', component: Contact },
  { path: '/legal', name: 'Legal', component: Legal },
  { path: '/login', name: 'LoginForm', component: LoginForm },
  { path: '/logout', name: 'Logout', component: Logout },
  { path: '/signup', name: 'Registration', component: Registration },
  { path: '/resetpassword', name: 'ResetPasswordForm', component: ResetPasswordForm },
  { path: '/setpassword/:token', name: 'SetPasswordForm', component: SetPasswordForm },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { protected: true } },
  {
    path: '/session/math/:subTopic/:sessionId?',
    name: 'Session-math',
    component: Session,
    meta: { protected: true }
  },
  {
    path: '/session/college/:subTopic/:sessionId?',
    name: 'Session-college',
    component: Session,
    meta: { protected: true }
  },
  { path: '/schedule', name: 'Schedule', component: Schedule, meta: { protected: true } },
  {
    path: '/resources',
    name: 'Resources',
    component: Resources,
    meta: { protected: true, bypassOnboarding: true }
  },
  {
    path: '/edu',
    component: () => {
      window.location.href = '/edu'
    }
  },
  {
    path: '/feedback/:sessionId/:userType/:studentId/:volunteerId',
    name: 'Feedback',
    component: Feedback,
    meta: { protected: true }
  },
  {
    path: '/action/:action/:data?',
    name: 'Action',
    component: Action,
    meta: { bypassOnboarding: true }
  },
  {
    path: '/onboarding/:step?',
    name: 'Onboarding',
    component: Onboarding,
    meta: { protected: true }
  },
  { path: '/training', name: 'Training', component: Training, meta: { protected: true } },
  {
    path: '/training/:category/quiz',
    name: 'Quiz',
    component: Quiz,
    meta: { protected: true }
  },
  {
    path: '/training/:category/review',
    name: 'Review',
    component: Review,
    meta: { protected: true }
  },
  { path: '/profile', name: 'Profile', component: Profile, meta: { protected: true } },
  { path: '/calendar', name: 'Calendar', component: Calendar },
  {
    path: '/submit-question',
    name: 'SubmitQuestion',
    component: SubmitQuestion,
    meta: { protected: true }
  },
  { path: '/inbox', name: 'Inbox', component: Inbox, meta: { protected: true } },
  { path: '/send-answer', name: 'SendAnswer', component: SendAnswer, meta: { protected: true } }
]

/**
 * @todo Consider refactoring this file
 */
const router = new VueRouter({
  routes,
  linkActiveClass: 'active'
})

export default router

// Router middleware to check authentication for protect routes
router.beforeEach((to, from, next) => {
  /*gets the path routing to, and get the part of the path
  most representative of where it is going*/
  var pageRoutingTo = to.fullPath.split('/')[1]
  window.analytics.page(pageRoutingTo)


  if (to.matched.some(route => route.meta.protected)) {
    if (!AuthService.user.authenticated) {
      console.log('Protected route requires login')
      next({
        path: '/login',
        query: {
          redirect: to.fullPath
        }
      })
    } else if (!OnboardingService.isOnboarded()) {
      console.log('User requires onboarding')
      const route = OnboardingService.getOnboardingRoute()
      if (
        to.path.indexOf(route) !== -1 ||
        to.matched.some(route => route.meta.bypassOnboarding)
      ) {
        next()
      } else {
        next({
          path: route,
          query: {
            redirect: to.fullPath
          }
        })
      }
    } else {
      next()
    }
  } else {
    next()
  }
})



// If endpoint returns 401, redirect to login (except for requests to get user's
// session)
Vue.http.interceptors.push((request, next) => {
  next(response => {
    if (
      response.status === 401 &&
      !(request.url.indexOf('/api/user') !== -1 && request.method === 'GET')
    ) {
      AuthService.removeUser()
      router.push('/login?401=true')
    }
  })
})
