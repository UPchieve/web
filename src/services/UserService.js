import moment from "moment";
import NetworkService from "./NetworkService";
import AuthService from "./AuthService";
import OnboardingService from "./OnboardingService";
import router from "@/router";

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
    return NetworkService.setProfile(context, data).then(
      res => {
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
      },
      res => {
        context.msg = "Error occurred";
        return Promise.reject(res);
      }
    );
  },
  editVolunteer(context, data) {
    return NetworkService.editVolunteer(context, data).then(res => {
      if (res.data.err) {
        return res.data.err;
      } else if (res.data.volunteer) {
        return res.data.volunteer;
      } else {
        throw new Error();
      }
    });
  },
  getVolunteer(context, data) {
    return NetworkService.getVolunteer(context, data).then(res => {
      if (res.data.err) {
        return res.data.err;
      } else if (res.data.volunteer) {
        return res.data.volunteer;
      } else {
        throw new Error();
      }
    });
  },
  getVolunteers(context) {
    return NetworkService.getVolunteers(context).then(res => {
      if (res.data.err) {
        return res.data.err;
      } else if (res.data.volunteers) {
        return res.data.volunteers;
      } else {
        throw new Error();
      }
    });
  },
  getVolunteersAvailability(context, certifiedSubject) {
    return NetworkService.getVolunteersAvailability(
      context,
      certifiedSubject
    ).then(res => {
      if (res.data.err) {
        return res.data.err;
      } else if (res.data.aggAvailabilities) {
        return res.data.aggAvailabilities;
      } else {
        throw new Error();
      }
    });
  }
};
