import { shallowMount, createLocalVue } from "@vue/test-utils";
import Vuex from "vuex";
import SidebarLinks from "@/components/App/AppSidebar/SidebarLinks";
import SidebarLink from "@/components/App/AppSidebar/SidebarLink";

const localVue = createLocalVue();
localVue.use(Vuex);

// General links
const CONTACT_LINK = { to: "/contact", icon: "envelope", text: "Contact us" };
const DASHBOARD_LINK = { to: "/dashboard", icon: "house", text: "Dashboard" };
const LEGAL_LINK = { to: "/legal", icon: "exclamation", text: "Legal policy" };
const PROFILE_LINK = { to: "/profile", icon: "portrait", text: "Profile" };
const RESOURCES_LINK = { to: "/resources", icon: "folder", text: "Resources" };

// Volunteer links
const CALENDAR_LINK = { to: "/calendar", icon: "calendar", text: "Schedule" };
const TRAINING_LINK = {
  to: "/training",
  icon: "graduation-cap",
  text: "Training"
};

// Admin links
const ADMIN_LINK = { to: "/admin", icon: "folder", text: "Admin" };

// Onboarding links
const BASIC_PROFILE_LINK = {
  to: "/onboarding/profile",
  icon: "portrait",
  text: "Basic profile"
};
const FIRST_TIME_SURVEY_LINK = {
  to: "/onboarding/academic",
  icon: "book",
  text: "First time use survey"
};

// Links organized by route & user type. Array indices of the links are important.
const links = {
  default: {
    loggedOut: [],
    student: [
      DASHBOARD_LINK,
      PROFILE_LINK,
      RESOURCES_LINK,
      CONTACT_LINK,
      LEGAL_LINK
    ],
    volunteer: [
      DASHBOARD_LINK,
      TRAINING_LINK,
      CALENDAR_LINK,
      PROFILE_LINK,
      CONTACT_LINK,
      LEGAL_LINK
    ],
    admin: [
      DASHBOARD_LINK,
      ADMIN_LINK,
      PROFILE_LINK,
      RESOURCES_LINK,
      CONTACT_LINK,
      LEGAL_LINK
    ]
  },
  onboarding: {
    student: [BASIC_PROFILE_LINK, FIRST_TIME_SURVEY_LINK],
    volunteer: [BASIC_PROFILE_LINK]
  }
};

const getWrapper = (options = {}) => {
  options = {
    authenticated: false,
    isVolunteer: false,
    isAdmin: false,
    mobileMode: false,
    path: "/",
    ...options
  };

  return shallowMount(SidebarLinks, {
    localVue,
    mocks: { $route: { path: options.path } },
    propsData: {
      authenticated: options.authenticated,
      isVolunteer: options.isVolunteer,
      isAdmin: options.isAdmin,
      mobileMode: options.mobileMode
    }
  });
};

describe("SidebarLinks", () => {
  it("layout", () => {
    const wrapper = getWrapper({ authenticated: true });
    expect(wrapper.classes("SidebarLinks")).toBe(true);
    expect(wrapper.findAll(SidebarLink).length).toBeGreaterThan(0);

    const about = wrapper.find(".SidebarLinks-about");
    expect(about.exists()).toBe(true);
    expect(about.text()).toBe("About UPchieve");

    wrapper.setProps({ mobileMode: true });
    expect(wrapper.find(".SidebarLinks-about").exists()).toBe(false);
  });

  describe("link tests", () => {
    const testLinks = (wrapper, expectedLinks) => {
      const sidebarLinks = wrapper.findAll(SidebarLink);
      expect(sidebarLinks.length).toBe(expectedLinks.length);
      expectedLinks.forEach((link, i) => {
        const sidebarLink = sidebarLinks.at(i);
        expect(sidebarLink.props("to")).toBe(link.to);
        expect(sidebarLink.props("icon")).toBe(link.icon);
        expect(sidebarLink.props("text")).toBe(link.text);
      });
    };

    describe("mobileMode: true", () => {
      it("renders default links when not logged in", () => {
        const wrapper = getWrapper({ mobileMode: true });
        testLinks(wrapper, links.default.loggedOut);
      });

      it("renders default links for student", () => {
        const wrapper = getWrapper({ mobileMode: true, authenticated: true });
        testLinks(wrapper, links.default.student);
      });

      it("renders onboarding links for student", () => {
        const wrapper = getWrapper({ mobileMode: true, path: "/onboarding" });
        testLinks(wrapper, links.onboarding.student);
      });

      it("renders default links for volunteer", () => {
        const wrapper = getWrapper({
          mobileMode: true,
          isVolunteer: true,
          authenticated: true
        });
        testLinks(wrapper, links.default.volunteer);
      });

      it("renders onboarding links for volunteer", () => {
        const wrapper = getWrapper({
          mobileMode: true,
          isVolunteer: true,
          path: "/onboarding"
        });
        testLinks(wrapper, links.onboarding.volunteer);
      });

      it("renders default links for admin", () => {
        const wrapper = getWrapper({
          mobileMode: true,
          isAdmin: true,
          authenticated: true
        });
        testLinks(wrapper, links.default.admin);
      });
    });

    describe("mobileMode: false", () => {
      it("renders default links when not logged in", () => {
        const wrapper = getWrapper({ mobileMode: false });
        testLinks(wrapper, links.default.loggedOut);
      });

      it("renders default links for student", () => {
        const wrapper = getWrapper({ mobileMode: false, authenticated: true });
        testLinks(wrapper, links.default.student);
      });

      it("renders onboarding links for student", () => {
        const wrapper = getWrapper({ mobileMode: false, path: "/onboarding" });
        testLinks(wrapper, links.onboarding.student);
      });

      it("renders default links for volunteer", () => {
        const wrapper = getWrapper({
          mobileMode: false,
          isVolunteer: true,
          authenticated: true
        });
        testLinks(wrapper, links.default.volunteer);
      });

      it("renders onboarding links for volunteer", () => {
        const wrapper = getWrapper({
          mobileMode: false,
          isVolunteer: true,
          path: "/onboarding"
        });
        testLinks(wrapper, links.onboarding.volunteer);
      });

      it("renders default links for admin", () => {
        const wrapper = getWrapper({
          mobileMode: false,
          isAdmin: true,
          authenticated: true
        });
        testLinks(wrapper, links.default.admin);
      });
    });
  });
});
