import Vue from "vue";
import VueResource from "vue-resource";
import VueRouter from "vue-router";

import ContactView from "./views/ContactView";
import LegalView from "./views/LegalView";
import LogoutView from "./views/LogoutView";
import LoginView from "./views/LoginView";
import SignupView from "./views/SignupView";
import VolunteerPartnerSignupView from "./views/VolunteerPartnerSignupView";
import StudentPartnerSignupView from "./views/StudentPartnerSignupView";
import ResetPasswordView from "./views/ResetPasswordView";
import SetPasswordView from "./views/SetPasswordView";
import OnboardingView from "./views/OnboardingView";
import DashboardView from "./views/DashboardView";
import SessionView from "./views/SessionView";
import ActionView from "./views/ActionView";
import ResourcesView from "./views/ResourcesView";
import FeedbackView from "./views/FeedbackView";
import TrainingView from "./views/TrainingView";
import QuizView from "./views/QuizView";
import ProfileView from "./views/ProfileView";
import CalendarView from "./views/CalendarView";
import AdminView from "./views/Admin";
import VolunteerCoverage from "./views/Admin/VolunteerCoverage";
import AdminSessions from "./views/Admin/AdminSessions";
import AdminSessionNotifications from "./views/Admin/AdminSessionNotifications";
import AdminSessionDetail from "./views/Admin/AdminSessionDetail";
import AdminUsers from "./views/Admin/AdminUsers";
import AdminUserDetail from "./views/Admin/AdminUserDetail";
import AdminPendingVolunteers from "./views/Admin/AdminPendingVolunteers";
import AdminIneligibleStudents from "./views/Admin/AdminIneligibleStudents";
import AdminSchoolDetail from "./views/Admin/AdminSchoolDetail";
import AdminSchools from "./views/Admin/AdminSchools";
import AdminAddSchool from "./views/Admin/AdminAddSchool";
import AdminEditSchool from "./views/Admin/AdminEditSchool";
import AdminReports from "./views/Admin/AdminReports";
import ReviewMaterialsView from "./views/ReviewMaterialsView";
import ReferenceView from "./views/ReferenceView";
import BackgroundInfoView from "./views/BackgroundInfoView";
import TrainingCourseView from "./views/TrainingCourseView";

import store from "./store";

import { topics } from "./utils/topics";

Vue.use(VueResource);
Vue.http.options.credentials = true;

const getUser = () => {
  if (store.getters["user/isAuthenticated"]) {
    return new Promise(resolve => {
      store.dispatch("user/fetchUser");
      resolve();
    });
  } else {
    return store.dispatch("user/fetchUser");
  }
};

