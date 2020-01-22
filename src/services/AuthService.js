import Validator from "validator";

import Vue from "vue";

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
      return undefined;
    }

    return NetworkService.login(context, creds).then(res => {
      const data = { ...res.data };
      if (!data) {
        throw new Error("No user returned from auth service");
      }

      // analytics: tracking when a user has logged in
      AnalyticsService.identify(data.user, data.user.isFakeUser);
      AnalyticsService.trackNoProperties("logged in", data.user.isFakeUser);

      // connect socket
      context.$socket.connect();

      return data;
    });
  },

  register(context, signupData) {
    return NetworkService.register(context, signupData)
      .then(res => {
        const data = { ...res.data };
        if (!data) {
          throw new Error("No user returned from auth service");
        }

        context.msg = "You have been signed up!";
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

  logout(context) {
    if (context) {
      NetworkService.logout(context)
        .then(() => {
          context.$store.dispatch("user/clearUser");
          context.$router.push("/logout");
        })
        .catch(() => {
          context.$store.dispatch("user/clearUser");
          context.$router.push("/logout");
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
        ? NetworkService.userGlobal(Vue)
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
