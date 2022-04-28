<template>
  <form-page-template>
    <form class="uc-form" aria-labelledby="verificationForm">
      <nav class="uc-form-header" aria-label="Options">
        <span
          class="verification__back-button"
          @click="goBack"
          v-if="step === 2"
          >← Back</span
        >
        <div
          class="uc-form-header-link verification__log-out-button"
          v-on:click="logout"
          v-on:keydown.enter="logout"
        >
          Log out
        </div>
      </nav>
      <div class="uc-form-body" v-if="step === 1">
        <h1 class="title">
          You’re almost there!
        </h1>
        <p>
          Confirm you're not a <span v-if="showEmoji">🤖</span
          ><span v-else>robot</span> by verifying your account. Please select
          how you would like to receive your verification code.
        </p>
        <div class="verification__container">
          <input
            class="uc-form-input"
            v-model="verificationMethod"
            type="radio"
            value="email"
            id="verification-email"
          />
          <label for="verification-email" class="verification__radio-label">
            <span class="verification__label">By email</span>
            <input
              class="uc-form-input verification__field"
              type="email"
              v-model="email"
              id="verification-email"
              aria-label="Email"
            />
          </label>
        </div>

        <div class="verification__container">
          <input
            class="uc-form-input"
            v-model="verificationMethod"
            type="radio"
            value="sms"
            id="verification-sms"
          />
          <label for="verification-sms" class="verification__radio-label">
            <span class="verification__label">By text message</span>
            <vue-phone-number-input
              class="verification__phone-input"
              v-model="phoneNational"
              color="#555"
              valid-color="#16ba97"
              @update="onPhoneInputUpdate"
              @click="clickedPhone"
              :default-country-code="internationalPhoneInfo.country"
            />
          </label>
        </div>
        <p v-if="error" class="error" role="alert">
          {{ error }}
        </p>

        <button
          class="uc-form-button"
          type="submit"
          @click.prevent="sendCode"
          :disabled="!isValidForm"
        >
          {{ sendCodeButtonText }}
        </button>
      </div>

      <div class="uc-form-body" v-if="step === 2">
        <p v-if="isTextMessageSelected">
          We just texted your verification code to
          <span class="verification__send-to">{{ phoneNational }}</span>
        </p>

        <p v-else>
          We just emailed your verification code to
          <span class="verification__send-to">{{ sendTo }}</span>
        </p>
        <div class="verification__container">
          <label for="verification-code" class="verification__radio-label">
            <span class="verification__label"
              >Enter your 6-digit verification code:</span
            >
            <input
              class="uc-form-input uc-form-input--wide"
              v-model="verificationCode"
              type="input"
              id="verification-code"
              placeholder="XXXXXX"
            />
          </label>
        </div>

        <p v-if="error" class="error" role="alert">
          {{ error }}
        </p>

        <button
          class="uc-form-button"
          type="submit"
          @click.prevent="confirmVerificationCode"
          :disabled="!isValidVerificationCode"
        >
          Verify my account
        </button>
      </div>

      <div v-if="step === 3" class="uc-form-body uc-form-body--center">
        <div>
          <verification-badge />
          <h3>You’re verified <span v-if="showEmoji">😎</span></h3>
          <p>
            Woohoo! Welcome to UPchieve.
          </p>
        </div>
        <div>
          <large-button primary routeTo="/" class="uc-form-button-big">
            Take me to the dashboard
          </large-button>
        </div>
      </div>

      <form-footer v-if="!isMobileApp" />
    </form>
  </form-page-template>
</template>

<script>
import { mapState } from 'vuex'
import FormPageTemplate from '@/components/FormPageTemplate'
import FormFooter from '@/components/FormFooter'
import VuePhoneNumberInput from 'vue-phone-number-input'
import AuthService from '@/services/AuthService'
import VerificationBadge from '@/assets/verification.svg'
import { VERIFICATION_METHOD } from '@/consts'
import LargeButton from '@/components/LargeButton'
import * as Sentry from '@sentry/browser'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import PhoneNumber from 'awesome-phonenumber'

