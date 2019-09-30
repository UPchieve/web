import Vue from "vue";
import VueResource from "vue-resource";
import VueRouter from "vue-router";

import ContactView from "./views/ContactView";
import LegalView from "./views/LegalView";
import LogoutView from "./views/LogoutView";
import LoginView from "./views/LoginView";
import SignupView from "./views/SignupView";
import ResetPasswordView from "./views/ResetPasswordView";
import SetPasswordView from "./views/SetPasswordView";
import OnboardingView from "./views/OnboardingView";
import DashboardView from "./views/DashboardView";
import SessionView from "./views/SessionView";
import ActionView from "./views/ActionView";
import ScheduleView from "./views/ScheduleView";
import ResourcesView from "./views/ResourcesView";
import FeedbackView from "./views/FeedbackView";
import TrainingView from "./views/TrainingView";
import QuizView from "./views/QuizView";
import ReviewView from "./views/ReviewView";
import ProfileView from "./views/ProfileView";
import CalendarView from "./views/CalendarView";
import SubmitQuestionView from "./views/SubmitQuestionView";
import InboxView from "./views/InboxView";
import SendAnswerView from "./views/SendAnswerView";
import AdminView from "./views/Admin";
import VolunteerCoverage from "./views/Admin/VolunteerCoverage";

import OnboardingService from "./services/OnboardingService";
import store from "./store";

Vue.use(VueResource);
Vue.http.options.credentials = true;

const routes = [
  {
    path: "/",
    beforeEnter: (to, from, next) => {
      store
        .dispatch("user/fetchUser")
        .then(() => {
          if (store.getters["user/isAuthenticated"]) {
            next("/dashboard");
          } else {
            next("/login");
          }
        })
        .catch(() => next("/login"));
    }
  },
  { path: "/contact", name: "ContactView", component: ContactView },
  { path: "/legal", name: "LegalView", component: LegalView },
  { path: "/login", name: "LoginView", component: LoginView },
  { path: "/logout", name: "LogoutView", component: LogoutView },
  { path: "/signup", name: "SignupView", component: SignupView },
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
    beforeEnter: (to, from, next) => {
      next();
    },
    component: DashboardView,
    meta: { protected: true }
  },
  {
    path: "/session/math/:subTopic/:sessionId?",
    name: "SessionView-math",
    component: SessionView,
    meta: { protected: true }
  },
  {
    path: "/session/college/:subTopic/:sessionId?",
    name: "SessionView-college",
    component: SessionView,
    meta: { protected: true }
  },
  {
    path: "/schedule",
    name: "ScheduleView",
    component: ScheduleView,
    meta: { protected: true }
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
    meta: { protected: true }
  },
  {
    path: "/training",
    name: "TrainingView",
    component: TrainingView,
    meta: { protected: true }
  },
  {
    path: "/training/:category/quiz",
    name: "QuizView",
    component: QuizView,
    meta: { protected: true }
  },
  {
    path: "/training/:category/review",
    name: "ReviewView",
    component: ReviewView,
    meta: { protected: true }
  },
  {
    path: "/profile",
    name: "ProfileView",
    component: ProfileView,
    meta: { protected: true }
  },
  { path: "/calendar", name: "CalendarView", component: CalendarView },
  {
    path: "/submit-question",
    name: "SubmitQuestionView",
    component: SubmitQuestionView,
    meta: { protected: true }
  },
  {
    path: "/inbox",
    name: "InboxView",
    component: InboxView,
    meta: { protected: true }
  },
  {
    path: "/send-answer",
    name: "SendAnswerView",
    component: SendAnswerView,
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
  mode: "history"
});

export default router;

// Router middleware to check authentication for protect routes
router.beforeEach((to, from, next) => {
  if (to.matched.some(route => route.meta.requiresAdmin)) {
    store.dispatch("user/fetchUser").then(() => {
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
    store.dispatch("user/fetchUser").then(() => {
      if (!store.getters["user/isAuthenticated"]) {
        next({
          path: "/login",
          query: {
            redirect: to.fullPath
          }
        });
      } else if (!OnboardingService.isOnboarded()) {
        const route = OnboardingService.getOnboardingRoute();
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
  } else {
    next();
  }
});

// Called after each route change
router.afterEach((to, from) => {
  if (to.name !== from.name) store.dispatch("app/showNavigation");
  store.dispatch("app/modal/hide");
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
