import Vue from "vue";
import VueSocketIO from "vue-socket.io";
import VueHeadful from "vue-headful";
import * as Sentry from "@sentry/browser";
import * as Integrations from "@sentry/integrations";
import App from "./App.vue";
import router from "./router";
import store from "./store";

// Prevent production tip on startup
Vue.config.productionTip = false;

// Use vue-socket.io
Vue.use(VueSocketIO, process.env.VUE_APP_SOCKET_ADDRESS);

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [new Integrations.Vue({ Vue, attachProps: true })],
  environment: process.env.NODE_ENV,
  beforeSend(event, hint) {
    if (event.exception && hint.originalException.sentryEventId) {
      // event was already reported from server
      return null;
    }

    return event;
  }
});

// Set up vue-headful
Vue.component("vue-headful", VueHeadful);

// Create Vue instance
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
