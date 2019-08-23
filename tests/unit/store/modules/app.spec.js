import appModule from "@/store/modules/app";
import { MAX_MOBILE_MODE_WIDTH } from "@/consts";

const { mutations, actions, getters } = appModule;

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

    it("setIsSidebarCollapsed", () => {
      expect(typeof mutations.setIsSidebarCollapsed).toBe("function");
      const state = { isSidebarCollapsed: true };

      mutations.setIsSidebarCollapsed(state, false);
      expect(state.isSidebarCollapsed).toBe(false);

      mutations.setIsSidebarCollapsed(state, true);
      expect(state.isSidebarCollapsed).toBe(true);
    });

    it("setModalType", () => {
      expect(typeof mutations.setModalType).toBe("function");
      const state = { modalType: null };

      mutations.setModalType(state, "SubjectModal");
      expect(state.modalType).toBe("SubjectModal");
    });

    it("setModalData", () => {
      expect(typeof mutations.setModalData).toBe("function");
      const state = { modalData: null };
      const data = { subject: "math" };

      mutations.setModalData(state, data);
      expect(state.modalData).toBe(data);
    });

    it("setIsModalShown", () => {
      expect(typeof mutations.setIsModalShown).toBe("function");
      const state = { isModalShown: false };

      mutations.setIsModalShown(state, true);
      expect(state.isModalShown).toBe(true);

      mutations.setIsModalShown(state, false);
      expect(state.isModalShown).toBe(false);
    });

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

    it("collapseSidebar", () => {
      expect(typeof actions.collapseSidebar).toBe("function");
      const commit = jest.fn();
      actions.collapseSidebar({ commit });
      expect(commit).toHaveBeenCalledWith("setIsSidebarCollapsed", true);
    });

    it("expandSidebar", () => {
      expect(typeof actions.expandSidebar).toBe("function");
      const commit = jest.fn();
      actions.expandSidebar({ commit });
      expect(commit).toHaveBeenCalledWith("setIsSidebarCollapsed", false);
    });

    it("showModal", () => {
      expect(typeof actions.showModal).toBe("function");
      const commit = jest.fn();
      const data = { modalType: "TestModal", modalData: "Test data." };
      actions.showModal({ commit }, data);
      expect(commit).toHaveBeenNthCalledWith(1, "setIsModalShown", true);
      expect(commit).toHaveBeenNthCalledWith(2, "setModalType", data.modalType);
      expect(commit).toHaveBeenNthCalledWith(3, "setModalData", data.modalData);
    });

    it("hideModal", () => {
      expect(typeof actions.hideModal).toBe("function");
      const commit = jest.fn();
      actions.hideModal({ commit });
      expect(commit).toHaveBeenNthCalledWith(1, "setIsModalShown", false);
      expect(commit).toHaveBeenNthCalledWith(2, "setModalType", null);
      expect(commit).toHaveBeenNthCalledWith(3, "setModalData", null);
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
