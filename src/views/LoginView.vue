<template>
  <form-page-template>
    <div class="uc-form">
      <h1 class="uc-form-header">Hey, welcome back!</h1>

      <div
        v-if="error || $route.query['401'] === 'true'"
        class="alert alert-danger"
        role="alert"
      >
        {{ error }}
      </div>

      <form>
        <div class="uc-form-element">
          <label for="inputEmail" class="uc-form-label">Email</label>
          <input
            id="inputEmail"
            class="uc-form-text-input"
            type="email"
            placeholder="Enter your email address"
            v-model="credentials.email"
            required
            autofocus
          />
        </div>

        <div class="uc-form-element">
          <label for="inputPassword" class="uc-form-label">Password</label>
          <input
            id="inputPassword"
            class="uc-form-text-input"
            type="password"
            placeholder="Enter your password"
            v-model="credentials.password"
            required
          />
          <router-link to="/resetpassword" class="uc-link subtext">
            Forgot your password?
          </router-link>
        </div>

        <button
          class="uc-form-button"
          type="submit"
          @click.prevent="signIn"
          :disabled="!isValidForm || isLoggingIn"
        >
          Sign In
        </button>
      </form>

      <button
        class="uc-form-button google"
        @click.prevent="signInWithGoogle"
        :disabled="isLoggingIn"
      >
        <google-logo></google-logo>
        Sign In with Google
      </button>
      <p class="uc-form-text">
        Need an account?
        <router-link to="/sign-up" class="uc-link">Sign Up</router-link>
      </p>
    </div>
  </form-page-template>
</template>

<script>
import AnalyticsService from '@/services/AnalyticsService'
import AuthService from '@/services/AuthService'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import GoogleLogo from '@/assets/google_logo.svg'
import { EVENTS } from '@/consts'
import config from '../config'

export default {
  components: {
    FormPageTemplate,
    GoogleLogo,
  },
  created() {
    this.$store.dispatch('app/hideNavigation')
    localStorage.removeItem('isSSOSignUpRedirect')
  },
  computed: {
    isValidForm() {
      const { email, password } = this.credentials
      return email && password
    },
  },
  data() {
    let error
    if (this.$route.query['401'] === 'true') {
      error = 'Your session has expired. Please log in again.'
    }
    if (this.$route.query['400'] === 'true') {
      AnalyticsService.captureEvent(
        EVENTS.USER_DOES_NOT_HAVE_LINKED_GOOGLE_ACCOUNT
      )
      error =
        'Your Google account is not associated with this account. Please use your password instead.'
    }
    this.isLoggingIn = false
    return {
      credentials: {
        email: '',
        password: '',
      },
      error,
      isLoggingIn: false,
    }
  },
  methods: {
    signIn() {
      if (!this.isValidForm) return
      this.isLoggingIn = true
      AuthService.login({
        email: this.credentials.email,
        password: this.credentials.password,
      })
        .then((data) => {
          this.$store.commit('user/setUser', data.user)
          this.$router.push(this.$route.query.redirect || '/')
        })
        .catch(() => {
          this.error =
            "Oops! That email and password combination doesn't work. Check your password or if you signed up with Google SSO."
        })
        .finally(() => {
          this.isLoggingIn = false
        })
    },
    signInWithGoogle() {
      this.isLoggingIn = true
      AnalyticsService.captureEvent(EVENTS.USER_CLICKED_SIGN_IN_WITH_GOOGLE)
      const url = `${config.serverRoot}/auth/login/google`
      window.location.replace(url)
      this.isLoggingIn = false
    },
  },
}
</script>

<style lang="scss" scoped>
.alert {
  margin: 25px 0;
}

.uc-form-text {
  text-align: center;
}

.uc-link.subtext {
  margin: 2px 0 0 10px;
}
</style>
