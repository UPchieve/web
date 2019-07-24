import Vue from 'vue'
import VueSocketIO from 'vue-socket.io'
import VueHeadful from 'vue-headful'
import App from './App.vue'
import router from './router'
import store from './store'
import vSelect from 'vue-select'
import vueHeadful from 'vue-headful'


// Setup vue-headful
Vue.component('vue-headful', vueHeadful)
Vue.component('v-select', vSelect)

// Prevent production tip on startup
Vue.config.productionTip = false

// Use vue-socket.io
Vue.use(VueSocketIO, process.env.VUE_APP_SOCKET_ADDRESS)

// Set up vue-headful
Vue.component('vue-headful', VueHeadful)

// Create Vue instance
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
