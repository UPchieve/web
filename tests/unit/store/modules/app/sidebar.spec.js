import sidebarModule from "@/store/modules/app/sidebar";

const { state, mutations, actions } = sidebarModule;

describe("`app/sidebar` store module", () => {
  it("state", () => {
    expect(state).toEqual({
      isShown: false,
      isCollapsed: true
    });
  });

  describe("mutations", () => {
    it("setIsShown", () => {
      expect(typeof mutations.setIsShown).toBe("function");
      const state = { isShown: false };
      mutations.setIsShown(state, true);
      expect(state.isShown).toBe(true);
    });

    it("setIsCollapsed", () => {
      expect(typeof mutations.setIsCollapsed).toBe("function");
      const state = { isCollapsed: true };
      mutations.setIsCollapsed(state, false);
      expect(state.isCollapsed).toBe(false);
    });
  });

  describe("actions", () => {
    it("show", () => {
      expect(typeof actions.show).toBe("function");
      const dispatch = jest.fn();
      const commit = jest.fn();
      actions.show({ dispatch, commit });
      expect(dispatch).toHaveBeenCalledWith("collapse");
      expect(commit).toHaveBeenCalledWith("setIsShown", true);
    });

    it("hide", () => {
      expect(typeof actions.hide).toBe("function");
      const dispatch = jest.fn();
      const commit = jest.fn();
      actions.hide({ dispatch, commit });
      expect(dispatch).toHaveBeenCalledWith("collapse");
      expect(commit).toHaveBeenCalledWith("setIsShown", false);
    });

    it("collapse", () => {
      expect(typeof actions.collapse).toBe("function");
      const commit = jest.fn();
      actions.collapse({ commit });
      expect(commit).toHaveBeenCalledWith("setIsCollapsed", true);
    });

    it("expand", () => {
      expect(typeof actions.expand).toBe("function");
      const commit = jest.fn();
      actions.expand({ commit });
      expect(commit).toHaveBeenCalledWith("setIsCollapsed", false);
    });
  });
});
