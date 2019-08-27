import Vue from "vue";
import VueSocketIO from "vue-socket.io";
import Vue2TouchEvents from "vue2-touch-events";
import VueRouter from "vue-router";
import VueHeadful from "vue-headful";
import vSelect from "vue-select";
import App from "./components/App";
import router from "./router";
import store from "./store";

// Prevent production tip on startup
Vue.config.productionTip = false;

// Use plugins
Vue.use(VueSocketIO, process.env.VUE_APP_SOCKET_ADDRESS);
Vue.use(VueRouter);

// Touch events
Vue.use(Vue2TouchEvents);

// Set up vue-headful
Vue.component("vue-headful", VueHeadful);

// Set up vue-select
Vue.component("v-select", vSelect);

// Give all components isMobile()
Vue.mixin({
  methods: {
    isMobile() {
      // Check if browser is mobile
      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        return true;
      } else {
        return false;
      }
    }
  }
});

// Create Vue instance
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
