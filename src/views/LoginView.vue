<template>
  <form-page-template>
    <form class="uc-form">
      <div class="uc-form-header">
        <div class="uc-form-header-link--active">Log In</div>
        <router-link to="signup" class="uc-form-header-link"
          >Sign Up</router-link
        >
      </div>

      <div class="uc-form-body">
        <div
          v-if="error || $route.query['401'] === 'true'"
          class="alert alert-danger"
          role="alert"
        >
          {{ error }}
        </div>

        <div class="uc-column">
          <label for="inputEmail" class="uc-form-label">Email</label>
          <input
            id="inputEmail"
            v-model="credentials.email"
            type="email"
            class="uc-form-input"
            required
            autofocus
          />
        </div>

        <div class="uc-column">
          <label for="inputPassword" class="uc-form-label">Password</label>
          <input
            id="inputPassword"
            v-model="credentials.password"
            type="password"
            class="uc-form-input"
            required
          />
          <router-link to="resetpassword" class="uc-form-subtext">
            Forgot password?
          </router-link>
        </div>

        <button class="uc-form-button" type="submit" @click.prevent="submit">
          Login
        </button>
      </div>

      <form-footer />
    </form>
  </form-page-template>
</template>

<script>
import AuthService from "@/services/AuthService";
import FormPageTemplate from "@/components/FormPageTemplate";
import FormFooter from "@/components/FormFooter";

export default {
  components: {
    FormPageTemplate,
    FormFooter
  },
  data() {
    let error;
    if (this.$route.query["401"] === "true") {
      error = "Your session has expired. Please login again";
    }
    return {
      credentials: {
        email: "",
        password: ""
      },
      error
    };
  },
  methods: {
    submit() {
      var promise = AuthService.login(
        this,
        {
          email: this.credentials.email,
          password: this.credentials.password
        },
        this.$route.query.redirect || "/"
      );
      if (promise) {
        promise.catch(err => {
          // so it will be handled by parent ErrorFeedback component
          this.$parent.$emit("async-error", err);
        });
      } else {
        this.error = "You must enter a username and password";
      }
    }
  },
  beforeRouteEnter(to, from, next) {
    if (AuthService.user.authenticated) {
      next({
        path: "/"
      });
    } else {
      next();
    }
  }
};
</script>

<style lang="scss" scoped>
.alert {
  margin-bottom: 0;
}
</style>
