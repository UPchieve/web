import { shallowMount, createLocalVue } from "@vue/test-utils";
import Vuex from "vuex";
import AppSidebarInfo from "@/components/App/AppSidebar/AppSidebarInfo";

const localVue = createLocalVue();
localVue.use(Vuex);

const getWrapper = propsData =>
  shallowMount(AppSidebarInfo, { localVue, propsData });

describe("AppSidebarInfo", () => {
  test("layout", () => {
    const loggedIn = getWrapper({ authenticated: true });
    const loggedOut = getWrapper({ authenticated: false });

    expect(loggedIn.classes("AppSidebarInfo")).toBe(true);
    expect(loggedOut.classes("AppSidebarInfo")).toBe(true);

    expect(loggedIn.find(".AppSidebarInfo-description").exists()).toBe(false);
    expect(loggedOut.find(".AppSidebarInfo-description").exists()).toBe(true);

    expect(loggedIn.find(".AppSidebarInfo-avatar").exists()).toBe(true);
    expect(loggedOut.find(".AppSidebarInfo-avatar").exists()).toBe(false);

    expect(loggedIn.find(".AppSidebarInfo-name").exists()).toBe(true);
    expect(loggedOut.find(".AppSidebarInfo-name").exists()).toBe(false);

    expect(loggedIn.find(".AppSidebarInfo-type").exists()).toBe(true);
    expect(loggedOut.find(".AppSidebarInfo-type").exists()).toBe(false);

    expect(loggedIn.find(".AppSidebarInfo-status").exists()).toBe(true);
    expect(loggedOut.find(".AppSidebarInfo-status").exists()).toBe(false);
  });
});