const routes = [
  {
    path: "/",
    beforeEnter: (to, from, next) => {
      getUser().then(() => {
        if (store.getters["user/isAuthenticated"]) {
          next("/dashboard");
        } else {
          next("/login");
        }
      });
    }
  },
  {
    path: "/contact",
    name: "ContactView",
    component: ContactView,
    meta: { authOptional: true }
  },
  {
    path: "/legal",
    name: "LegalView",
    component: LegalView,
    meta: { authOptional: true }
  },
  {
    path: "/login",
    name: "LoginView",
    component: LoginView,
    meta: { loggedOutOnly: true }
  },
  {
    path: "/logout",
    name: "LogoutView",
    component: LogoutView,
    meta: { loggedOutOnly: true }
  },
  {
    path: "/reference-form/:referenceId",
    name: "ReferenceView",
    component: ReferenceView,
    meta: { authOptional: true }
  },
  {
    path: "/signup",
    beforeEnter: (to, from, next) => {
      next("/sign-up");
    }
  },
  {
    path: "/sign-up/:userType?/:step?",
    name: "SignupView",
    component: SignupView,
    meta: { loggedOutOnly: true }
  },
  {
    path: "/signup/student/:partnerId",
    name: "StudentPartnerSignupView",
    component: StudentPartnerSignupView,
    meta: { loggedOutOnly: true }
  },
  {
    path: "/signup/volunteer/:partnerId",
    name: "VolunteerPartnerSignupView",
    component: VolunteerPartnerSignupView,
    meta: { loggedOutOnly: true }
  },
  {
    path: "/referral/:referredByCode",
    beforeEnter: (to, from, next) => {
      const referredByCode = to.params.referredByCode;
      next(`/sign-up?referral=${referredByCode}`);
    }
  },
  {
    path: "/resetpassword",
    name: "ResetPasswordView",
    component: ResetPasswordView
  },
  {
    path: "/setpassword/:token",
    name: "SetPasswordView",
    component: SetPasswordView
  },
  {
    path: "/dashboard",
    name: "DashboardView",
    component: DashboardView,
    meta: { protected: true }
  },
  {
    path: "/session/:topic/:subTopic/:sessionId?",
    name: "SessionView",
    component: SessionView,
    meta: { protected: true },
    beforeEnter: (to, from, next) => {
      if (to.params.topic in topics) {
        next();
      } else {
        next("/dashboard");
      }
    }
  },
  {
    path: "/resources",
    name: "ResourcesView",
    component: ResourcesView,
    meta: { protected: true, bypassOnboarding: true }
  },
  {
    path:
      "/feedback/:sessionId/:topic/:subTopic/:userType/:studentId/:volunteerId",
    name: "FeedbackView",
    component: FeedbackView,
    meta: { protected: true }
  },
  {
    path: "/action/:action/:data?",
    name: "ActionView",
    component: ActionView,
    meta: { bypassOnboarding: true }
  },
  {
    path: "/onboarding/:step?",
    name: "OnboardingView",
    component: OnboardingView,
    meta: { protected: true },
    beforeEnter: (to, from, next) => {
      getUser().then(() => {
        if (store.getters["user/isEmailVerified"]) {
          next("/dashboard");
        } else {
          next();
        }
      });
    }
  },
  {
    path: "/training",
    name: "TrainingView",
    component: TrainingView,
    meta: { protected: true }
  },
  {
    path: "/training/review/:category",
    name: "ReviewMaterialsView",
    component: ReviewMaterialsView,
    meta: { protected: true }
  },
  {
    path: "/training/:category/quiz",
    name: "QuizView",
    component: QuizView,
    meta: { protected: true }
  },
  {
    path: "/training/course/:courseKey",
    name: "TrainingCourseView",
    component: TrainingCourseView,
    meta: { protected: true }
  },
  {
    path: "/profile",
    name: "ProfileView",
    component: ProfileView,
    meta: { protected: true }
  },
  {
    path: "/calendar",
    name: "CalendarView",
    component: CalendarView,
    meta: { protected: true }
  },
  {
    path: "/admin",
    name: "Admin",
    component: AdminView,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: "/admin/volunteer-coverage",
    name: "VolunteerCoverage",
    component: VolunteerCoverage,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: "/admin/sessions",
    name: "AdminSessions",
    component: AdminSessions,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: "/admin/sessions/:sessionId",
    name: "AdminSessionDetail",
    component: AdminSessionDetail,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: "/admin/sessions/:sessionId/notifications",
    name: "AdminSessionNotifications",
    component: AdminSessionNotifications,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: "/admin/users",
    name: "AdminUsers",
    component: AdminUsers,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: "/admin/users/:userId",
    name: "AdminUserDetail",
    component: AdminUserDetail,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: "/admin/volunteers/pending",
    name: "AdminPendingVolunteers",
    component: AdminPendingVolunteers,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: "/admin/ineligible-students",
    name: "AdminIneligibleStudents",
    component: AdminIneligibleStudents,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: "/admin/school/new",
    name: "AdminAddSchool",
    component: AdminAddSchool,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: "/admin/school/edit",
    name: "AdminAddSchool",
    component: AdminEditSchool,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: "/admin/school/:schoolId",
    name: "AdminSchoolDetail",
    component: AdminSchoolDetail,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: "/admin/schools",
    name: "AdminSchools",
    component: AdminSchools,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: "/admin/reports",
    name: "AdminReports",
    component: AdminReports,
    meta: { protected: true, requiresAdmin: true }
  },
  {
    path: "/background-information",
    name: "BackgroundInfoView",
    component: BackgroundInfoView,
    meta: { protected: true }
  },
  {
    path: "/edu", // TODO: make this be "/admin/edu"
    component: () => {
      if (process.env.NODE_ENV === "development") {
        // The EDU admin route is rendered server-side with Express.js, so in local development
        // we need to move to port 3000 (away from Vue's dev server on port 8080)
        window.location.href = "http://localhost:3000/edu";
        return;
      }

      // In non-development environments, we can simply use a relative link
      window.location.href = "/edu";
    }
  }
];

