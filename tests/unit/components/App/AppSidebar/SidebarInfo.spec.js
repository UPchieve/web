import { shallowMount, createLocalVue } from "@vue/test-utils";
import Vuex from "vuex";
import store from "@/store";
import SidebarInfo from "@/components/App/AppSidebar/SidebarInfo";

const localVue = createLocalVue();
localVue.use(Vuex);

const getWrapper = propsData =>
  shallowMount(SidebarInfo, { localVue, store, propsData });

describe("SidebarInfo", () => {
  test("layout", () => {
    const loggedIn = getWrapper({ authenticated: true });
    const loggedOut = getWrapper({ authenticated: false });

    expect(loggedIn.classes("SidebarInfo")).toBe(true);
    expect(loggedOut.classes("SidebarInfo")).toBe(true);

    expect(loggedIn.find(".SidebarInfo-avatar").exists()).toBe(true);
    expect(loggedOut.find(".SidebarInfo-avatar").exists()).toBe(false);

    expect(loggedIn.find(".SidebarInfo-name").exists()).toBe(true);
    expect(loggedOut.find(".SidebarInfo-name").exists()).toBe(false);

    expect(loggedIn.find(".SidebarInfo-type").exists()).toBe(true);
    expect(loggedOut.find(".SidebarInfo-type").exists()).toBe(false);

    expect(loggedIn.find(".SidebarInfo-status").exists()).toBe(true);
    expect(loggedOut.find(".SidebarInfo-status").exists()).toBe(false);
  });
});
