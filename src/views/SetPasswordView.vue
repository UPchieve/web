<template>
  <form-page-template>
    <form class="uc-form">
      <div class="uc-form-header">Reset Your Password</div>
      <div v-if="isValidResetToken" class="uc-form-body">
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

        <div v-if="msg !== ''">{{ msg }}</div>
      </div>
      <div v-else class="uc-form-body">
        <p>{{ msg }}</p>
      </div>
    </form>
  </form-page-template>
</template>

<script>
import * as Sentry from "@sentry/browser";

import AuthService from "@/services/AuthService";
import FormPageTemplate from "@/components/FormPageTemplate";

export default {
  components: {
    FormPageTemplate
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
      isValidResetToken: true
    };
  },
  methods: {
    submit() {
      AuthService.confirmReset(this, {
        token: this.$route.params.token,
        email: this.credentials.email,
        password: this.credentials.password,
        newpassword: this.credentials.newpassword
      })
        .then(() => {
          this.showingSuccess = true;
        })
        .catch(err => {
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
.uc-form-header {
  font-size: 24px;
  font-weight: bold;
  justify-content: center;
}
</style>