/**
 * @todo Consider refactoring this file
 */
const router = new VueRouter({
  routes,
  linkActiveClass: "active",
  mode: "history",
  scrollBehavior() {
    return { x: 0, y: 0 };
  }
});

export default router;

// Router middleware to check authentication for protect routes
router.beforeEach((to, from, next) => {
  if (to.matched.some(route => route.meta.requiresAdmin)) {
    getUser().then(() => {
      if (!store.state.user.user.isAdmin) {
        next({
          path: "/login",
          query: {
            redirect: to.fullPath
          }
        });
      } else {
        next();
      }
    });
  } else if (to.matched.some(route => route.meta.protected)) {
    getUser().then(() => {
      if (!store.getters["user/isAuthenticated"]) {
        next({
          path: "/login",
          query: {
            redirect: to.fullPath
          }
        });
      } else if (!store.getters["user/isEmailVerified"]) {
        const route = "/onboarding/verify";
        if (
          to.path.indexOf(route) !== -1 ||
          to.matched.some(route => route.meta.bypassOnboarding)
        ) {
          next();
        } else {
          next({
            path: route,
            query: {
              redirect: to.fullPath
            }
          });
        }
      } else {
        next();
      }
    });
  } else if (to.matched.some(route => route.meta.loggedOutOnly)) {
    getUser().then(() => {
      if (store.getters["user/isAuthenticated"]) {
        next("/dashboard");
      } else {
        next();
      }
    });
  } else if (to.matched.some(route => route.meta.authOptional)) {
    getUser().then(() => {
      next();
    });
  } else {
    next();
  }
});

// Called after each route change
router.afterEach((to, from) => {
  if (to.name !== from.name) store.dispatch("app/showNavigation");
  store.dispatch("app/modal/hide");

  // Google Analytics
  if (window.gtag) {
    // Send page view
    // @todo: put GA ID in config
    // @todo: only track on prod
    window.gtag("config", "UA-133171872-1", {
      page_path: router.currentRoute.path,
      custom_map: { dimension1: "is_volunteer", dimension2: "is_authenticated" }
    });

    const isAuthenticated = store.getters["user/isAuthenticated"];
    const isVolunteer = store.getters["user/isVolunteer"];
    const gtagDimensions = { is_authenticated: isAuthenticated ? "1" : "0" };
    if (isAuthenticated) gtagDimensions.is_volunteer = isVolunteer ? "1" : "0";

    // Send custom dimensions data
    window.gtag("event", "upc_page_transition", gtagDimensions);
  }
});

// If endpoint returns 401, redirect to login (except for requests to get user or user's
// session)
Vue.http.interceptors.push((request, next) => {
  next(response => {
    const is401 = response.status === 401;
    const isGetUserAttempt =
      request.url.indexOf("/api/user") !== -1 && request.method === "GET";
    const isGetSessionAttempt =
      request.url.indexOf("/api/session/current") !== -1;

    if (is401 && !(isGetUserAttempt || isGetSessionAttempt)) {
      router.push("/login?401=true");
    }
  });
});
