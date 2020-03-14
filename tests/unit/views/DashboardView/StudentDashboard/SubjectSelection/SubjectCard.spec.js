import { shallowMount, createLocalVue } from "@vue/test-utils";
import { merge } from "lodash";
import Vuex from "vuex";
import { storeOptions } from "@/store";
import SubjectCard from "@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectCard";
import HyperlinkButton from "@/components/HyperlinkButton";
import LargeButton from "@/components/LargeButton";
// import TestIcon from "@/assets/sidebar_icons/house.svg";

const localVue = createLocalVue();
localVue.use(Vuex);

const getWrapper = (mobileMode = false, propsData) => {
  const store = new Vuex.Store(
    merge({}, storeOptions, {
      modules: { app: { getters: { mobileMode: () => mobileMode } } }
    })
  );

  return shallowMount(SubjectCard, { localVue, store, propsData });
};

describe("SubjectCard", () => {
  describe("layout", () => {
    const propsData = {
      title: "Test Subject",
      subtitle: "Fake subtitle.",
      svg: {},
      subtopics: ["Subject 1", "Subject 2", "Subject 3"],
      buttonText: "Test Button"
    };

    describe("mobile", () => {
      test("layout", () => {
        const wrapper = getWrapper(true, propsData);
        expect(wrapper.classes("SubjectCard")).toBe(true);

        // const icon = wrapper.find(".SubjectCard-icon");
        // expect(icon.contains(propsData.svg)).toBe(true);

        const title = wrapper.find(".SubjectCard-title");
        expect(title.exists()).toBe(true);
        expect(title.text()).toBe(propsData.title);

        const subtitle = wrapper.find(".SubjectCard-subtitle");
        expect(subtitle.exists()).toBe(false);
      });

      test("link button", () => {
        const wrapper = getWrapper(true, propsData);

        // No `routeTo`
        let handleClick = jest.fn();
        wrapper.setMethods({ handleClick });
        wrapper.setProps({ routeTo: null });

        const button = wrapper.find(HyperlinkButton);
        expect(button.exists()).toBe(true);
        expect(button.text()).toBe(propsData.buttonText);
        expect(button.props().routeTo).toBeUndefined();
        button.trigger("click");
        expect(handleClick).toHaveBeenCalled();

        // With `routeTo`
        handleClick = jest.fn();
        wrapper.setMethods({ handleClick });
        wrapper.setProps({ routeTo: "/test" });

        const routeButton = wrapper.find(HyperlinkButton);
        expect(routeButton.exists()).toBe(true);
        expect(routeButton.text()).toBe(propsData.buttonText);
        expect(routeButton.props().routeTo).toBe("/test");
        routeButton.trigger("click");
        expect(handleClick).not.toHaveBeenCalled();
      });
    });

    describe("desktop", () => {
      test("layout", () => {
        const wrapper = getWrapper(false, propsData);
        expect(wrapper.classes("SubjectCard")).toBe(true);

        // const icon = wrapper.find(".SubjectCard-icon");
        // expect(icon.contains(propsData.svg)).toBe(true);

        const title = wrapper.find(".SubjectCard-title");
        expect(title.exists()).toBe(true);
        expect(title.text()).toBe(propsData.title);

        const subtitle = wrapper.find(".SubjectCard-subtitle");
        expect(subtitle.exists()).toBe(true);
        expect(subtitle.text()).toBe(propsData.subtitle);
      });

      test("link button", () => {
        const wrapper = getWrapper(false, propsData);

        // No `routeTo`
        let handleClick = jest.fn();
        wrapper.setMethods({ handleClick });
        wrapper.setProps({ routeTo: null });

        const button = wrapper.find(LargeButton);
        expect(button.exists()).toBe(true);
        expect(button.text()).toBe(propsData.buttonText);
        expect(button.props().routeTo).toBeUndefined();
        button.trigger("click");
        expect(handleClick).toHaveBeenCalled();

        // With `routeTo`
        handleClick = jest.fn();
        wrapper.setMethods({ handleClick });
        wrapper.setProps({ routeTo: "/test" });

        const routeButton = wrapper.find(HyperlinkButton);
        expect(routeButton.exists()).toBe(true);
        expect(routeButton.text()).toBe(propsData.buttonText);
        expect(routeButton.props().routeTo).toBe("/test");
        routeButton.trigger("click");
        expect(handleClick).not.toHaveBeenCalled();
      });
    });
  });
});
