import { shallowMount, createLocalVue } from "@vue/test-utils";
import Vuex from "vuex";
import appModule from "@/store/modules/app";
import AppHeader from "@/components/App/AppHeader";

const localVue = createLocalVue();
localVue.use(Vuex);

const getWrapper = (mobileMode = false) => {
  const store = new Vuex.Store({
    modules: {
      app: {
        ...appModule,
        getters: {
          mobileMode: () => mobileMode
        }
      }
    }
  });

  return shallowMount(AppHeader, { localVue, store });
};

describe("AppHeader.vue", () => {
  it("renders expected elements when in mobile mode", () => {
    const wrapper = getWrapper(true);
    expect(wrapper.classes()).toEqual(["AppHeader"]);
  });

  it("renders expected elements when not in mobile mode", () => {
    const wrapper = getWrapper();
    const logo = wrapper.find(".AppHeader-logo");
    expect(logo.exists()).toBe(true);
    expect(logo.is("img")).toBe(true);
    expect(logo.attributes("src")).toBeDefined();
  });
});
