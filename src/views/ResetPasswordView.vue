<template>
  <form-page-template>
    <form class="uc-form">
      <div class="uc-form-header">
        <div class="uc-form-header-link--active">Reset Your Password</div>

        <div class="link-container link-container--end" v-if="user">
          <router-link to="/" class="uc-form-header-link">
            Home
          </router-link>
        </div>

        <div class="link-container" v-else>
          <router-link to="/login" class="uc-form-header-link">
            Log In
          </router-link>
          <span>/</span>
          <router-link to="/sign-up" class="uc-form-header-link">
            Sign Up
          </router-link>
        </div>
      </div>

      <div v-if="msg" class="message">{{ msg }}</div>

      <div v-else class="uc-form-body">
        <div class="uc-column">
          <label for="inputEmail" class="uc-form-label"
            >Please enter your email address</label
          >
          <input
            id="inputEmail"
            v-model="email"
            type="email"
            class="uc-form-input"
            required
            autofocus
          />
        </div>

        <button
          class="uc-form-button"
          type="submit"
          @click.prevent="submit()"
          :disabled="isSendingEmail"
        >
          Enter
        </button>

        <loader v-if="isSendingEmail" overlay />

        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </form>
  </form-page-template>
</template>

<script>
import * as Sentry from "@sentry/browser";
import { mapState } from "vuex";

import AuthService from "@/services/AuthService";
import FormPageTemplate from "@/components/FormPageTemplate";
import Loader from "@/components/Loader";

export default {
  components: {
    FormPageTemplate,
    Loader
  },
  created() {
    this.$store.dispatch("app/hideNavigation");
  },
  data() {
    return {
      email: "",
      msg: "",
      error: "",
      isSendingEmail: false
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    })
  },
  methods: {
    submit() {
      this.isSendingEmail = true;
      this.error = "";
      AuthService.sendReset(this, this.email)
        .then(() => (this.isSendingEmail = false))
        .catch(err => {
          this.error = err.message;
          this.isSendingEmail = false;
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

.link-container {
  @include flex-container(row, space-evenly);
  min-width: 150px;

  &--end {
    justify-content: flex-end;
  }
}

@include breakpoint-below("tiny") {
  .uc-form-header {
    @include flex-container(column, center, center);
  }
}

.message {
  margin-top: 40%;
}

.error {
  color: $c-error-red;
}
</style>
