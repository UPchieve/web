import { shallowMount, createLocalVue } from "@vue/test-utils";
import { merge } from "lodash";
import Vuex from "vuex";
import { storeOptions } from "@/store";
import DefaultHeader from "@/components/App/AppHeader/DefaultHeader";
import HamburgerButton from "@/components/App/AppHeader/DefaultHeader/HamburgerButton";

const localVue = createLocalVue();
localVue.use(Vuex);

const getWrapper = (mobileMode = false) => {
  const store = new Vuex.Store(
    merge({}, storeOptions, {
      modules: {
        app: { getters: { mobileMode: () => mobileMode } },
        user: { getters: { firstName: () => "Tester" } }
      }
    })
  );

  return shallowMount(DefaultHeader, {
    localVue,
    store,
    stubs: ["router-link", "router-view"]
  });
};

describe("DefaultHeader", () => {
  it("renders expected elements when in mobile mode", () => {
    const wrapper = getWrapper(true);
    expect(wrapper.classes()).toEqual(["DefaultHeader"]);

    // User info
    const userInfo = wrapper.find(".DefaultHeader-user-info");
    expect(userInfo.exists()).toBe(true);
    expect(userInfo.is("div")).toBe(true);

    const avatar = userInfo.find(".DefaultHeader-user-info-avatar");
    expect(avatar.exists()).toBe(true);
    expect(avatar.is("img")).toBe(true);

    const name = userInfo.find(".DefaultHeader-user-info-name");
    expect(name.exists()).toBe(true);
    expect(name.is("span")).toBe(true);
    expect(name.text()).toBe("Tester");

    // Hamburger
    expect(wrapper.find(HamburgerButton).exists()).toBe(true);
  });

  it("renders expected elements when not in mobile mode", () => {
    const wrapper = getWrapper();
    const logo = wrapper.find(".DefaultHeader-logo");
    expect(logo.exists()).toBe(true);
    expect(logo.is("img")).toBe(true);
    expect(logo.attributes("src")).toBeDefined();
  });
});
