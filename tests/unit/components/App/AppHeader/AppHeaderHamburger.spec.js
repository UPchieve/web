import { shallowMount, createLocalVue } from "@vue/test-utils";
import Vuex from "vuex";
import appModule from "@/store/modules/app";
import AppHeaderHamburger from "@/components/App/AppHeader/AppHeaderHamburger";

const localVue = createLocalVue();
localVue.use(Vuex);

const getWrapper = (isSidebarCollapsed = true) => {
  const expandSidebar = jest.fn();
  const collapseSidebar = jest.fn();

  const store = new Vuex.Store({
    modules: {
      app: {
        ...appModule,
        state: {
          ...appModule.state,
          isSidebarCollapsed
        },
        actions: {
          expandSidebar,
          collapseSidebar
        }
      }
    }
  });

  return {
    wrapper: shallowMount(AppHeaderHamburger, { localVue, store }),
    expandSidebar,
    collapseSidebar
  };
};

describe("AppHeaderHamburger.vue", () => {
  it("renders expected elements", () => {
    const { wrapper } = getWrapper();
    expect(wrapper.classes()).toEqual(["AppHeaderHamburger"]);
  });

  it("calls handleClick when clicked", () => {
    const handleClick = jest.fn();
    const { wrapper } = getWrapper(true);
    wrapper.setMethods({ handleClick });
    wrapper.trigger("click");
    expect(handleClick).toHaveBeenCalled();
  });

  it("expands sidebar if collapsed when clicked", () => {
    const { wrapper, expandSidebar } = getWrapper(true);
    wrapper.trigger("click");
    expect(expandSidebar).toHaveBeenCalled();
  });

  it("collapses sidebar if expanded when clicked", () => {
    const { wrapper, collapseSidebar } = getWrapper(false);
    wrapper.trigger("click");
    expect(collapseSidebar).toHaveBeenCalled();
  });
});
