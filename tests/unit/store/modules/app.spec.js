import appModule from "@/store/modules/app";
const { mutations, actions } = appModule;

describe("app store module", () => {
  describe("mutations", () => {
    it("setHideHeader", () => {
      expect(typeof mutations.setHideHeader).toBe("function");
      const state = { hideHeader: false };

      mutations.setHideHeader(state, true);
      expect(state.hideHeader).toBe(true);

      mutations.setHideHeader(state, false);
      expect(state.hideHeader).toBe(false);
    });

    it("setHideSidebar", () => {
      expect(typeof mutations.setHideSidebar).toBe("function");
      const state = { hideSidebar: false };

      mutations.setHideSidebar(state, true);
      expect(state.hideSidebar).toBe(true);

      mutations.setHideSidebar(state, false);
      expect(state.hideSidebar).toBe(false);
    });
  });

  describe("actions", () => {
    it("showHeader", () => {
      expect(typeof actions.showHeader).toBe("function");
      const commit = jest.fn();
      actions.showHeader({ commit });
      expect(commit).toHaveBeenCalledWith("setHideHeader", false);
    });

    it("hideHeader", () => {
      expect(typeof actions.hideHeader).toBe("function");
      const commit = jest.fn();
      actions.hideHeader({ commit });
      expect(commit).toHaveBeenCalledWith("setHideHeader", true);
    });

    it("showSidebar", () => {
      expect(typeof actions.showSidebar).toBe("function");
      const commit = jest.fn();
      actions.showSidebar({ commit });
      expect(commit).toHaveBeenCalledWith("setHideSidebar", false);
    });

    it("hideSidebar", () => {
      expect(typeof actions.hideSidebar).toBe("function");
      const commit = jest.fn();
      actions.hideSidebar({ commit });
      expect(commit).toHaveBeenCalledWith("setHideSidebar", true);
    });

    it("showNavigation", () => {
      expect(typeof actions.showNavigation).toBe("function");
      const commit = jest.fn();
      actions.showNavigation({ commit });
      expect(commit).toHaveBeenNthCalledWith(1, "setHideHeader", false);
      expect(commit).toHaveBeenNthCalledWith(2, "setHideSidebar", false);
    });

    it("hideNavigation", () => {
      expect(typeof actions.hideNavigation).toBe("function");
      const commit = jest.fn();
      actions.hideNavigation({ commit });
      expect(commit).toHaveBeenNthCalledWith(1, "setHideHeader", true);
      expect(commit).toHaveBeenNthCalledWith(2, "setHideSidebar", true);
    });
  });
});
