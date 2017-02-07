// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueResource from 'vue-resource'
import VueRouter from 'vue-router'

Vue.use(VueResource)
Vue.use(VueRouter)

import About from './components/About'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'
import Onboarding from './components/Onboarding'
import Whiteboard from './components/Whiteboard'

import AuthService from './services/AuthService'
import OnboardingService from './services/OnboardingService'

const routes = [
  { path: '/', redirect: '/about' },
  { path: '/about', component: About, meta: { protected: true } },
  { path: '/login', component: LoginForm },
  { path: '/signup', component: SignupForm },
  { path: '/whiteboard/:id', component: Whiteboard, meta: { protected: true }},
  { path: '/onboarding', component: Onboarding, meta: { protected: true } }
]

const router = new VueRouter({
  routes,
  linkActiveClass: 'active'
});

export {router}; // Expose router to app controllers

// Router middleware to check authentication for protect routes
router.beforeEach((to, from, next) => {
  if (to.matched.some(route => route.meta.protected)){
    if (!AuthService.isAuthenticated){
      console.log('Protected route requires login');
      next({
        path: '/login',
        query: {
          redirect: to.fullPath
        }
      });
    } else if (!OnboardingService.isOnboarded){
      console.log('User requires onboarding');
      if (to.path === '/onboarding'){
        next();
      } else {
        next({
          path: '/onboarding',
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
