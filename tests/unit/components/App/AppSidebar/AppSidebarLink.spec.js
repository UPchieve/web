import { shallowMount, createLocalVue } from "@vue/test-utils";
import VueRouter from "vue-router";
import Vuex from "vuex";
import appModule from "@/store/modules/app";
import AppSidebarLink from "@/components/App/AppSidebar/AppSidebarLink";
import UpchieveIcon from "@/components/UpchieveIcon";

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(Vuex);

const getWrapper = (propsData = {}, app = {}) => {
  const store = new Vuex.Store({
    modules: {
      app: {
        ...appModule,
        actions: {
          ...appModule.actions,
          ...app.actions
        }
      }
    }
  });

  return shallowMount(AppSidebarLink, { localVue, store, propsData });
};

describe("AppSidebarLink", () => {
  it("renders expected elements", () => {
    const wrapper = getWrapper({ to: "/", icon: "house", text: "Home" });
    expect(wrapper.is("router-link-stub")).toBe(true);
    expect(wrapper.classes()).toEqual(["AppSidebarLink"]);
    expect(wrapper.props("to")).toBe("/");

    const icon = wrapper.find(UpchieveIcon);
    expect(icon.exists()).toBe(true);
    expect(icon.props("icon")).toBe("house");

    const text = wrapper.find("p");
    expect(text.text()).toBe("Home");
  });

  it("conditionally renders icon", () => {
    const wrapper = getWrapper({ to: "/", text: "Home" });
    const icon = wrapper.find(UpchieveIcon);
    expect(icon.exists()).toBe(false);
  });

  it("collapses sidebar when clicked", () => {
    const collapseSidebar = jest.fn();
    const wrapper = getWrapper(
      { to: "/", icon: "house", text: "Home" },
      { actions: { collapseSidebar } }
    );
    wrapper.trigger("click");
    expect(collapseSidebar).toHaveBeenCalled();
  });
});
