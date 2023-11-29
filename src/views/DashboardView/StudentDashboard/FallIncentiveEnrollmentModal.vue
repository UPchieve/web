<template>
  <div class="incentive-enrollment">
    <modal :backText="''">
      <template>
        <div v-if="isSubmitting" class="incentive-enrollment-modal">
          <section
            class="incentive-enrollment-modal__section incentive-enrollment-modal__section--center"
          >
            <loader
              :message="loadingMessage"
              class="incentive-enrollment-modal__loader"
            />
          </section>
        </div>
        <div v-else-if="step === 1" class="incentive-enrollment-modal">
          <header>
            <h1 class="incentive-enrollment-modal__title">
              Want to earn $10 a week this fall, just for having a session? 💸🎓
            </h1>
            <p class="incentive-enrollment-modal__body">
              Provide your phone number to enroll in our Fall UPchieve
              challenge. Get text reminders & never miss out on the opportunity
              to earn and learn.
            </p>
          </header>

          <section class="incentive-enrollment-modal__section">
            <label class="incentive-enrollment-modal__phone-input">
              Phone Number
              <vue-phone-number-input
                class="incentive-enrollment-modal__phone-input"
                v-model="phone"
                :error="phone !== '' && !isValidPhone"
                :default-country-code="internationalPhoneInfo.country"
                :required="true"
                color="#555"
                valid-color="#16ba97"
                @update="data => (phoneInput = data)"
              />

              <span v-if="!isValidPhone && isPhoneError" class="error"
                >Please enter a valid phone number.</span
              >
            </label>
            <p v-if="error" class="error">
              {{
                error || 'We were unable to save your number. Please try again.'
              }}
            </p>
          </section>
          <footer class="incentive-enrollment-modal__footer">
            <div
              class="incentive-enrollment-modal__buttons incentive-enrollment-modal__buttons--secondary"
            >
              <large-button
                class="incentive-enrollment-modal__buttons-button"
                @click.native="handleCloseModal"
                >No, thanks</large-button
              >
              <large-button
                class="incentive-enrollment-modal__buttons-button incentive-enrollment-modal__buttons-button--primary"
                @click.native="sendCode"
                :disabled="phone === '' || !isValidPhone"
                primary
                :showArrow="false"
                >Send code</large-button
              >
            </div>
            <RecaptchaCaption />
          </footer>
        </div>
        <div v-else-if="step === 2" class="incentive-enrollment-modal">
          <header>
            <h1 class="incentive-enrollment-modal__title">
              We just texted you your verification code to
              <span class="verification__send-to">{{ phone }}</span>
            </h1>
          </header>

          <section class="incentive-enrollment-modal__section">
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
            <div
              class="uc-form-subtext verification__sub-text"
              v-if="!hasResentCode"
            >
              Did not receive a text?
              <span :disabled="isSubmitting" @click="resendCode" class="uc-link"
                >Resend code</span
              >
            </div>
          </section>
          <footer class="incentive-enrollment-modal__footer">
            <div
              class="incentive-enrollment-modal__buttons incentive-enrollment-modal__buttons--secondary"
            >
              <large-button
                class="incentive-enrollment-modal__buttons-button  incentive-enrollment-modal__buttons-button--primary"
                @click.native="handlePhoneConfirmation"
                :disabled="!isValidVerificationCode"
                :showArrow="false"
                primary
              >
                Verify my phone number
              </large-button>
            </div>
          </footer>
        </div>
        <div v-else-if="step === 3" class="incentive-enrollment-modal">
          <header>
            <h1
              class="incentive-enrollment-modal__title incentive-enrollment-modal__title--center"
            >
              Your phone is verified!
            </h1>
          </header>

          <section class="incentive-enrollment-modal__section--center">
            <updog-hooray class="updog" />
          </section>
          <footer class="incentive-enrollment-modal__footer">
            <div class="incentive-enrollment-modal__buttons">
              <large-button
                class="incentive-enrollment-modal__buttons-button  incentive-enrollment-modal__buttons-button--single"
                @click.native="handleCloseModal"
                :showArrow="false"
                primary
              >
                Done
              </large-button>
            </div>
          </footer>
        </div>
      </template>
    </modal>
  </div>
</template>

<script>
import LargeButton from '@/components/LargeButton.vue'
import Modal from '@/components/Modal.vue'
import { EVENTS, VERIFICATION_METHOD } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import NetworkService from '@/services/NetworkService'
import AuthService from '@/services/AuthService'
import PhoneNumber from 'awesome-phonenumber'
import VuePhoneNumberInput from 'vue-phone-number-input'
import { mapState } from 'vuex'
import Loader from '@/components/Loader.vue'
import UpdogHooray from '@/assets/updog-hooray.svg'
import RecaptchaCaption from '@/components/recaptcha/RecaptchaCaption.vue'

