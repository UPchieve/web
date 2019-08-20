import { shallowMount, createLocalVue } from "@vue/test-utils";
import Vuex from "vuex";
import appModule from "@/store/modules/app";
import AppHeader from "@/components/App/AppHeader";
import HamburgerButton from "@/components/App/AppHeader/HamburgerButton";

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

describe("AppHeader", () => {
  it("renders expected elements when in mobile mode", () => {
    const wrapper = getWrapper(true);
    expect(wrapper.classes()).toEqual(["AppHeader"]);

    // User info
    const userInfo = wrapper.find(".AppHeader-user-info");
    expect(userInfo.exists()).toBe(true);
    expect(userInfo.is("div")).toBe(true);

    const avatar = userInfo.find(".AppHeader-user-info-avatar");
    expect(avatar.exists()).toBe(true);
    expect(avatar.is("img")).toBe(true);

    const name = userInfo.find(".AppHeader-user-info-name");
    expect(name.exists()).toBe(true);
    expect(name.is("span")).toBe(true);
    wrapper.setData({ name: "UPchieve" });
    expect(name.text()).toBe("UPchieve");

    // Hamburger
    expect(wrapper.find(HamburgerButton).exists()).toBe(true);
  });

  it("renders expected elements when not in mobile mode", () => {
    const wrapper = getWrapper();
    const logo = wrapper.find(".AppHeader-logo");
    expect(logo.exists()).toBe(true);
    expect(logo.is("img")).toBe(true);
    expect(logo.attributes("src")).toBeDefined();
  });
});
