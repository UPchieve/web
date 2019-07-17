// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import router from './router'
import App from './App'
import vueHeadful from 'vue-headful'
import vSelect from 'vue-select'


// Setup vue-headful
Vue.component('vue-headful', vueHeadful)
Vue.component('v-select', vSelect)

/* eslint-disable no-new */
new Vue({
  router,
  el: '#app',
  components: { App },
  template: '<App/>'
})
