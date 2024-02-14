<template>
  <form-page-template>
    <div class="uc-form">
      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <!--        If sms-verification is enabled, give the user the option to choose verification method in step 1-->
      <verification-method-selector
        v-if="step === 1 && isSmsVerificationEnabled"
        data-testid="verification-method-selector"
        :email="user.email"
        v-model="verificationInputs"
      />

      <!-- Verify code-->
      <div v-if="step === 2" data-testid="step-2">
        <p class="uc-form-text center">
          We just sent your verification code to
          <span id="ph-no-capture" class="verification__send-to">{{
            sendTo
          }}</span>
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

        <div class="uc-form-subtext verification__sub-text">
          Did not receive
          {{
            verificationInputs.method === VERIFICATION_METHOD.SMS
              ? 'a text'
              : 'an email'
          }}?
          <span
            :disabled="isSubmitting"
            @click.prevent="sendCode"
            class="uc-link"
            >Resend code</span
          >
        </div>
      </div>

      <div class="buttons-container">
        <button
          class="uc-form-button"
          @click.prevent="sendCode"
          v-if="step === 1"
          :disabled="
            verificationInputs.method === VERIFICATION_METHOD.SMS &&
            !verificationInputs.phoneInputInfo.isValid
          "
        >
          {{ sendCodeButtonText }}
        </button>
        <button
          class="uc-form-button"
          type="submit"
          @click.prevent="confirmVerificationCode"
          :disabled="!isValidVerificationCode"
          v-if="step === 2"
        >
          Verify my account
        </button>
        <button class="uc-form-button-secondary" @click="logout">Logout</button>
      </div>

      <RecaptchaCaption />
    </div>

    <loader v-if="isSubmitting" :message="loadingMessage" overlay />
  </form-page-template>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import Loader from '@/components/Loader.vue'
import AuthService from '@/services/AuthService'
import LoggerService from '@/services/LoggerService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS, VERIFICATION_METHOD } from '@/consts'
import RecaptchaCaption from '@/components/recaptcha/RecaptchaCaption.vue'
import VerificationMethodSelector from '@/views/VerificationView/VerificationMethodSelector.vue'

export default {
  name: 'VerificationView',
  components: {
    RecaptchaCaption,
    FormPageTemplate,
    Loader,
    VerificationMethodSelector,
  },
  data() {
    return {
      step: 1,
      verificationCode: '',
      verificationInputs: {
        method: VERIFICATION_METHOD.EMAIL,
        phoneInputInfo: {},
      },
      loadingMessage: '',
      error: '',
      isSubmitting: false,
    }
  },
  beforeMount() {
    if (this.isSmsVerificationEnabled) {
      this.step = 1
    } else {
      this.step = 2
      this.verificationInputs.method = VERIFICATION_METHOD.EMAIL
      this.sendCode()
    }
  },
  mounted() {
    this.$store.dispatch('app/hideNavigation')
  },
  computed: {
    VERIFICATION_METHOD() {
      return VERIFICATION_METHOD
    },
    ...mapState({
      user: (state) => state.user.user,
    }),
    ...mapGetters({
      isAutoFlowUser: 'user/isAutoFlowUser',
      isSmsVerificationEnabled: 'featureFlags/isSmsVerificationEnabled', // Whether SMS verification is enabled across the app
    }),
    sendTo() {
      if (this.verificationInputs.method === VERIFICATION_METHOD.SMS) {
        return this.verificationInputs.phoneInputInfo.e164
      } else {
        return this.user.email
      }
    },
    isValidVerificationCode() {
      return !(
        this.verificationCode.length !== 6 ||
        isNaN(Number(this.verificationCode))
      )
    },
    sendCodeButtonText() {
      if (this.isSubmitting) {
        return 'Sending...'
      } else if (this.error) {
        return 'Resend verification code'
      } else {
        return 'Send code'
      }
    },
  },
  methods: {
    async sendCode() {
      this.error = ''
      if (this.isSubmitting) return
      this.isSubmitting = true
      this.loadingMessage = 'Sending a verification code. Please wait...'
      try {
        await AuthService.initiateVerification({
          sendTo: this.sendTo,
          verificationMethod: this.verificationInputs.method,
          userId: this.user.id,
          firstName: this.user.firstName,
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
          sendTo: this.sendTo,
          verificationMethod: this.verificationInputs.method,
        })
        if (success) {
          AnalyticsService.captureEvent(EVENTS.ACCOUNT_VERIFIED, {
            verificationMethod: this.verificationInputs.method,
          })
          const userUpdates = { verified: true }
          if (this.verificationInputs.method === VERIFICATION_METHOD.SMS) {
            userUpdates.phoneVerified = true
          } else {
            userUpdates.emailVerified = true
          }
          this.$store.dispatch('user/firstDashboardVisit', true)
          this.$store.dispatch('user/addToUser', userUpdates)

          if (this.isAutoFlowUser) {
            this.$router.push('/welcome')
          } else {
            this.$router.push('/')
          }
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
      this.error =
        error.response?.data?.err ??
        'Sorry, looks like something went wrong. Please try again in a few minutes.'
      if (error.status !== 422) LoggerService.noticeError(error.response?.data)
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
  width: 100%;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert {
  margin-top: 0px;
  text-align: center;
}

.uc-form {
  justify-content: space-between;
}
</style>
