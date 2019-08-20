import { shallowMount, createLocalVue } from "@vue/test-utils";
import Vuex from "vuex";
import appModule from "@/store/modules/app";
import AppSidebar from "@/components/App/AppSidebar";
import AppSidebarInfo from "@/components/App/AppSidebar/AppSidebarInfo";
import AppSidebarLinks from "@/components/App/AppSidebar/AppSidebarLinks";

const localVue = createLocalVue();
localVue.use(Vuex);

const getWrapper = (options = {}) => {
  options = {
    mobileMode: false,
    hideHeader: false,
    isSidebarCollapsed: true,
    ...options
  };

  const store = new Vuex.Store({
    modules: {
      app: {
        ...appModule,
        state: {
          ...appModule.state,
          hideHeader: options.hideHeader,
          isSidebarCollapsed: options.isSidebarCollapsed
        },
        getters: {
          mobileMode: () => options.mobileMode
        }
      }
    }
  });

  return shallowMount(AppSidebar, { localVue, store });
};

describe("AppSidebar", () => {
  describe("layout", () => {
    it("has collapse class when `isSidebarCollapsed` is true", () => {
      const collapsed = getWrapper({
        mobileMode: true,
        isSidebarCollapsed: true
      });
      expect(collapsed.classes("AppSidebar--collapsed")).toBe(true);

      const expanded = getWrapper({
        mobileMode: true,
        isSidebarCollapsed: false
      });
      expect(expanded.classes("AppSidebar--collapsed")).toBe(false);

      // Class should be present only for `mobileMode`
      const desktop = getWrapper({ mobileMode: false });
      expect(desktop.classes("AppSidebar--collapsed")).toBe(false);
    });

    it("has header class when `hideHeader` is false", () => {
      let mobile = getWrapper({ mobileMode: true, hideHeader: false });
      let desktop = getWrapper({ mobileMode: false, hideHeader: false });
      expect(mobile.classes("AppSidebar--header")).toBe(true);
      expect(desktop.classes("AppSidebar--header")).toBe(true);

      mobile = getWrapper({ mobileMode: true, hideHeader: true });
      desktop = getWrapper({ mobileMode: false, hideHeader: true });
      expect(mobile.classes("AppSidebar--header")).toBe(false);
      expect(desktop.classes("AppSidebar--header")).toBe(false);
    });

    it("mobileMode: true", () => {
      const wrapper = getWrapper({ mobileMode: true });
      expect(wrapper.classes("AppSidebar")).toBe(true);

      const content = wrapper.find(".AppSidebar-content");
      expect(content.exists()).toBe(true);

      const info = content.find(AppSidebarInfo);
      expect(info.exists()).toBe(false);

      const links = content.find(AppSidebarLinks);
      expect(links.exists()).toBe(true);

      const finalLink = content.find(".AppSidebar-final-link");
      expect(finalLink.exists()).toBe(true);
    });

    it("mobileMode: false", () => {
      const wrapper = getWrapper({ mobileMode: false });
      expect(wrapper.classes("AppSidebar")).toBe(true);

      const content = wrapper.find(".AppSidebar-content");
      expect(content.exists()).toBe(true);

      const info = content.find(AppSidebarInfo);
      expect(info.exists()).toBe(true);

      const links = content.find(AppSidebarLinks);
      expect(links.exists()).toBe(true);

      const finalLink = content.find(".AppSidebar-final-link");
      expect(finalLink.exists()).toBe(true);
    });
  });
});
