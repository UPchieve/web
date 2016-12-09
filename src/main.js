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

const routes = [
  { path: '/', redirect: '/about' },
  { path: '/about', component: About },
  { path: '/login', component: LoginForm },
  { path: '/signup', component: SignupForm }
]

export const router = new VueRouter({
  routes,
  linkActiveClass: 'active'
});

import App from './App'

/* eslint-disable no-new */
new Vue({
  router,
  el: '#app',
  template: '<App/>',
  components: { App }
})
