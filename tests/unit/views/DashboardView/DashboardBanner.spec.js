import { shallowMount, createLocalVue } from "@vue/test-utils";
import Vuex from "vuex";
import appModule from "@/store/modules/app";
import userModule from "@/store/modules/user";
import DashboardBanner from "@/views/DashboardView/DashboardBanner";
// import LargeButton from "@/components/LargeButton";

const localVue = createLocalVue();
localVue.use(Vuex);

const getWrapper = (mobileMode = false, firstName = "Tester") => {
  const store = new Vuex.Store({
    modules: {
      app: {
        ...appModule,
        getters: {
          mobileMode: () => mobileMode
        }
      },
      user: {
        ...userModule,
        getters: {
          firstName: () => firstName
        }
      }
    }
  });

  return shallowMount(DashboardBanner, { localVue, store });
};

describe("DashboardView", () => {
  describe("layout", () => {
    test("mobile", () => {
      const wrapper = getWrapper(true);
      expect(wrapper.classes("DashboardBanner")).toBe(true);

      const greeting = wrapper.find(".DashboardBanner-greeting");
      expect(greeting.exists()).toBe(true);
      expect(greeting.text()).toBe("Hello, Tester!");

      const banner = wrapper.find(".DashboardBanner-banner");
      expect(banner.exists()).toBe(true);
    });

    test("desktop", () => {
      const wrapper = getWrapper(false);
      expect(wrapper.classes("DashboardBanner")).toBe(true);

      const banner = wrapper.find(".DashboardBanner-banner");
      expect(banner.exists()).toBe(true);

      const greeting = banner.find(".DashboardBanner-greeting");
      expect(greeting.exists()).toBe(true);
      expect(greeting.text()).toBe("Hello, Tester!");
    });
  });
});
