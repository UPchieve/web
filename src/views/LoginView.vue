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
        v-if="hasLoginError"
        class="alert alert-danger"
        role="alert"
        data-testid="error"
      >
        <strong>Email and password don't match</strong>
        <div>
          Check both, or use the button below if you signed up with Google,
          Clever, or ClassLink.
        </div>
        <router-link to="/resetpassword" class="uc-link">
          Reset password
        </router-link>
      </div>
      <div
        v-else-if="error || message"
        class="alert"
        :class="{ 'alert-success': !!message, 'alert-danger': !!error }"
        role="alert"
        data-testid="error"
      >
        {{ error ?? message }}
      </div>
      <form autocomplete="off">
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
          <Spinner
            v-if="isLoggingIn"
            class="button-spinner"
            :container-width="16"
            :container-height="16"
            :width="16"
            :height="16"
            :thickness="2"
          />
          {{
            isLoggingIn
              ? 'Signing in...'
              : useNewSignUpFlow
                ? 'Log in'
                : 'Sign In'
          }}
        </button>
        <LineDivider
          :text="useNewSignUpFlow ? 'Or continue with:' : 'Sign In with'"
        />
        <div class="sso-container">
          <SsoButton
            @click="signInWithSso('google')"
            class="sso-button"
            data-testid="googleSsoButton"
            :buttonText="'Google'"
            :ssoMethod="SsoProvider.GOOGLE"
          />
          <SsoButton
            @click="signInWithSso('clever')"
            class="sso-button"
            data-testid="cleverSsoButton"
            buttonText="Clever"
            :ssoMethod="SsoProvider.CLEVER"
          />
          <SsoButton
            v-if="isClassLinkSsoEnabled"
            @click="signInWithSso('classlink')"
            class="sso-button"
            data-testid="classLinkSsoButton"
            buttonText="ClassLink"
            :ssoMethod="SsoProvider.CLASSLINK"
          />
        </div>
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
import LoggerService from '@/services/LoggerService'
import { SsoProvider } from '@/services/SsoService'
import FormEmail from '@/components/FormEmail.vue'
import FormPassword from '@/components/FormPassword.vue'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import LineDivider from '@/components/LineDivider.vue'
import SsoButton from '@/components/SsoButton.vue'
import { EVENTS } from '@/consts'
import config from '../config'
import Spinner from '@/components/Spinner.vue'

export default {
  components: {
    FormEmail,
    FormPassword,
    FormPageTemplate,
    LineDivider,
    SsoButton,
    Spinner,
  },
  setup() {
    return { SsoProvider }
  },
  created() {
    localStorage.removeItem('isSSOSignUpRedirect')
    this.formPageTemplateLayout = this.useNewSignUpFlow
      ? 'panel-left-50p'
      : 'card'
  },
  computed: {
    ...mapGetters({
      useNewSignUpFlow: 'featureFlags/useNewSignUpFlow',
      isClassLinkSsoEnabled: 'featureFlags/isClassLinkSsoEnabled',
    }),
    isValidForm() {
      const { email, password } = this.credentials
      return email && password
    },
  },
  data() {
    let error
    const query = this.$route?.query ?? {}

    if (query['401'] === 'true') {
      error = 'Your session has expired. Please log in again.'
    }
    if (query['400'] === 'true') {
      const provider = query['provider']
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
      LoggerService.noticeError(`${provider} error: ${error}`)
    }
    return {
      credentials: {
        email: query.email ?? '',
        password: '',
      },
      error,
      message: query.message ?? '',
      isLoggingIn: false,
      hasLoginError: false,
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
          this.hasLoginError = true
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
        errorRedirect: '/login',
      })
      const url = `${config.serverRoot}/auth/sso?${params.toString()}`
      window.location.replace(url)
      this.isLoggingIn = false
    },
    captureSsoClickEvent(provider) {
      if (provider === SsoProvider.GOOGLE) {
        AnalyticsService.captureEvent(EVENTS.USER_CLICKED_SIGN_IN_WITH_GOOGLE)
      }
      if (provider === SsoProvider.CLEVER) {
        AnalyticsService.captureEvent(EVENTS.USER_CLICKED_SIGN_IN_WITH_CLEVER)
      }
      if (provider === SsoProvider.CLASSLINK) {
        AnalyticsService.captureEvent(
          EVENTS.USER_CLICKED_SIGN_IN_WITH_CLASSLINK
        )
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.alert {
  margin: 25px 0;
  border: 2px solid #fbbc05;
  border-radius: 8px;
  background-color: rgba(251, 188, 5, 0.1);
  padding: 8px 12px;

  strong,
  div,
  a {
    display: block;
    margin-bottom: 6px;
  }

  a:last-child {
    margin-bottom: 0;
  }
}

.uc-form-text {
  text-align: center;
}

.uc-link.subtext {
  margin: 2px 0 0 10px;
}

.button-spinner {
  margin-right: 6px;
  :deep(div) {
    border-color: $c-secondary-grey transparent transparent transparent;
  }
}
</style>
