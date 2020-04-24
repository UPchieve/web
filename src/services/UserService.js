import moment from "moment";
import NetworkService from "./NetworkService";
import AuthService from "./AuthService";
import OnboardingService from "./OnboardingService";

export default {
  getAuth(context) {
    return AuthService.getAuth(context);
  },
  getUser(context) {
    return this.getAuth(context).then(auth => {
      if (auth.authenticated) {
        return auth.user;
      }
      return Promise.resolve({});
    });
  },
  validateBirthdate(birthdate) {
    const m = moment(birthdate, "MM/DD/YYYY");
    if (!m.isValid()) {
      return "Birthdate is invalid";
    }

    return true; // No validation errors
  },
  getOnboardingServiceInterest() {
    return this.getUser().then(
      user => (user && user.onboardingServiceInterest) || []
    );
  },
  getOnboarding() {
    return OnboardingService.status;
  },
  setProfile(data) {
    return NetworkService.setProfile(data);
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
