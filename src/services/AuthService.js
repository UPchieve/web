import Validator from "validator";

import Vue from "vue";

import NetworkService from "./NetworkService";
import AnalyticsService from "./AnalyticsService";

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

    return NetworkService.login(context, creds).then(
      res => {
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
      },
      () => {
        context.error = "Could not login";
      }
    );
  },

  register(context, signupData) {
    return NetworkService.register(context, signupData).then(res => {
      const data = { ...res.data };
      if (!data) {
        throw new Error("No user returned from auth service");
      } else if (data.err) {
        throw new Error(data.err);
      }

      context.msg = "You have been signed up!";
    });
  },

  checkRegister(context, creds) {
    return NetworkService.checkRegister(context, creds).then(res => {
      if (res.data.err) {
        throw new Error(res.data.err);
      }
    });
  },

  sendReset(context, email, redirect) {
    return NetworkService.sendReset(context, { email }).then(res => {
      const data = { ...res.data };
      if (!data) {
        throw new Error("No user returned from auth service");
      }
      if (data.err) {
        throw new Error(data.err);
      }

      context.msg = "Password reset email has been sent!";

      if (redirect) {
        setTimeout(() => {
          context.$router.push(redirect);
        }, 2000);
      }
    });
  },

  confirmReset(context, credentials, redirect) {
    return NetworkService.confirmReset(context, credentials).then(res => {
      const data = { ...res.data };
      if (!data) {
        throw new Error("No user returned from auth service");
      } else if (data.err) {
        throw new Error(data.err);
      }

      context.msg = "Password has been reset!";

      if (redirect) {
        setTimeout(() => {
          context.$router.push(redirect);
        }, 2000);
      }
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
          return {
            authenticated: true,
            user: data.user
          };
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
