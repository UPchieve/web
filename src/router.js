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
  { path: '/contact', component: Contact },
  { path: '/legal', component: Legal },
  { path: '/login', component: LoginForm },
  { path: '/logout', component: Logout },
  { path: '/signup', component: Registration },
  { path: '/resetpassword', component: ResetPasswordForm },
  { path: '/setpassword/:token', component: SetPasswordForm },
  { path: '/dashboard', component: Dashboard, meta: { protected: true } },
  {
    path: '/session/math/:subTopic/:sessionId?',
    component: Session,
    meta: { protected: true }
  },
  {
    path: '/session/college/:subTopic/:sessionId?',
    component: Session,
    meta: { protected: true }
  },
  { path: '/schedule', component: Schedule, meta: { protected: true } },
  {
    path: '/resources',
    component: Resources,
    meta: { protected: true, bypassOnboarding: true }
  },
  {
    path: '/feedback/:sessionId/:userType/:studentId/:volunteerId',
    component: Feedback,
    meta: { protected: true }
  },
  {
    path: '/action/:action/:data?',
    component: Action,
    meta: { bypassOnboarding: true }
  },
  {
    path: '/onboarding/:step?',
    component: Onboarding,
    meta: { protected: true }
  },
  { path: '/training', component: Training, meta: { protected: true } },
  {
    path: '/training/:category/quiz',
    component: Quiz,
    meta: { protected: true }
  },
  {
    path: '/training/:category/review',
    component: Review,
    meta: { protected: true }
  },
  { path: '/profile', component: Profile, meta: { protected: true } },
  { path: '/calendar', component: Calendar },
  {
    path: '/submit-question',
    component: SubmitQuestion,
    meta: { protected: true }
  },
  { path: '/inbox', component: Inbox, meta: { protected: true } },
  { path: '/send-answer', component: SendAnswer, meta: { protected: true } }
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
