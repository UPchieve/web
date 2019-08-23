import { shallowMount, createLocalVue } from "@vue/test-utils";
import Vuex from "vuex";
import appModule from "@/store/modules/app";
import SubjectSelection from "@/views/DashboardView/StudentDashboard/SubjectSelection";
import SubjectCard from "@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectCard";

const localVue = createLocalVue();
localVue.use(Vuex);

const getWrapper = (mobileMode = false) => {
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

  return shallowMount(SubjectSelection, { localVue, store });
};

describe("SubjectSelection", () => {
  const cards = [
    { title: "Math Tutoring", topic: "math" },
    { title: "College Counseling", topic: "college" },
    {
      title: "Coming Soon",
      subtitle:
        "Check back soon for new help topics like SAT, ESL, and Science!",
      buttonText: "Suggest a help topic",
      routeTo: "/contact"
    }
  ];

  describe("layout", () => {
    test("mobile", () => {
      const wrapper = getWrapper(true);
      expect(wrapper.classes("SubjectSelection")).toBe(true);

      const p = wrapper.find("p");
      expect(p.exists()).toBe(true);
      expect(p.text()).toBe("Explore our subjects");

      const subjectCards = wrapper.findAll(SubjectCard);
      expect(subjectCards.length).toBe(cards.length);

      cards.forEach((card, i) => {
        for (let key in card)
          expect(subjectCards.at(i).props()[key]).toBe(card[key]);
      });
    });

    test("desktop", () => {
      const wrapper = getWrapper(false);
      expect(wrapper.classes("SubjectSelection")).toBe(true);

      const p = wrapper.find("p");
      expect(p.exists()).toBe(false);

      const subjectCards = wrapper.findAll(SubjectCard);
      expect(subjectCards.length).toBe(cards.length);

      cards.forEach((card, i) => {
        for (let key in card)
          expect(subjectCards.at(i).props()[key]).toBe(card[key]);
      });
    });
  });
});
