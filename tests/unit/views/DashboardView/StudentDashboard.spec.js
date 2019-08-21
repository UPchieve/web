import { shallowMount, createLocalVue } from "@vue/test-utils";
import StudentDashboard from "@/views/DashboardView/StudentDashboard";
import DashboardBanner from "@/views/DashboardView/DashboardBanner";
import SubjectSelection from "@/views/DashboardView/StudentDashboard/SubjectSelection";

const localVue = createLocalVue();
const getWrapper = () => shallowMount(StudentDashboard, { localVue });

describe("StudentDashboard", () => {
  test("layout", () => {
    const wrapper = getWrapper();
    expect(wrapper.classes("StudentDashboard")).toBe(true);

    const banner = wrapper.find(DashboardBanner);
    expect(banner.exists()).toBe(true);

    const selection = wrapper.find(SubjectSelection);
    expect(selection.exists()).toBe(true);
  });
});
