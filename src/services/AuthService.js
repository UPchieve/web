import Validator from "validator";

import NetworkService from "./NetworkService";
import AnalyticsService from "./AnalyticsService";

import errorFromHttpResponse from "../utils/error-from-http-response";

export default {
  login(context, creds) {
    const { email, password } = creds;
    if (
      !email ||
      !password ||
      !Validator.isEmail(email) ||
      password.length < 1
    ) {
      return Promise.reject("Invalid login form submission");
    }

    return NetworkService.login(context, creds).then(res => {
      const data = { ...res.data };
      if (!data) {
        throw new Error("No user returned from auth service");
      }

      // analytics: tracking when a user has logged in
      AnalyticsService.identify(data.user, data.user.isFakeUser);
      AnalyticsService.trackNoProperties("logged in", data.user.isFakeUser);

      return data;
    });
  },

  registerOpenVolunteer(context, signupData) {
    return NetworkService.registerOpenVolunteer(context, signupData)
      .then(res => {
        const data = { ...res.data };
        if (!data) {
          throw new Error("No user returned from auth service");
        }
      })
      .catch(res => {
        throw errorFromHttpResponse(res);
      });
  },

  registerPartnerVolunteer(context, signupData) {
    return NetworkService.registerPartnerVolunteer(context, signupData)
      .then(res => {
        const data = { ...res.data };
        if (!data) {
          throw new Error("No user returned from auth service");
        }
      })
      .catch(res => {
        throw errorFromHttpResponse(res);
      });
  },

  registerStudent(context, signupData) {
    return NetworkService.registerStudent(context, signupData)
      .then(res => {
        const data = { ...res.data };
        if (!data) {
          throw new Error("No user returned from auth service");
        }
      })
      .catch(res => {
        throw errorFromHttpResponse(res);
      });
  },

  checkRegister(context, creds) {
    return NetworkService.checkRegister(context, creds).catch(res => {
      throw errorFromHttpResponse(res);
    });
  },

  sendReset(context, email, redirect) {
    return NetworkService.sendReset(context, { email })
      .then(res => {
        const data = { ...res.data };
        if (!data) {
          throw new Error("No user returned from auth service");
        }

        context.msg = "Password reset email has been sent!";

        if (redirect) {
          setTimeout(() => {
            context.$router.push(redirect);
          }, 2000);
        }
      })
      .catch(res => {
        throw errorFromHttpResponse(res);
      });
  },

  confirmReset(context, credentials, redirect) {
    return NetworkService.confirmReset(context, credentials)
      .then(res => {
        const data = { ...res.data };
        if (!data) {
          throw new Error("No user returned from auth service");
        }

        context.msg = "Password has been reset!";

        if (redirect) {
          setTimeout(() => {
            context.$router.push(redirect);
          }, 2000);
        }
      })
      .catch(res => {
        throw errorFromHttpResponse(res);
      });
  },

  verifyReset(context, token) {
    return NetworkService.verifyReset(context, token).catch(err => {
      throw errorFromHttpResponse(err);
    });
  },

  logout(context) {
    if (context) {
      NetworkService.logout(context)
        .then(() => {
          context.$router.push("/logout");
          context.$store.dispatch("user/clear");
        })
        .catch(() => {
          context.$router.push("/logout");
          context.$store.dispatch("user/clear");
        })
        .finally(() => {
          // disconnect socket
          context.$socket.disconnect();
        });
    }
  },

  getAuth(context, options) {
    const isGlobal = options && options.isGlobal;

    const authPromise =
      !context || isGlobal
        ? NetworkService.userGlobal()
        : NetworkService.user(context);
    return authPromise
      .then(res => {
        const data = { ...res.data };
        if (!data) {
          throw new Error("No user returned from auth service");
        }

        if (data.user) {
          const auth = {
            authenticated: true,
            user: data.user
          };
          auth.user.date = new Date(res.headers.get("Date"));
          return auth;
        } else {
          return {
            authenticated: false,
            user: null
          };
        }
      })
      .catch(err => {
        return {
          authenticated: false,
          user: null,
          err: err
        };
      });
  }
};
