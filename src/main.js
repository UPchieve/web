// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueResource from 'vue-resource'
import VueRouter from 'vue-router'

Vue.use(VueResource)
Vue.use(VueRouter)

Vue.http.options.credentials = true;

import About from './components/About'
import Contact from './components/Contact'
import Privacy from './components/Privacy'
import Logout from './components/Logout'
import LoginForm from './components/LoginForm'
import Registration from './components/Registration'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import Session from './components/Session'
import Whiteboard from './components/Whiteboard'
import WhiteboardMessager from './components/WhiteboardMessager'
import Messager from './components/Messager'
import Action from './components/Action'
import Profile from './components/Profile'

import AuthService from './services/AuthService'
import OnboardingService from './services/OnboardingService'

const routes = [
  { path: '/', redirect: '/about' },
  { path: '/about', component: About },
  { path: '/contact', component: Contact },
  { path: '/privacy', component: Privacy },
  { path: '/login', component: LoginForm },
  { path: '/logout', component: Logout },
  { path: '/signup', component: Registration },
  { path: '/dashboard', component: Dashboard },
  { path: '/session', component: Session },
  { path: '/whiteboard', component: Whiteboard, meta: { protected: false } },
  { path: '/messager', component: Messager, meta: {protected: false}},
  { path: '/whiteboardmessager', component: WhiteboardMessager, meta: { protected: false } },
  { path: '/action/:action/:data?', component: Action, meta: { bypassOnboarding: true } },
  { path: '/onboarding/:step?', component: Onboarding, meta: { protected: true } },
  { path: '/profile', component: Profile, meta: { protected: true, bypassOnboarding: true } }
]

const router = new VueRouter({
  routes,
  linkActiveClass: 'active'
});

export {router}; // Expose router to app controllers

// Router middleware to check authentication for protect routes
router.beforeEach((to, from, next) => {
  if (to.matched.some(route => route.meta.protected)){
    if (!AuthService.user.authenticated){
      console.log('Protected route requires login');
      next({
        path: '/login',
        query: {
          redirect: to.fullPath
        }
      });
    } else if (!OnboardingService.isOnboarded()){
      console.log('User requires onboarding');
      var route = OnboardingService.getOnboardingRoute();
      if (to.path.indexOf(route) !== -1 || to.matched.some(route => route.meta.bypassOnboarding)){
        next();
      } else {
        next({
          path: route,
          query: {
            redirect: to.fullPath
          }
        });
      }
    } else {
      next();
    }
  } else {
    next();
  }
});

import App from './App'

/* eslint-disable no-new */
new Vue({
  router,
  el: '#app',
  template: '<App/>',
  components: { App }
})
