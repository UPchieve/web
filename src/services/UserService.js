import moment from "moment";
import NetworkService from "./NetworkService";
import AuthService from "./AuthService";
import OnboardingService from "./OnboardingService";
import router from "@/router";

import extractErrorToReport from "@/utils/extract-error-to-report";

export default {
  getAuth() {
    return AuthService.user;
  },
  getUser() {
    const auth = this.getAuth();
    if (auth.authenticated) {
      return auth.data;
    }
    return {};
  },
  validateBirthdate(birthdate) {
    const m = moment(birthdate, "MM/DD/YYYY");
    if (!m.isValid()) {
      return "Birthdate is invalid";
    }

    return true; // No validation errors
  },
  getOnboardingServiceInterest() {
    const user = this.getUser();
    return (user && user.onboardingServiceInterest) || [];
  },
  getOnboarding() {
    return OnboardingService.status;
  },
  setProfile(context, data, redirect) {
    return NetworkService.setProfile(context, data)
      .then(res => {
        if (res.data) {
          AuthService.storeUser(res.data.user);
          context.msg = "Set!";
        } else {
          throw new Error();
        }
        if (redirect) {
          router.push(redirect);
        }
        return Promise.resolve(res);
      })
      .catch(res => {
        context.msg = "Error occurred";
        // make sure we handle validation errors properly
        let err = res;
        if (res.data && res.data.err) {
          err = res.data.err;
        }
        throw extractErrorToReport(
          res,
          res.status !== 401 &&
            res.status !== 0 &&
            err.name !== "ValidationError",
          true
        );
      });
  },

  getVolunteers(context) {
    return NetworkService.getVolunteers(context)
      .then(res => {
        if (res.data.volunteers) {
          return res.data.volunteers;
        } else {
          throw new Error();
        }
      })
      .catch(res => {
        throw extractErrorToReport(
          res,
          res.status !== 401 && res.status !== 0,
          true
        );
      });
  },
  getVolunteersAvailability(context, certifiedSubject) {
    return NetworkService.getVolunteersAvailability(context, certifiedSubject)
      .then(res => {
        if (res.data.aggAvailabilities) {
          return res.data.aggAvailabilities;
        } else {
          throw new Error();
        }
      })
      .catch(res => {
        throw extractErrorToReport(
          res,
          res.status !== 401 && res.status !== 0,
          true
        );
      });
  }
};
