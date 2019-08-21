import { shallowMount, createLocalVue } from "@vue/test-utils";
import DashboardView from "@/views/DashboardView";
import VolunteerDashboard from "@/views/DashboardView/VolunteerDashboard";
import StudentDashboard from "@/views/DashboardView/StudentDashboard";

const localVue = createLocalVue();
const getWrapper = () => shallowMount(DashboardView, { localVue });

describe("DashboardView", () => {
  it("renders StudentDashboard", () => {
    const wrapper = getWrapper();
    wrapper.setData({ user: { isVolunteer: false } });
    expect(wrapper.is(StudentDashboard));
  });

  it("renders VolunteerDashboard", () => {
    const wrapper = getWrapper();
    wrapper.setData({ user: { isVolunteer: true } });
    expect(wrapper.is(VolunteerDashboard));
  });
});
