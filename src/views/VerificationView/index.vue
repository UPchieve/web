<template>
  <form-page-template>
    <div class="uc-form">
      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <VerificationMethodSelector
        v-if="step === 1 && userMustEnterVerificationDetails"
        data-testid="verification-method-selector"
        :email="user.email"
        v-model="verificationInputs"
      />

      <!-- Verify code -->
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
            autocomplete="off"
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
            :disabled="isSubmitting ? true : null"
            @click.prevent="sendCode"
            class="uc-link"
            >Resend code</span
          >
        </div>
      </div>

      <div class="buttons-container">
        <button
          class="uc-form-button"
          type="button"
          @click.prevent="sendCode"
          v-if="step === 1"
          :disabled="
            verificationInputs.method === VERIFICATION_METHOD.SMS &&
            !verificationInputs.phoneInputInfo.isValid
              ? true
              : null
          "
        >
          {{ sendCodeButtonText }}
        </button>
        <button
          class="uc-form-button"
          type="submit"
          @click.prevent="confirmVerificationCode"
          :disabled="!isValidVerificationCode ? true : null"
          v-if="step === 2"
        >
          Verify my account
        </button>
        <LargeButton
          class="uc-form-button-secondary"
          @click="logout"
          type="button"
          variant="text"
          :show-arrow="false"
        >
          Logout
        </LargeButton>
      </div>
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
import * as UserProductFlagsService from '@/services/UserProductFlagsService'
import { EVENTS, VERIFICATION_METHOD } from '@/consts'
import VerificationMethodSelector from '@/views/VerificationView/VerificationMethodSelector.vue'
import LargeButton from '@/components/LargeButton.vue'

export default {
  name: 'VerificationView',
  components: {
    FormPageTemplate,
    Loader,
    VerificationMethodSelector,
    LargeButton,
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
    if (this.isSmsVerificationEnabled || this.isForceSmsVerificationEnabled) {
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
    userMustEnterVerificationDetails() {
      return this.isSmsVerificationEnabled || this.isForceSmsVerificationEnabled
    },
    VERIFICATION_METHOD() {
      return VERIFICATION_METHOD
    },
    ...mapState({
      user: (state) => state.user.user,
    }),
    ...mapGetters({
      isAutoFlowUser: 'user/isAutoFlowUser',
      isSmsVerificationEnabled: 'featureFlags/isSmsVerificationEnabled', // Whether SMS verification is enabled across the app
      isFallIncentiveProgramEnabled:
        'featureFlags/isFallIncentiveProgramEnabled',
      isStudentsBecomeVolunteersEnabled:
        'featureFlags/isStudentsBecomeVolunteersEnabled',
      isForceSmsVerificationEnabled:
        'featureFlags/isForceSmsVerificationEnabled',
      userType: 'user/userType',
      isVolunteer: 'user/isVolunteer',
      isStudentVolunteer: 'user/isStudentVolunteer',
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
      } finally {
        this.isSubmitting = false
        this.loadingMessage = ''
      }
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
            userUpdates.phone = this.sendTo
            AnalyticsService.captureEvent(EVENTS.PHONE_NUMBER_VERIFIED)
            if (
              this.user.userType === 'student' &&
              this.isFallIncentiveProgramEnabled
            ) {
              try {
                await UserProductFlagsService.enrollStudentToIncentiveProgram(
                  this.$store
                )
              } catch (error) {
                LoggerService.noticeError(error.response?.data)
              }
            }
          } else {
            userUpdates.emailVerified = true
            AnalyticsService.captureEvent(EVENTS.EMAIL_VERIFIED)
          }
          if (!this.isStudentVolunteer) {
            await this.$store.dispatch('user/firstDashboardVisit', true)
          }

          await this.$store.dispatch('user/addToUser', userUpdates)

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
      } finally {
        this.isSubmitting = false
        this.loadingMessage = ''
      }
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
  border: 1px solid $c-border-grey;
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
