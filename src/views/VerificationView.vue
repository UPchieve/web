<template>
  <form-page-template>
    <div class="uc-form">
      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <div v-if="step === 1">
        <button
          v-if="error"
          class="uc-form-button"
          @click.prevent="sendCode"
          :disabled="isSubmitting"
        >
          {{ sendCodeButtonText }}
        </button>
      </div>

      <div v-if="step === 2">
        <p class="uc-form-text center">
          We just emailed your verification code to
          <span class="verification__send-to">{{ email }}</span>
        </p>
        <div class="uc-form-element">
          <label for="verification-code">
            Enter your 6-digit verification code
          </label>
          <input
            id="verification-code"
            class="uc-form-text-input"
            v-model="verificationCode"
            type="text"
            placeholder="XXXXXX"
            required
          />
        </div>

        <button
          class="uc-form-button"
          type="submit"
          @click.prevent="confirmVerificationCode"
          :disabled="!isValidVerificationCode"
        >
          Verify my account
        </button>

        <div class="uc-form-subtext verification__sub-text">
          Did not receive an email?
          <span
            :disabled="isSubmitting"
            @click.prevent="sendCode"
            class="uc-link"
            >Resend code</span
          >
        </div>
      </div>

      <div v-if="step === 3">
        <verification-badge />
        <h1 class="uc-form-header center">
          You’re verified <span v-if="showEmoji">😎</span>
        </h1>
        <p class="uc-form-text center">
          Woohoo! Welcome to UPchieve.
        </p>
        <large-button
          primary
          :routeTo="isAutoFlowUser ? '/welcome' : '/'"
          class="uc-form-button"
        >
          Take me to the dashboard
        </large-button>
      </div>

      <button class="uc-form-button-secondary" @click="logout">Logout</button>
    </div>

    <loader v-if="isSubmitting" :message="loadingMessage" overlay />
  </form-page-template>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import Loader from '@/components/Loader.vue'
import AuthService from '@/services/AuthService'
import VerificationBadge from '@/assets/verification.svg'
import LargeButton from '@/components/LargeButton.vue'
import LoggerService from '@/services/LoggerService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS, VERIFICATION_METHOD } from '@/consts'

export default {
  name: 'VerificationView',
  components: {
    FormPageTemplate,
    VerificationBadge,
    LargeButton,
    Loader,
  },
  data() {
    return {
      step: 1,
      verificationCode: '',
      loadingMessage: '',
      error: '',
      isSubmitting: false,
      email: '',
    }
  },
  mounted() {
    this.$store.dispatch('app/hideNavigation')
    this.email = this.user.email
    this.sendCode()
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
    }),
    ...mapGetters({
      isAutoFlowUser: 'user/isAutoFlowUser',
    }),
    isValidVerificationCode() {
      return !(
        this.verificationCode.length !== 6 ||
        isNaN(Number(this.verificationCode))
      )
    },
    sendCodeButtonText() {
      if (this.isSubmitting) {
        return 'Sending...'
      }

      return 'Resend verification code'
    },
    showEmoji() {
      return !this.user.isVolunteer
    },
  },
  methods: {
    async sendCode() {
      this.error = ''
      if (this.isSubmitting) return
      this.isSubmitting = true
      this.loadingMessage = 'Sending a verification email. Please wait...'
      try {
        await AuthService.initiateVerification({
          sendTo: this.email,
          verificationMethod: VERIFICATION_METHOD.EMAIL,
        })
        this.step = 2
        this.error = ''
      } catch (error) {
        this.handleRequestError(error)
      }

      this.isSubmitting = false
      this.loadingMessage = ''
    },
    async confirmVerificationCode() {
      this.error = ''
      if (this.isSubmitting) return
      this.isSubmitting = true

      if (!this.isValidVerificationCode) {
        this.error = 'Please enter a 6-digit verification code'
        this.isSubmitting = false
        return
      }

      try {
        const {
          data: { success },
        } = await AuthService.confirmVerification({
          verificationCode: this.verificationCode,
          sendTo: this.email,
          verificationMethod: VERIFICATION_METHOD.EMAIL,
        })
        if (success) {
          AnalyticsService.captureEvent(EVENTS.ACCOUNT_VERIFIED, {
            event: EVENTS.ACCOUNT_VERIFIED,
          })
          this.$store.dispatch('user/firstDashboardVisit', true)
          this.$store.dispatch('user/addToUser', {
            verified: true,
          })
          this.step = 3
        } else {
          this.error =
            'Please enter the most recent verification code that was sent to you'
        }
      } catch (error) {
        this.handleRequestError(error)
      }
      this.isSubmitting = false
    },
    handleRequestError(error) {
      if (error.status !== 422) LoggerService.noticeError(error)
      this.error =
        error.message ||
        'Sorry, looks like something went wrong. Please try again in a few minutes.'
    },
    logout() {
      AuthService.logout(this)
    },
  },
}
</script>

<style lang="scss" scoped>
.verification {
  &__container {
    @include flex-container(row, flex-start, center);
  }

  &__radio-label {
    @include flex-container(column, flex-start, flex-start);
    padding-left: 2em;
  }

  &__label {
    font-weight: 500;
  }

  &__sub-text {
    text-align: center;
    padding-top: 1em;
  }

  .verification-nav__button {
    text-align: left;
    margin-top: 1em;
    margin-left: 1em;
  }

  &__send-to {
    display: block;
    font-weight: 500;
  }
}

.uc-form-button-secondary {
  margin-top: auto;
}
</style>
