import { shallowMount, createLocalVue } from "@vue/test-utils";
import Vuex from "vuex";
import VueRouter from "vue-router";
import router from "@/router";
import appModule from "@/store/modules/app";
import App from "@/components/App";
import AppHeader from "@/components/App/AppHeader";
import AppSidebar from "@/components/App/AppSidebar";

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(Vuex);

const getWrapper = (appState = {}) => {
  const store = new Vuex.Store({
    modules: {
      app: {
        ...appModule,
        state: {
          ...appModule.state,
          ...appState
        }
      }
    }
  });

  return shallowMount(App, { localVue, router, store });
};

describe("App", () => {
  it("renders expected elements", () => {
    const wrapper = getWrapper();
    expect(wrapper.classes()).toEqual(["App"]);
    expect(wrapper.find(AppHeader).exists()).toBe(true);
    expect(wrapper.find(AppSidebar).exists()).toBe(true);
    expect(wrapper.find("router-view-stub").exists()).toBe(true);

    const routerViewWrapper = wrapper.find(".App-router-view-wrapper");
    expect(routerViewWrapper.exists()).toBe(true);
    expect(routerViewWrapper.is("div")).toBe(true);
    expect(routerViewWrapper.classes()).toEqual([
      "App-router-view-wrapper",
      "App-router-view-wrapper--header",
      "App-router-view-wrapper--sidebar"
    ]);
    expect(routerViewWrapper.contains("router-view-stub")).toBe(true);
  });

  it("conditionally renders `AppHeader`", () => {
    const wrapper = getWrapper({ hideHeader: true });
    expect(wrapper.find(AppHeader).exists()).toBe(false);

    const routerViewWrapper = wrapper.find(".App-router-view-wrapper");
    expect(routerViewWrapper.classes("App-router-view-wrapper--header")).toBe(
      false
    );
  });

  it("conditionally renders `AppSidebar`", () => {
    const wrapper = getWrapper({ hideSidebar: true });
    expect(wrapper.find(AppSidebar).exists()).toBe(false);

    const routerViewWrapper = wrapper.find(".App-router-view-wrapper");
    expect(routerViewWrapper.classes("App-router-view-wrapper--sidebar")).toBe(
      false
    );
  });
});
