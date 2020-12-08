import { MAX_MOBILE_MODE_WIDTH } from "@/consts";
import appModule from "@/store/modules/app";
import headerModule from "@/store/modules/app/header";
import sidebarModule from "@/store/modules/app/sidebar";
import modalModule from "@/store/modules/app/modal";

const { modules, state, mutations, actions, getters } = appModule;

describe("`app` store module", () => {
  it("modules", () => {
    expect(modules.header).toBe(headerModule);
    expect(modules.sidebar).toBe(sidebarModule);
    expect(modules.modal).toBe(modalModule);
  });

  it("state", () => {
    expect(state).toEqual({
      windowWidth: 0,
      windowHeight: 0,
      isMobileApp: false,
      isWebPageHidden: false
    });
  });

  describe("mutations", () => {
    it("setWindowWidth", () => {
      expect(typeof mutations.setWindowWidth).toBe("function");
      const state = { windowWidth: 0 };

      mutations.setWindowWidth(state, 100);
      expect(state.windowWidth).toBe(100);

      mutations.setWindowWidth(state, -100);
      expect(state.windowWidth).toBe(0);
    });

    it("setWindowHeight", () => {
      expect(typeof mutations.setWindowHeight).toBe("function");
      const state = { windowHeight: 0 };

      mutations.setWindowHeight(state, 100);
      expect(state.windowHeight).toBe(100);

      mutations.setWindowHeight(state, -100);
      expect(state.windowHeight).toBe(0);
    });
  });

  describe("actions", () => {
    it("showNavigation", () => {
      expect(typeof actions.showNavigation).toBe("function");
      const dispatch = jest.fn();
      actions.showNavigation({ dispatch });
      expect(dispatch).toHaveBeenNthCalledWith(1, "header/show");
      expect(dispatch).toHaveBeenNthCalledWith(2, "sidebar/show");
    });

    it("hideNavigation", () => {
      expect(typeof actions.hideNavigation).toBe("function");
      const dispatch = jest.fn();
      actions.hideNavigation({ dispatch });
      expect(dispatch).toHaveBeenNthCalledWith(1, "header/hide");
      expect(dispatch).toHaveBeenNthCalledWith(2, "sidebar/hide");
    });

    it("windowResize", () => {
      expect(typeof actions.windowResize).toBe("function");
      const commit = jest.fn();
      const width = 800;
      const height = 600;
      actions.windowResize({ commit }, { width, height });
      expect(commit).toHaveBeenNthCalledWith(1, "setWindowWidth", width);
      expect(commit).toHaveBeenNthCalledWith(2, "setWindowHeight", height);
    });
  });

  describe("getters", () => {
    it("mobileMode", () => {
      expect(getters.mobileMode({ windowWidth: 0 })).toBe(true);
      expect(getters.mobileMode({ windowWidth: MAX_MOBILE_MODE_WIDTH })).toBe(
        true
      );
      expect(
        getters.mobileMode({ windowWidth: MAX_MOBILE_MODE_WIDTH + 1 })
      ).toBe(false);
    });
  });
});
