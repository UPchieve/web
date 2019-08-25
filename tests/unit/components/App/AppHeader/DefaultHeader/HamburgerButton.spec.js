import { shallowMount, createLocalVue } from "@vue/test-utils";
import { merge } from "lodash";
import Vuex from "vuex";
import { storeOptions } from "@/store";
import HamburgerButton from "@/components/App/AppHeader/DefaultHeader/HamburgerButton";

const localVue = createLocalVue();
localVue.use(Vuex);

const expand = jest.fn();
const collapse = jest.fn();

const getWrapper = (isCollapsed = true) => {
  const store = new Vuex.Store(
    merge({}, storeOptions, {
      modules: {
        app: {
          modules: {
            sidebar: {
              state: { isCollapsed },
              actions: { expand, collapse }
            }
          }
        }
      }
    })
  );

  return shallowMount(HamburgerButton, { localVue, store });
};

describe("HamburgerButton", () => {
  it("renders expected elements", () => {
    const wrapper = getWrapper(true);
    expect(wrapper.classes()).toEqual(["HamburgerButton"]);
  });

  it("renders 'hamburger' if sidebar is collapsed", () => {
    const wrapper = getWrapper(true);
    expect(wrapper.vm.icon).toBe("hamburger");
  });

  it("renders 'cross' if sidebar is expanded", () => {
    const wrapper = getWrapper(false);
    expect(wrapper.vm.icon).toBe("cross");
  });

  it("calls handleClick when clicked", () => {
    const handleClick = jest.fn();
    const wrapper = getWrapper(true);
    wrapper.setMethods({ handleClick });
    wrapper.trigger("click");
    expect(handleClick).toHaveBeenCalled();
  });

  it("expands sidebar if collapsed when clicked", () => {
    const wrapper = getWrapper(true);
    wrapper.trigger("click");
    expect(expand).toHaveBeenCalled();
  });

  it("collapses sidebar if expanded when clicked", () => {
    const wrapper = getWrapper(false);
    wrapper.trigger("click");
    expect(collapse).toHaveBeenCalled();
  });
});
