import { shallowMount, createLocalVue } from "@vue/test-utils";
import { merge } from "lodash";
import Vuex from "vuex";
import { storeOptions } from "@/store";
import AppModal from "@/components/App/AppModal";
import ModalTemplate from "@/components/App/AppModal/ModalTemplate";
import SubjectSelectionModal from "@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectSelectionModal";

const localVue = createLocalVue();
localVue.use(Vuex);

const getWrapper = (state = {}) => {
  state = { component: null, data: {}, ...state };

  const store = new Vuex.Store(
    merge({}, storeOptions, {
      modules: { app: { modules: { modal: { state } } } }
    })
  );

  return shallowMount(AppModal, { localVue, store });
};

describe("AppModal", () => {
  it("renders ModalTemplate", () => {
    const state = { data: { backText: "Back", acceptText: "Okay" } };
    const wrapper = getWrapper(state);
    const modal = wrapper.find(ModalTemplate);
    expect(modal.exists()).toBe(true);
    expect(modal.props().backText).toEqual(state.data.backText);
    expect(modal.props().acceptText).toEqual(state.data.acceptText);
  });

  it("renders SubjectSelectionModal", () => {
    const state = { component: "SubjectSelectionModal", data: {} };
    const wrapper = getWrapper(state).find(ModalTemplate);
    const modal = wrapper.find(SubjectSelectionModal);
    expect(modal.exists()).toBe(true);
    expect(modal.props().modalData).toEqual(state.data);
  });
});