export default {
  name: 'VerificationView',
  components: {
    FormPageTemplate,
    FormFooter,
    VuePhoneNumberInput,
    VerificationBadge,
    LargeButton
  },
  data() {
    return {
      verificationMethod: 'email',
      phoneInputInfo: {},
      phoneNational: '',
      step: 1,
      verificationCode: '',
      sendTo: '',
      error: '',
      isSubmitting: false,
      email: ''
    }
  },
  mounted() {
    this.$store.dispatch('app/hideNavigation')
    this.email = this.user.email || ''
    const phoneNumber = new PhoneNumber(this.user.phone || '')
    this.phoneNational = phoneNumber.getNumber('national')
    // Hack to initially mock the vue-phone-number-input data
    this.phoneInputInfo = {
      isValid: true,
      e164: phoneNumber.getNumber('e164')
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    isValidForm() {
      if (!this.verificationMethod) return false
      if (this.isTextMessageSelected && !this.phoneInputInfo.e164) return false
      if (this.isTextMessageSelected && !this.phoneInputInfo.isValid)
        return false
      if (!this.isTextMessageSelected && !this.isValidEmail) return false
      return true
    },
    isValidVerificationCode() {
      return !(
        this.verificationCode.length !== 6 ||
        isNaN(Number(this.verificationCode))
      )
    },
    isValidEmail() {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)
    },
    isTextMessageSelected() {
      return this.verificationMethod === VERIFICATION_METHOD.SMS
    },
    sendCodeButtonText() {
      if (this.isTextMessageSelected && !this.phoneInputInfo.e164)
        return 'Please enter a phone number'
      if (this.isTextMessageSelected && !this.phoneInputInfo.isValid)
        return 'Please enter a valid phone number'
      if (!this.isTextMessageSelected && !this.isValidEmail)
        return 'Please enter a valid email address'

      return 'Send my code'
    },
    internationalPhoneInfo() {
      const phoneNumber = new PhoneNumber(this.user.phone || '')
      return {
        number: phoneNumber.getNumber('international'),
        country: phoneNumber.getRegionCode()
      }
    },
    showEmoji() {
      return !this.user.isVolunteer
    }
  },
  methods: {
    onPhoneInputUpdate(phoneInputInfo) {
      this.phoneInputInfo = phoneInputInfo
    },
    clickedPhone() {
      this.verificationMethod = VERIFICATION_METHOD.SMS
    },
    async sendCode() {
      this.error = ''
      if (this.isSubmitting) return
      this.isSubmitting = true

      if (!this.isValidForm) {
        this.error = 'Please select your email or phone number'
        return
      }
      if (this.isTextMessageSelected) this.sendTo = this.phoneInputInfo.e164
      else {
        if (this.isValidEmail) this.sendTo = this.email
      }

      try {
        await AuthService.initiateVerification({
          sendTo: this.sendTo,
          verificationMethod: this.verificationMethod
        })
        this.step = 2
      } catch (error) {
        this.handleRequestError(error)
      }

      this.isSubmitting = false
    },
    async confirmVerificationCode() {
      this.error = ''
      if (this.isSubmitting) return
      this.isSubmitting = true

      if (!this.isValidVerificationCode) {
        this.error = 'Please enter a 6-digit verification code'
        return
      }

      try {
        const {
          data: { success }
        } = await AuthService.confirmVerification({
          verificationCode: this.verificationCode,
          sendTo: this.sendTo,
          verificationMethod: this.verificationMethod
        })
        if (success) {
          AnalyticsService.captureEvent(EVENTS.ACCOUNT_VERIFIED, {
            event: EVENTS.ACCOUNT_VERIFIED
          })
          this.$store.dispatch('user/firstDashboardVisit', true)
          this.$store.dispatch('user/addToUser', {
            verified: true
          })
          this.step = 3
        } else {
          this.error =
            'Please enter the most recent verification code that was sent to you'
          this.isSubmitting = false
        }
      } catch (error) {
        this.handleRequestError(error)
      }
    },
    handleRequestError(error) {
      if (error.status !== 422) Sentry.captureException(error)
      this.error = error.message
    },
    goBack() {
      this.error = ''
      this.step -= 1
    },
    logout() {
      AuthService.logout(this)
    }
  }
}
</script>

<style lang="scss" scoped>
.title {
  @include font-category('display-small');
}

.subtitle {
  @include font-category('heading');
}

.verification {
  &__container {
    @include flex-container(row, flex-start, center);
  }

  &__radio-label {
    @include flex-container(column, flex-start, flex-start);
    padding-left: 2em;
  }

  &__phone-input {
    width: 300px;
  }

  &__label {
    font-weight: 500;
  }

  .verification-nav__button {
    text-align: left;
    margin-top: 1em;
    margin-left: 1em;
  }

  &__back-button {
    color: #417db1;
    border-radius: 20px;
    padding: 5px 15px;
    cursor: pointer;

    &:hover {
      background: #f7fcfe;
    }
  }

  &__send-to {
    display: block;
    font-weight: 500;
  }

  &__log-out-button {
    margin-left: auto;
    &:hover {
      text-decoration: underline;
    }
  }
  &__field {
    text-align: left;
    width: 300px;
    border-bottom: 3px solid $c-success-green;
    padding: initial;
  }
}

.uc-form-input--wide {
  width: 300px;
}

.uc-form-button {
  text-transform: initial;
}

.error {
  color: $c-error-red;
  margin-bottom: 0;
}
</style>
