import { shallowMount, createLocalVue } from "@vue/test-utils";
import { merge } from "lodash";
import Vuex from "vuex";
import VueRouter from "vue-router";
import router from "@/router";
import { storeOptions } from "@/store";
import App from "@/components/App";
import AppHeader from "@/components/App/AppHeader";
import AppSidebar from "@/components/App/AppSidebar";
import AppModal from "@/components/App/AppModal";

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(Vuex);

const getWrapper = (options = {}) => {
  options = {
    showHeader: true,
    showSidebar: true,
    showModal: false,
    ...options
  };

  const store = new Vuex.Store(
    merge({}, storeOptions, {
      modules: {
        app: {
          modules: {
            header: { state: { isShown: options.showHeader } },
            sidebar: { state: { isShown: options.showSidebar } },
            modal: { state: { isShown: options.showModal } }
          }
        }
      }
    })
  );

  return shallowMount(App, { localVue, router, store });
};

describe("App", () => {
  it("renders expected elements", () => {
    const wrapper = getWrapper();
    expect(wrapper.classes("App")).toBe(true);
    expect(wrapper.find(AppHeader).exists()).toBe(true);
    expect(wrapper.find(AppSidebar).exists()).toBe(true);
    expect(wrapper.find(AppModal).exists()).toBe(false);
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
    const wrapper = getWrapper({ showHeader: false });
    expect(wrapper.find(AppHeader).exists()).toBe(false);

    const routerViewWrapper = wrapper.find(".App-router-view-wrapper");
    expect(routerViewWrapper.classes("App-router-view-wrapper--header")).toBe(
      false
    );
  });

  it("conditionally renders `AppSidebar`", () => {
    const wrapper = getWrapper({ showSidebar: false });
    expect(wrapper.find(AppSidebar).exists()).toBe(false);

    const routerViewWrapper = wrapper.find(".App-router-view-wrapper");
    expect(routerViewWrapper.classes("App-router-view-wrapper--sidebar")).toBe(
      false
    );
  });

  it("conditionally renders `AppModal`", () => {
    const wrapper = getWrapper({ showModal: true });
    expect(wrapper.find(AppModal).exists()).toBe(true);
  });
});
