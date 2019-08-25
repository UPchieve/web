import modalModule from "@/store/modules/app/modal";

const { state, mutations, actions } = modalModule;

describe("`app/modal` store module", () => {
  it("state", () => {
    expect(state).toEqual({
      component: null,
      data: {},
      isShown: false
    });
  });

  describe("mutations", () => {
    it("setComponent", () => {
      expect(typeof mutations.setComponent).toBe("function");
      const state = { component: null };
      const expected = "component";
      mutations.setComponent(state, expected);
      expect(state.component).toBe(expected);
    });

    it("setData", () => {
      expect(typeof mutations.setData).toBe("function");
      const state = { data: null };
      const expected = {};
      mutations.setData(state, expected);
      expect(state.data).toBe(expected);
    });

    it("setIsShown", () => {
      expect(typeof mutations.setIsShown).toBe("function");
      const state = { isShown: false };
      mutations.setIsShown(state, true);
      expect(state.isShown).toBe(true);
    });
  });

  describe("actions", () => {
    it("show", () => {
      expect(typeof actions.show).toBe("function");
      const commit = jest.fn();
      const payload = { component: "component", data: {} };
      actions.show({ commit }, payload);
      expect(commit).toHaveBeenNthCalledWith(1, "setIsShown", true);
      expect(commit).toHaveBeenNthCalledWith(
        2,
        "setComponent",
        payload.component
      );
      expect(commit).toHaveBeenNthCalledWith(3, "setData", payload.data);
    });

    it("hide", () => {
      expect(typeof actions.hide).toBe("function");
      const commit = jest.fn();
      actions.hide({ commit });
      expect(commit).toHaveBeenNthCalledWith(1, "setIsShown", false);
      expect(commit).toHaveBeenNthCalledWith(2, "setComponent", null);
      expect(commit).toHaveBeenNthCalledWith(3, "setData", {});
    });
  });
});
