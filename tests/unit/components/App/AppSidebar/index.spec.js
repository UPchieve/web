import { shallowMount, createLocalVue } from "@vue/test-utils";
import { merge } from "lodash";
import Vuex from "vuex";
import { storeOptions } from "@/store";
import AppSidebar from "@/components/App/AppSidebar";
import SidebarInfo from "@/components/App/AppSidebar/SidebarInfo";
import SidebarLinks from "@/components/App/AppSidebar/SidebarLinks";

const localVue = createLocalVue();
localVue.use(Vuex);

const getWrapper = (options = {}) => {
  options = {
    mobileMode: false,
    showHeader: true,
    isSidebarCollapsed: true,
    isAuthenticated: true,
    ...options
  };

  const store = new Vuex.Store(
    merge({}, storeOptions, {
      modules: {
        app: {
          modules: {
            header: { state: { isShown: options.showHeader } },
            sidebar: { state: { isCollapsed: options.isSidebarCollapsed } }
          },
          getters: { mobileMode: () => options.mobileMode }
        },
        user: {
          getters: { isAuthenticated: () => options.isAuthenticated }
        }
      }
    })
  );

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

    it("has header class when `showHeader` is true", () => {
      let mobile = getWrapper({ mobileMode: true, showHeader: true });
      let desktop = getWrapper({ mobileMode: false, showHeader: true });
      expect(mobile.classes("AppSidebar--header")).toBe(true);
      expect(desktop.classes("AppSidebar--header")).toBe(true);

      mobile = getWrapper({ mobileMode: true, showHeader: false });
      desktop = getWrapper({ mobileMode: false, showHeader: false });
      expect(mobile.classes("AppSidebar--header")).toBe(false);
      expect(desktop.classes("AppSidebar--header")).toBe(false);
    });

    it("mobile", () => {
      const wrapper = getWrapper({ mobileMode: true });
      expect(wrapper.classes("AppSidebar")).toBe(true);

      const content = wrapper.find(".AppSidebar-content");
      expect(content.exists()).toBe(true);

      const info = content.find(SidebarInfo);
      expect(info.exists()).toBe(false);

      const links = content.find(SidebarLinks);
      expect(links.exists()).toBe(true);

      // Final link
      expect(content.find(".AppSidebar-final-link").exists()).toBe(true);
      expect(content.find(".AppSidebar-final-link--desktop").exists()).toBe(
        false
      );
    });

    it("desktop", () => {
      const wrapper = getWrapper({ mobileMode: false });
      expect(wrapper.classes("AppSidebar")).toBe(true);

      const content = wrapper.find(".AppSidebar-content");
      expect(content.exists()).toBe(true);

      const info = content.find(SidebarInfo);
      expect(info.exists()).toBe(true);

      const links = content.find(SidebarLinks);
      expect(links.exists()).toBe(true);

      // Final link
      expect(content.find(".AppSidebar-final-link").exists()).toBe(true);
      expect(content.find(".AppSidebar-final-link--desktop").exists()).toBe(
        true
      );
    });
  });
});
