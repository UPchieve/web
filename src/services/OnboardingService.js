import UserService from "./UserService";
import AuthService from "./AuthService";
import NetworkService from "./NetworkService";

import router from "@/router";

export default {
  status: {
    isOnboarded: false
  },

  sendVerification(context) {
    return NetworkService.sendVerification(context)
      .then(() => {
        context.msg = "Email sent!";
      })
      .catch(() => {
        context.msg = "Error occurred";
      });
  },
  confirmVerification(context, token) {
    return NetworkService.confirmVerification(context, { token })
      .then(() => {
        router.replace("/");
      })
      .catch(() => {
        context.msg = "Error occurred";
      });
  },

  hasVerifiedEmail() {
    return UserService.getUser().then(user => user.verified);
  },

  hasProfile() {
    return UserService.getUser().then(user => {
      let requiredFields;
      if (user.isVolunteer) {
        requiredFields = [
          "firstname",
          "lastname",
          "birthdate",
          "gender",
          "race",
          "phone",
          "referred",
          "favoriteAcademicSubject",
          "college"
        ];
      } else {
        requiredFields = [
          "firstname",
          "lastname",
          "birthdate",
          "gender",
          "race",
          "expectedGraduation"
        ];
      }

      // Test if each required field is present, return true when field fails to
      // terminate iteration
      const hasInvalidField = requiredFields.some(fieldName => {
        const field = user[fieldName];
        if (field === null || field === undefined) {
          return true; // Field must be non-null
        }
        if (Array.isArray(field) && field.length === 0) {
          return true; // If field is an array, it must be populated
        }
        if (typeof field === "string" && field === "") {
          return true; // If field is a string, it must be non-empty
        }
        return false;
      });

      return !hasInvalidField;
    });
  },

  isOnboarded() {
    return this.hasVerifiedEmail() && this.hasProfile();
  },

  getOnboardingRoute() {
    const mapOfRoutesToTheirValidator = {
      "/onboarding/verify": this.hasVerifiedEmail
    };

    let incompleteStepRoute;

    Object.keys(mapOfRoutesToTheirValidator).some(route => {
      if (!mapOfRoutesToTheirValidator[route]()) {
        incompleteStepRoute = route;
        return true;
      }
      return false;
    });

    return incompleteStepRoute;
  }
};
