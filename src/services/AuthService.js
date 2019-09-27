import Validator from "validator";

import Vue from "vue";

import NetworkService from "./NetworkService";
import AnalyticsService from "./AnalyticsService";

export default {
  login(context, creds, redirect) {
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

        if (redirect) {
          context.$router.push(redirect);
        }
      },
      () => {
        context.error = "Could not login";
      }
    );
  },

  register(context, creds, profile, redirect) {
    return NetworkService.register(context, { ...creds, ...profile }).then(
      res => {
        const data = { ...res.data };
        if (!data) {
          throw new Error("No user returned from auth service");
        } else if (data.err) {
          throw new Error(data.err);
        }

        context.msg = "You have been signed up!";

        if (redirect) {
          setTimeout(() => {
            context.$router.push(redirect);
          }, 2000);
        }
      }
    );
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
          context.$router.push("/logout");
        })
        .catch(() => {
          context.$router.push("/logout");
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
  /*
  checkAuth(context) {
    getAuth().then(auth => {
      if (auth.user) {
        try {
          this.user.data = JSON.parse(user);
          this.user.authenticated = true;
        } catch (e) {
          this.logout();
        }
      } else {
        this.user.authenticated = false;
        this.user.data = null;
      }
  
      if (context && this.shouldFetch()) {
        this.fetchUser(context);
      }
    });
  },

  shouldFetch() {
    return Date.now() - this.user.lastFetch > USER_FETCH_LIMIT_SECONDS * 1000;
  },

  storeUser(userObj) {
    this.user.authenticated = true;
    this.user.data = userObj;
    localStorage.setItem("user", JSON.stringify(userObj));
  },

  removeUser() {
    localStorage.removeItem("user");
    this.user.authenticated = false;
    this.user.data = null;
  },

  fetchUser(context) {
    this.user.lastFetch = Date.now();

    NetworkService.user(context)
      .then(res => {
        const data = { ...res.data };
        if (!data) {
          throw new Error("No user returned from auth service");
        }

        if (data.user) {
          this.user.authenticated = true;
          this.user.data = data.user;
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          this.user.authenticated = false;
          this.user.data = null;
        }
      })
      .catch((/*err) => {
        // console.log(err);
      });
  }
*/
};
