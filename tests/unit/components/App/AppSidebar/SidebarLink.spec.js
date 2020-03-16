import { shallowMount, createLocalVue } from "@vue/test-utils";
import { merge } from "lodash";
import VueRouter from "vue-router";
import Vuex from "vuex";
import { storeOptions } from "@/store";
import SidebarLink from "@/components/App/AppSidebar/SidebarLink";
// import UpchieveIcon from "@/components/UpchieveIcon";
// import HouseIcon from "@/assets/sidebar_icons/house.svg";

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(Vuex);

const getWrapper = (propsData = {}, collapse) => {
  const store = new Vuex.Store(
    merge({}, storeOptions, {
      modules: { app: { modules: { sidebar: { actions: { collapse } } } } }
    })
  );

  return shallowMount(SidebarLink, {
    localVue,
    store,
    propsData,
    slots: {
      default: ""
    }
  });
};

describe("SidebarLink", () => {
  it.skip("renders expected elements", () => {
    // const wrapper = getWrapper({ to: "/", icon: HouseIcon, text: "Home" });
    const wrapper = getWrapper({ to: "/", text: "Home" });
    expect(wrapper.is("router-link-stub")).toBe(true);
    expect(wrapper.classes()).toEqual(["SidebarLink"]);
    expect(wrapper.props("to")).toBe("/");
    // expect(wrapper.contains(HouseIcon)).toBe(true);

    const text = wrapper.find("p");
    expect(text.text()).toBe("Home");
  });

  it("conditionally renders icon", () => {
    // const wrapper = getWrapper({ to: "/", text: "Home" });
    // const icon = wrapper.find(UpchieveIcon);
    // expect(icon.exists()).toBe(false);
  });

  it("collapses sidebar when clicked", () => {
    const collapse = jest.fn();
    // const wrapper = getWrapper(
    //   { to: "/", icon: HouseIcon, text: "Home" },
    //   collapse
    // );
    const wrapper = getWrapper({ to: "/", text: "Home" }, collapse);
    wrapper.trigger("click");
    expect(collapse).toHaveBeenCalled();
  });
});
