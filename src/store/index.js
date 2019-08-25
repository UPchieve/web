import Vue from "vue";
import Vuex from "vuex";
import appModule from "./modules/app";
import userModule from "./modules/user";

Vue.use(Vuex);

export const storeOptions = {
  modules: {
    app: appModule,
    user: userModule
  }
};

export default new Vuex.Store(storeOptions);