export default {
  name: 'IncentiveEnrollmentPreventionModal',
  components: {
    RecaptchaCaption,
    Modal,
    LargeButton,
    VuePhoneNumberInput,
    Loader,
    UpdogHooray,
  },
  data() {
    return {
      phone: '',
      isPhoneError: false,
      phoneInput: {},
      step: 1,
      verificationCode: '',
      hasResentCode: false,
      loadingMessage: '',
      isSubmitting: false,
      error: '',
    }
  },
  mounted() {
    localStorage.setItem('hasSeenFallIncentiveEnrollmentModal', true)
    AnalyticsService.captureEvent(
      EVENTS.STUDENT_FALL_INCENTIVE_ENROLLMENT_MODAL_SHOWN
    )
    if (this.user.phone) {
      const pn = new PhoneNumber(this.user.phone)
      this.phone = pn.getNumber('national')
      // Hack to initially mock the vue-incentive-enrollment-input data
      this.phoneInput = {
        isValid: true,
        e164: pn.getNumber('e164'),
        error: '',
      }
    }
  },

  computed: {
    ...mapState({
      user: state => state.user.user,
    }),
    isValidPhone() {
      return this.phoneInput.isValid
    },
    internationalPhoneInfo() {
      if (!this.user.phone) return { number: '', country: '' }

      const pn = new PhoneNumber(this.user.phone)

      return {
        number: pn.getNumber('international'),
        country: pn.getRegionCode(),
      }
    },
    isValidVerificationCode() {
      return !(
        this.verificationCode.length !== 6 ||
        isNaN(Number(this.verificationCode))
      )
    },
  },
  props: {
    closeModal: { required: true, type: Function },
  },
  methods: {
    handleCloseModal() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_FALL_INCENTIVE_ENROLLMENT_MODAL_CLOSED
      )
      this.closeModal()
    },
    async resendCode() {
      await this.sendCode()
      if (!this.error) this.hasResentCode = true
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_FALL_INCENTIVE_ENROLLMENT_VERIFICATION_CODE_RESENT
      )
    },
    async sendCode() {
      this.error = ''
      if (!this.isValidPhone) this.phoneError = true
      if (this.isSubmitting) return
      this.isSubmitting = true
      this.loadingMessage = 'Sending a verification code. Please wait...'

      try {
        await NetworkService.sendVerification({
          sendTo: this.phoneInput.e164,
          verificationMethod: VERIFICATION_METHOD.SMS,
        })
        this.step = 2
        this.error = ''
        AnalyticsService.captureEvent(
          EVENTS.STUDENT_FALL_INCENTIVE_ENROLLMENT_VERIFICATION_CODE_SENT
        )
      } catch (error) {
        this.error = error.response.data.err
      } finally {
        this.isSubmitting = false
        this.loadingMessage = ''
      }
    },
    async handlePhoneConfirmation() {
      this.error = ''
      if (this.isSubmitting) return
      this.isSubmitting = true

      if (!this.isValidVerificationCode) {
        this.error = 'Please enter a 6-digit verification code'
        this.isSubmitting = false
        return
      }

      this.loadingMessage = 'Checking the verification code. Please wait...'

      try {
        const {
          data: { success },
        } = await AuthService.confirmVerification({
          verificationCode: this.verificationCode,
          sendTo: this.phoneInput.e164,
          verificationMethod: VERIFICATION_METHOD.SMS,
          forSignup: false,
        })
        AnalyticsService.captureEvent(
          EVENTS.STUDENT_FALL_INCENTIVE_ENROLLMENT_PHONE_CONFIRMED
        )
        if (success) {
          await NetworkService.fallIncentiveProgramEnrollmentEnroll({})
          AnalyticsService.captureEvent(
            EVENTS.STUDENT_FALL_INCENTIVE_ENROLLMENT_ENROLLED
          )
          this.$store.dispatch('user/addToUser', {
            phone: this.phoneInput.e164,
          })
          this.$store.dispatch('productFlags/addToProductFlags', {
            fallIncentiveProgram: true,
          })
          this.step = 3
        } else
          this.error =
            'Please enter the most recent verification code that was sent to you'
      } catch (error) {
        this.error = error.response.data.err
      } finally {
        this.isSubmitting = false
        this.loadingMessage = ''
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.incentive-enrollment {
  // Ensure this is shown other overlapping modals
  z-index: 1000;
}

.incentive-enrollment-modal {
  text-align: initial;

  &__title {
    @include font-category('display-small');
    font-weight: 500;
    margin-top: 1em;
    margin-bottom: 1em;

    &--center {
      text-align: center;
    }
  }

  &__subtitle {
    @include font-category('display-small');
    margin-bottom: 0.5em;
    margin-top: 1em;
  }

  &__section--center,
  &__loader {
    @include flex-container(column, center, center);
  }

  &__body {
    @include font-category('heading');
    margin-bottom: 0.5em;
    margin-top: 1em;
  }

  &__buttons {
    @include flex-container(row, space-between, center);
    margin: 1.6em 0 0.4em 0;
    & span:first-child,
    & button:first-child {
      margin-right: 1em;
    }

    &-button {
      margin: 0 auto;
      width: 100%;
      margin-bottom: 1.3em;

      @include breakpoint-above('small') {
        width: 250px;
        margin-bottom: initial;
      }

      &--primary,
      &--single {
        background-color: $c-information-blue;
        &:hover {
          background: darken($c-information-blue, 5%);

          &:disabled {
            background: $c-background-grey;
          }
        }
      }

      &--single {
        margin-right: auto !important;
      }
    }

    &--secondary {
      @include flex-container(row, flex-end, center);
      & button {
        margin: initial;
      }
    }
  }

  &__phone-input {
    margin-top: 0.4em;
    width: 100%;
    font-weight: 500;
  }
}

.error {
  color: $c-error-red;
  margin: 1em 0;
}

.fall-incentive-link {
  color: $c-information-blue;
}

.updog {
  width: 120px;
  height: 120px;
}
</style>
