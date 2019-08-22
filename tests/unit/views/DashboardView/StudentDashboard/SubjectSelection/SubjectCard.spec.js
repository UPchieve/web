import { shallowMount, createLocalVue } from "@vue/test-utils";
import Vuex from "vuex";
import appModule from "@/store/modules/app";
import SubjectCard from "@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectCard";
import HyperlinkButton from "@/components/HyperlinkButton";
import LargeButton from "@/components/LargeButton";

const localVue = createLocalVue();
localVue.use(Vuex);

const getWrapper = (mobileMode = false, propsData) => {
  const store = new Vuex.Store({
    modules: {
      app: {
        ...appModule,
        getters: {
          mobileMode: () => mobileMode
        }
      }
    }
  });

  return shallowMount(SubjectCard, { localVue, store, propsData });
};

describe("SubjectCard", () => {
  describe("layout", () => {
    const propsData = {
      title: "Test Subject",
      subtitle: "Fake subtitle.",
      svgUrl: "test_url.svg",
      subjects: ["Subject 1", "Subject 2", "Subject 3"],
      buttonText: "Test Button"
    };

    test("mobile", () => {
      const wrapper = getWrapper(true, propsData);
      expect(wrapper.classes("SubjectCard")).toBe(true);

      const icon = wrapper.find(".SubjectCard-icon");
      expect(icon.exists()).toBe(true);
      expect(icon.is("img")).toBe(true);
      expect(icon.attributes("src")).toBe(propsData.svgUrl);

      const title = wrapper.find(".SubjectCard-title");
      expect(title.exists()).toBe(true);
      expect(title.text()).toBe(propsData.title);

      const subtitle = wrapper.find(".SubjectCard-subtitle");
      expect(subtitle.exists()).toBe(false);

      const button = wrapper.find(HyperlinkButton);
      expect(button.exists()).toBe(true);
      expect(button.text()).toBe(propsData.buttonText);
    });

    test("desktop", () => {
      const wrapper = getWrapper(false, propsData);
      expect(wrapper.classes("SubjectCard")).toBe(true);

      const icon = wrapper.find(".SubjectCard-icon");
      expect(icon.exists()).toBe(true);
      expect(icon.is("img")).toBe(true);
      expect(icon.attributes("src")).toBe(propsData.svgUrl);

      const title = wrapper.find(".SubjectCard-title");
      expect(title.exists()).toBe(true);
      expect(title.text()).toBe(propsData.title);

      const subtitle = wrapper.find(".SubjectCard-subtitle");
      expect(subtitle.exists()).toBe(true);
      expect(subtitle.text()).toBe(propsData.subtitle);

      const button = wrapper.find(LargeButton);
      expect(button.exists()).toBe(true);
      expect(button.text()).toBe(propsData.buttonText);
    });
  });
});
