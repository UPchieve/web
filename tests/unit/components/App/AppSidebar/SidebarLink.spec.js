import { shallowMount, createLocalVue } from "@vue/test-utils";
import { merge } from "lodash";
import VueRouter from "vue-router";
import Vuex from "vuex";
import { storeOptions } from "@/store";
import SidebarLink from "@/components/App/AppSidebar/SidebarLink";
import UpchieveIcon from "@/components/UpchieveIcon";

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(Vuex);

const getWrapper = (propsData = {}, collapse) => {
  const store = new Vuex.Store(
    merge({}, storeOptions, {
      modules: { app: { modules: { sidebar: { actions: { collapse } } } } }
    })
  );

  return shallowMount(SidebarLink, { localVue, store, propsData });
};

describe("SidebarLink", () => {
  it("renders expected elements", () => {
    const wrapper = getWrapper({ to: "/", icon: "house", text: "Home" });
    expect(wrapper.is("router-link-stub")).toBe(true);
    expect(wrapper.classes()).toEqual(["SidebarLink"]);
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
    const collapse = jest.fn();
    const wrapper = getWrapper(
      { to: "/", icon: "house", text: "Home" },
      collapse
    );
    wrapper.trigger("click");
    expect(collapse).toHaveBeenCalled();
  });
});
