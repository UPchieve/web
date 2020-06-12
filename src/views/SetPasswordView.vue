<template>
  <form-page-template>
    <form class="uc-form">
      <div class="uc-form-header">Reset Your Password</div>
      <div v-if="isValidResetToken && !showSuccess" class="uc-form-body">
        <div class="uc-column">
          <label for="inputEmail" class="uc-form-label">
            Please enter your email address
          </label>
          <input
            id="inputEmail"
            type="email"
            class="uc-form-input"
            v-model="credentials.email"
            required
            autofocus
          />
        </div>

        <div class="uc-column">
          <label for="inputPassword" class="uc-form-label">
            Create a new password
          </label>
          <input
            id="inputPassword"
            type="password"
            class="uc-form-input"
            v-model="credentials.password"
            required
          />
        </div>

        <div class="uc-column">
          <label for="inputPassword" class="uc-form-label">
            Re-enter your new password
          </label>
          <input
            id="inputPassword"
            type="password"
            class="uc-form-input"
            v-model="credentials.newpassword"
            required
          />
          <p class="uc-form-subtext">
            It must contain lowercase and uppercase letters, numbers, and at
            least 8 characters.
          </p>
        </div>

        <button class="uc-form-button" type="submit" @click.prevent="submit()">
          Reset Password
        </button>

        <loader v-if="isResettingPassword" overlay />

        <div v-if="msg">{{ msg }}</div>
      </div>
      <div v-else-if="showSuccess" class="success-message">
        <p>Your password has been successfully reset!</p>
        <large-button primary routeTo="/">{{ redirectText }}</large-button>
      </div>
      <div v-else class="uc-form-body">
        <p>{{ msg }}</p>
      </div>
    </form>
  </form-page-template>
</template>

<script>
import * as Sentry from "@sentry/browser";
import { mapState } from "vuex";

import AuthService from "@/services/AuthService";
import FormPageTemplate from "@/components/FormPageTemplate";
import LargeButton from "@/components/LargeButton";
import Loader from "@/components/Loader";

export default {
  components: {
    FormPageTemplate,
    LargeButton,
    Loader
  },
  created() {
    this.$store.dispatch("app/hideNavigation");
    const { token } = this.$route.params;
    AuthService.verifyReset(this, { token }).catch(err => {
      if (err.status !== 404 && err.status !== 422) {
        Sentry.captureException(err);
      }
      this.msg = err.message;
      this.isValidResetToken = false;
    });
  },
  data() {
    return {
      msg: "",
      credentials: {
        token: "",
        email: "",
        password: "",
        newpassword: ""
      },
      isValidResetToken: true,
      isResettingPassword: false,
      showSuccess: false
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    redirectText() {
      return this.user ? "Home" : "Log in";
    }
  },
  methods: {
    submit() {
      this.isResettingPassword = true;

      AuthService.confirmReset(this, {
        token: this.$route.params.token,
        email: this.credentials.email,
        password: this.credentials.password,
        newpassword: this.credentials.newpassword
      })
        .then(() => {
          this.isResettingPassword = false;
          this.showSuccess = true;
        })
        .catch(err => {
          this.isResettingPassword = false;
          this.msg = err.message || err;
          if (err.status !== 422) {
            Sentry.captureException(err);
          }
        });
    }
  }
};
</script>

<style lang="scss" scoped>
.uc-form {
  position: relative;
}

.uc-form-header {
  font-size: 24px;
  font-weight: bold;
  justify-content: center;

  &-link--success {
    color: $c-success-green;
  }
}

.success-message {
  @include flex-container(column, center, center);
  margin: auto 0;
  padding: 50px;
}
</style>
