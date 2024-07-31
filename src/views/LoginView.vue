<template>
  <form-page-template
    :layout="formPageTemplateLayout"
    panelImg="updog-subjects"
    @submit.prevent="signIn"
  >
    <div class="uc-form">
      <h1 class="uc-form-header" data-testid="login-heading">
        Hey, welcome back!
      </h1>
      <div
        v-if="error || $route.query['401'] === 'true'"
        class="alert alert-danger"
        role="alert"
        data-testid="error"
      >
        {{ error }}
      </div>
      <form>
        <!-- TODO: Do we want autofocus? -->
        <FormEmail
          v-model="credentials.email"
          testid="inputEmail"
          :placeholder="useNewSignUpFlow ? 'Email' : 'Enter your email address'"
          :is-required="false"
          is-autofocused
        />
        <FormPassword
          v-model="credentials.password"
          testid="inputPassword"
          :placeholder="useNewSignUpFlow ? 'Password' : 'Enter your password'"
          :is-required="false"
        />
        <router-link to="/resetpassword" class="uc-link subtext">
          Forgot your password?
        </router-link>
        <button
          class="uc-form-button"
          data-testid="loginButton"
          type="submit"
          @click.prevent="signIn"
          :disabled="!isValidForm || isLoggingIn ? true : null"
        >
          {{ useNewSignUpFlow ? 'Log in' : 'Sign In' }}
        </button>
        <LineDivider v-if="useNewSignUpFlow" text="Or continue with:" />
        <SsoButton
          data-testid="googleSsoButton"
          @click="signInWithSso('google')"
          :buttonText="useNewSignUpFlow ? 'Google' : 'Sign In with Google'"
          ssoMethod="google"
        />
        <SsoButton
          data-testid="cleverSsoButton"
          v-if="useNewSignUpFlow"
          @click="signInWithSso('clever')"
          buttonText="Clever"
          ssoMethod="clever"
        />
      </form>
      <p class="uc-form-text">
        Need an account?
        <router-link to="/sign-up" class="uc-link">Sign Up</router-link>
      </p>
    </div>
  </form-page-template>
</template>

<script>
import { mapGetters } from 'vuex'
import AnalyticsService from '@/services/AnalyticsService'
import AuthService from '@/services/AuthService'
import FormEmail from '@/components/FormEmail.vue'
import FormPassword from '@/components/FormPassword.vue'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import LineDivider from '@/components/LineDivider.vue'
import SsoButton from '@/components/SsoButton.vue'
import { EVENTS } from '@/consts'
import config from '../config'

export default {
  components: {
    FormEmail,
    FormPassword,
    FormPageTemplate,
    LineDivider,
    SsoButton,
  },
  created() {
    this.$store.dispatch('app/hideNavigation')
    localStorage.removeItem('isSSOSignUpRedirect')
    this.formPageTemplateLayout = this.useNewSignUpFlow
      ? 'panel-left-50p'
      : 'card'
  },
  computed: {
    ...mapGetters({
      useNewSignUpFlow: 'featureFlags/useNewSignUpFlow',
    }),
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
      const provider = this.$route.query['provider']
      if (provider === 'google') {
        AnalyticsService.captureEvent(
          EVENTS.USER_DOES_NOT_HAVE_LINKED_GOOGLE_ACCOUNT
        )
      }
      if (provider === 'clever') {
        AnalyticsService.captureEvent(
          EVENTS.USER_DOES_NOT_HAVE_LINKED_CLEVER_ACCOUNT
        )
      }
      error = provider
        ? `Your ${provider} account is not associated with this account.`
        : `Something went wrong. Please verify your login method and try again.`
    }
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
            "Oops! That email and password combination doesn't work. Check your password or if you signed up with Google or Clever SSO."
        })
        .finally(() => {
          this.isLoggingIn = false
        })
    },
    signInWithSso(provider) {
      this.isLoggingIn = true
      this.captureSsoClickEvent(provider)
      const params = new URLSearchParams({
        provider,
        isLogin: true,
        redirect: this.$route.query.redirect ?? '',
      })
      const url = `${config.serverRoot}/auth/sso?${params.toString()}`
      window.location.replace(url)
      this.isLoggingIn = false
    },
    captureSsoClickEvent(provider) {
      if (provider === 'google') {
        AnalyticsService.captureEvent(EVENTS.USER_CLICKED_SIGN_IN_WITH_GOOGLE)
      }
      if (provider === 'clever') {
        AnalyticsService.captureEvent(EVENTS.USER_CLICKED_SIGN_IN_WITH_CLEVER)
      }
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
