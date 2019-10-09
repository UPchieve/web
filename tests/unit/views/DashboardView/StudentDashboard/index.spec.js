import { shallowMount, createLocalVue } from "@vue/test-utils";
import Vuex from "vuex";
import store from "@/store";
import StudentDashboard from "@/views/DashboardView/StudentDashboard";
import DashboardBanner from "@/views/DashboardView/DashboardBanner";
import SubjectSelection from "@/views/DashboardView/StudentDashboard/SubjectSelection";

const localVue = createLocalVue();
localVue.use(Vuex);

const getWrapper = () => shallowMount(StudentDashboard, { localVue, store });

describe("StudentDashboard", () => {
  test("layout", () => {
    const wrapper = getWrapper();
    expect(wrapper.classes("student-dashboard")).toBe(true);

    const banner = wrapper.find(DashboardBanner);
    expect(banner.exists()).toBe(true);

    const selection = wrapper.find(SubjectSelection);
    expect(selection.exists()).toBe(true);
  });
});
