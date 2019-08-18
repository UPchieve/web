import { shallowMount, createLocalVue } from "@vue/test-utils";
import Vuex from "vuex";
import appModule from "@/store/modules/app";
import AppSidebar from "@/components/App/AppSidebar";
import AppSidebarLink from "@/components/App/AppSidebar/AppSidebarLink";

const localVue = createLocalVue();
localVue.use(Vuex);

// General links
const CONTACT_LINK = { to: "/contact", icon: "envelope", text: "Contact us" };
const DASHBOARD_LINK = { to: "/dashboard", icon: "house", text: "Dashboard" };
const LEGAL_LINK = { to: "/legal", icon: "exclamation", text: "Legal policy" };
const LOGIN_LINK = { to: "/login", text: "Login" };
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
    loggedOut: [LOGIN_LINK, CONTACT_LINK, LEGAL_LINK],
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
      RESOURCES_LINK,
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
    student: [
      BASIC_PROFILE_LINK,
      FIRST_TIME_SURVEY_LINK,
      CONTACT_LINK,
      LEGAL_LINK
    ],
    volunteer: [BASIC_PROFILE_LINK, CONTACT_LINK, LEGAL_LINK]
  }
};

const getWrapper = (options = {}) => {
  options = {
    mobileMode: false,
    hideHeader: false,
    isSidebarCollapsed: true,
    authenticated: false,
    isVolunteer: false,
    isAdmin: false,
    path: "/",
    ...options
  };

  const store = new Vuex.Store({
    modules: {
      app: {
        ...appModule,
        state: {
          ...appModule.state,
          hideHeader: options.hideHeader,
          isSidebarCollapsed: options.isSidebarCollapsed
        },
        getters: {
          mobileMode: () => options.mobileMode
        }
      }
    }
  });

  return shallowMount(AppSidebar, {
    localVue,
    store,
    mocks: { $route: { path: options.path } },
    data: () => ({
      auth: { authenticated: options.authenticated },
      user: {
        isVolunteer: options.isVolunteer,
        isAdmin: options.isAdmin
      }
    })
  });
};

const testLinks = (wrapper, expectedLinks) => {
  const sidebarLinks = wrapper.findAll(AppSidebarLink);
  expect(sidebarLinks.length).toBe(expectedLinks.length);
  expectedLinks.forEach((link, i) => {
    const sidebarLink = sidebarLinks.at(i);
    expect(sidebarLink.props("to")).toBe(link.to);
    expect(sidebarLink.props("icon")).toBe(link.icon);
    expect(sidebarLink.props("text")).toBe(link.text);
  });
};

describe("AppSidebar", () => {
  describe("mobileMode", () => {
    it("renders with expected classes", () => {
      let wrapper = getWrapper({ mobileMode: true });
      expect(wrapper.classes()).toEqual([
        "AppSidebar",
        "AppSidebar--header",
        "AppSidebar--collapsed"
      ]);

      wrapper = getWrapper({
        mobileMode: true,
        hideHeader: true,
        isSidebarCollapsed: false
      });
      expect(wrapper.classes()).toEqual(["AppSidebar"]);
    });

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
});
