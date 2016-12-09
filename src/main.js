// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueResource from 'vue-resource'
import App from './App'

Vue.use(VueResource)

import VueRouter from 'vue-router'

Vue.use(VueRouter)

import About from './components/About'
import LoginForm from './components/LoginForm'

const routes = [
  { path: '/', redirect: '/about' },
  { path: '/about', component: About },
  { path: '/login', component: LoginForm }
]

const router = new VueRouter({
  routes,
  linkActiveClass: 'active'
});

/* eslint-disable no-new */
new Vue({
  router,
  el: '#app',
  template: '<App/>',
  components: { App }
})
