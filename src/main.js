import Vue from "vue";
import VueSocketIO from "vue-socket.io";
import VueRouter from "vue-router";
import VueHeadful from "vue-headful";
import * as Sentry from "@sentry/browser";
import * as Integrations from "@sentry/integrations";
import vSelect from "vue-select";
import VuePhoneNumberInput from "vue-phone-number-input";
import VueStarRating from "vue-star-rating";
import VuePageVisibility from "vue-page-visibility-awesome";

import Socket from "socket.io-client";
import moment from "moment";

import App from "./components/App";
import router from "./router";
import store from "./store";

// Prevent production tip on startup
Vue.config.productionTip = false;

// Set up SocketIO
const socket = Socket(process.env.VUE_APP_SOCKET_ADDRESS, {
  autoConnect: false
});
Vue.use(VueSocketIO, socket);

// Set up Vue Router
Vue.use(VueRouter);

// Set up Sentry error tracking
Sentry.init({
  // Our Sentry project is configured to only accept calls from app.upchieve.org
  dsn: "https://0300061759f44def9726bcd3c0ed5611@sentry.io/1819161",
  integrations: [
    new Integrations.Vue({ Vue, attachProps: true, logErrors: true })
  ],
  environment: process.env.NODE_ENV
});

// Set up vue-headful
Vue.component("vue-headful", VueHeadful);

// Set up vue-select
Vue.component("v-select", vSelect);

// Set up vue-phone-number-input
Vue.component("vue-phone-number-input", VuePhoneNumberInput);

// Set up vue-star-rating
Vue.component("vue-star-rating", VueStarRating);

// Set up vue-page-visibility
Vue.component("vue-page-visibility", VuePageVisibility);

// Filter for formatting times
Vue.filter("formatTime", value => {
  if (value) {
    return moment(value).format("h:mm a");
  }
});

// Create Vue instance
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
