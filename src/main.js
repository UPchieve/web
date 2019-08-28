import Vue from "vue";
import VueSocketIO from "vue-socket.io";
import VueRouter from "vue-router";
import VueHeadful from "vue-headful";
import * as Sentry from "@sentry/browser";
import * as Integrations from "@sentry/integrations";
import vSelect from "vue-select";
import App from "./components/App";
import router from "./router";
import store from "./store";

// Prevent production tip on startup
Vue.config.productionTip = false;

// Use plugins
Vue.use(VueSocketIO, process.env.VUE_APP_SOCKET_ADDRESS);
Vue.use(VueRouter);

Sentry.init({
  dsn: process.env.VUE_APP_SENTRY_DSN,
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

// Set up vue-select
Vue.component("v-select", vSelect);

// Create Vue instance
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
