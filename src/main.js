import Vue from "vue";
import VueSocketIO from "vue-socket.io";
import Vue2TouchEvents from 'vue2-touch-events'
import VueHeadful from "vue-headful";
import vSelect from "vue-select";
import App from "./App.vue";
import router from "./router";
import store from "./store";

// Prevent production tip on startup
Vue.config.productionTip = false;

// Use vue-socket.io
Vue.use(VueSocketIO, process.env.VUE_APP_SOCKET_ADDRESS);

// Touch events 
Vue.use(Vue2TouchEvents);

// Set up vue-headful
Vue.component("vue-headful", VueHeadful);

// Set up vue-select
Vue.component("v-select", vSelect);

// Create Vue instance
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
