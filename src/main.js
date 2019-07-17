import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vueHeadful from "vue-headful";

Vue.config.productionTip = false;

// Setup vue-headful
Vue.component("vue-headful", vueHeadful);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
