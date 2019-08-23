import { shallowMount, createLocalVue } from "@vue/test-utils";
import Vuex from "vuex";
import appModule from "@/store/modules/app";
import AppModal from "@/components/App/AppModal";
import ModalTemplate from "@/components/App/AppModal/ModalTemplate";
import SubjectSelectionModal from "@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectSelectionModal";

const localVue = createLocalVue();
localVue.use(Vuex);

const getWrapper = (appState = {}) => {
  const store = new Vuex.Store({
    modules: {
      app: {
        ...appModule,
        state: {
          ...appModule.state,
          ...appState
        }
      }
    }
  });

  return shallowMount(AppModal, { localVue, store });
};

describe("AppModal", () => {
  it("renders ModalTemplate", () => {
    const modalData = { backText: "Back", acceptText: "Okay" };
    const state = { modalData };
    const wrapper = getWrapper(state);
    const modal = wrapper.find(ModalTemplate);
    expect(modal.exists()).toBe(true);
    expect(modal.props().backText).toEqual(state.modalData.backText);
    expect(modal.props().acceptText).toEqual(state.modalData.acceptText);
  });

  it("renders SubjectSelectionModal", () => {
    const state = {
      modalType: "SubjectSelectionModal",
      modalData: { subject: "math" }
    };
    const wrapper = getWrapper(state).find(ModalTemplate);
    const modal = wrapper.find(SubjectSelectionModal);
    expect(modal.exists()).toBe(true);
    expect(modal.props().modalData).toEqual(state.modalData);
  });
});
