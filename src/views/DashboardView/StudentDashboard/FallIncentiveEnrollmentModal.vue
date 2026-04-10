<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'
import Modal from '@/components/Modal.vue'
import Loader from '@/components/Loader.vue'
import UpdogHooray from '@/assets/updog-hooray.svg'
import RecaptchaCaption from '@/components/recaptcha/RecaptchaCaption.vue'
import Checkbox from '@/components/CheckBox.vue'
import MazPhoneNumberInput from 'maz-ui/components/MazPhoneNumberInput'
import type {
  CountryCode,
  Result as PhoneResults,
} from 'maz-ui/components/MazPhoneNumberInput'
import { parsePhoneNumber } from 'awesome-phonenumber'
import { EVENTS, VERIFICATION_METHOD, VERIFICATION_TYPE } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import NetworkService from '@/services/NetworkService'
import AuthService from '@/services/AuthService'
import LoggerService from '@/services/LoggerService'
import { enrollStudentToIncentiveProgram } from '@/services/UserProductFlagsService'
import FormEmail from '@/components/FormEmail.vue'
import useVuelidate from '@vuelidate/core'
import type { AxiosError } from 'axios'

const store = useStore()
const { closeModal, isFirstModalView } = defineProps<{
  closeModal: () => void
  isFirstModalView?: boolean
}>()

const phone = ref('')
const isPhoneError = ref(false)
const phoneInput = ref<PhoneResults>({ isValid: false })
const step = ref(1)
const verificationCode = ref('')
const hasResentCode = ref(false)
const isSubmitting = ref(false)
const loadingMessage = ref('')
const error = ref('')
const parentalConsent = defineModel()
const proxyEmail = ref('')

const v$ = useVuelidate()

const user = computed(() => store.state.user.user)
const fallIncentiveProgramPayload = computed(
  () => store.getters['featureFlags/getFallIncentiveProgramPayload']
)
const isValidPhone = computed(() => phoneInput.value.isValid)
const isValidEmail = computed(
  () => !v$.value.$error && !v$.value.$silentErrors?.length
)
const isFallIncentiveParentalConsentEnabled = computed(
  () => store.getters['featureFlags/isFallIncentiveParentalConsentEnabled']
)
const isInternationalCountryCode = computed(
  () => phoneInput.value.countryCode !== 'US'
)
const internationalPhoneInfo = computed(() => {
  if (!user.value.phone) return { number: '', country: 'US' as CountryCode }

  const pn = parsePhoneNumber(user.value.phone)
  return {
    number: pn.number?.international,
    country: pn.regionCode as CountryCode,
  }
})
const isValidVerificationCode = computed(() => {
  return !(
    verificationCode.value.length !== 6 || isNaN(Number(verificationCode.value))
  )
})

const verificationMethod = computed(() =>
  user.value.isSchoolPartner
    ? VERIFICATION_METHOD.EMAIL
    : VERIFICATION_METHOD.SMS
)
const verificationMethodText = computed(() =>
  verificationMethod.value === VERIFICATION_METHOD.SMS
    ? 'phone number'
    : 'email'
)
const sendTo = computed(() =>
  verificationMethod.value === VERIFICATION_METHOD.SMS
    ? phoneInput.value.e164
    : proxyEmail.value
)
const isSendingCodeToUserDisabled = computed(() => {
  if (user.value.isSchoolPartner)
    // No parental consent is needed for school partners
    // Only school partners are given the ption to enroll with email
    return !isValidEmail.value
  else {
    const isVerificationMethodDisabled =
      phone.value === '' ||
      !isValidPhone.value ||
      isInternationalCountryCode.value
    return (
      isVerificationMethodDisabled ||
      (isFallIncentiveParentalConsentEnabled.value && !parentalConsent.value)
    )
  }
})

function handleCloseModal() {
  AnalyticsService.captureEvent(
    EVENTS.STUDENT_FALL_INCENTIVE_ENROLLMENT_MODAL_CLOSED
  )
  closeModal()
}

async function resendCode() {
  await sendCode(true)
  if (!error.value) hasResentCode.value = true
}

async function sendCode(isResending: boolean = false) {
  if (isSubmitting.value) return
  error.value = ''
  isPhoneError.value = false
  AnalyticsService.captureEvent(
    EVENTS.STUDENT_FALL_INCENTIVE_ENROLLMENT_CLICKED_SEND_CODE
  )
  if (
    verificationMethod.value === VERIFICATION_METHOD.SMS &&
    !isValidPhone.value
  ) {
    isPhoneError.value = true
    return
  }

  if (
    (verificationMethod.value === VERIFICATION_METHOD.SMS &&
      isInternationalCountryCode.value) ||
    (verificationMethod.value === VERIFICATION_METHOD.EMAIL &&
      !isValidEmail.value)
  )
    return

  isSubmitting.value = true
  loadingMessage.value = 'Sending a verification code. Please wait...'

  try {
    await NetworkService.sendVerification({
      sendTo: sendTo.value,
      verificationMethod: verificationMethod.value,
      verificationType:
        verificationMethod.value === VERIFICATION_METHOD.EMAIL
          ? VERIFICATION_TYPE.EMAIL_FOR_PROXY_EMAIL
          : undefined,
    })
    step.value = 2
    AnalyticsService.captureEvent(
      isResending
        ? EVENTS.STUDENT_FALL_INCENTIVE_ENROLLMENT_VERIFICATION_CODE_RESENT
        : EVENTS.STUDENT_FALL_INCENTIVE_ENROLLMENT_VERIFICATION_CODE_SENT
    )
  } catch (err) {
    error.value =
      ((err as AxiosError).response?.data as { err?: string })?.err ??
      'Unknown error'
  } finally {
    isSubmitting.value = false
    loadingMessage.value = ''
  }
}

async function handleCodeConfirmation() {
  error.value = ''
  if (isSubmitting.value) return
  isSubmitting.value = true

  if (!isValidVerificationCode.value) {
    error.value = 'Please enter a 6-digit verification code'
    isSubmitting.value = false
    return
  }

  loadingMessage.value = 'Checking the verification code. Please wait...'

  try {
    const {
      data: { success },
    } = await AuthService.confirmVerification({
      verificationCode: verificationCode.value,
      sendTo: sendTo.value,
      verificationMethod: verificationMethod.value,
      forSignup: false,
      verificationType:
        verificationMethod.value === VERIFICATION_METHOD.EMAIL
          ? VERIFICATION_TYPE.EMAIL_FOR_PROXY_EMAIL
          : undefined,
    })
    AnalyticsService.captureEvent(
      EVENTS.STUDENT_FALL_INCENTIVE_ENROLLMENT_CONFIRMED,
      {
        verificationMethod: verificationMethod.value,
      }
    )
    if (success) {
      await enrollStudentToIncentiveProgram(store)
      const addToUserPayload =
        verificationMethod.value === VERIFICATION_METHOD.SMS
          ? {
              phone: phoneInput.value.e164,
              phoneVerified: true,
            }
          : {
              email: proxyEmail.value,
              emailVerified: true,
            }
      store.dispatch('user/addToUser', addToUserPayload)
      step.value = 3
    } else {
      error.value =
        'Please enter the most recent verification code that was sent to you'
    }
  } catch (err) {
    error.value =
      ((err as AxiosError).response?.data as { err?: string })?.err ??
      'Unknown error'
  } finally {
    isSubmitting.value = false
    loadingMessage.value = ''
  }
}

function onPhoneInputUpdate(data: PhoneResults) {
  phoneInput.value = data
}

async function handleEnrollmentDenial() {
  try {
    if (isFirstModalView)
      await NetworkService.deniedIncentiveProgramEnrollment()
  } catch (error) {
    LoggerService.noticeError(
      ((error as AxiosError).response?.data as { err?: string })?.err ??
        'Unknown error'
    )
  } finally {
    handleCloseModal()
  }
}

async function handleStudentPartnerEnrollment() {
  error.value = ''

  if (proxyEmail.value.toLowerCase() === user.value.email.toLowerCase()) {
    error.value = 'Please enter a personal email (not your school email).'
    return
  }

  try {
    await enrollStudentToIncentiveProgram(store, proxyEmail.value)
  } catch (err) {
    error.value =
      ((err as AxiosError).response?.data as { err?: string })?.err ??
      'Unknown error'
  }
  step.value = 3
}

onMounted(() => {
  AnalyticsService.captureEvent(
    EVENTS.STUDENT_FALL_INCENTIVE_ENROLLMENT_MODAL_SHOWN
  )

  if (verificationMethod.value === VERIFICATION_METHOD.SMS) {
    if (user.value.phone) {
      const pn = parsePhoneNumber(user.value.phone)
      if (!pn.number) {
        return
      }
      phone.value = pn.number?.national

      phoneInput.value = {
        isValid: true,
        e164: pn.number?.e164,
      }
    }
  } else {
    if (user.value.proxyEmail) proxyEmail.value = user.value.proxyEmail
  }
})
</script>

<template>
  <div class="incentive-enrollment">
    <modal :backText="''">
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
          <h1
            v-if="user.isSchoolPartner"
            class="incentive-enrollment-modal__title"
          >
            Earn $10 just for getting help! 💸
          </h1>
          <h1 v-else class="incentive-enrollment-modal__title">
            Earn ${{
              fallIncentiveProgramPayload.maxQualifiedSessionsPerWeek * 10
            }}
            a week just for getting help! 💸
          </h1>
          <p
            class="incentive-enrollment-modal__body"
            v-if="user.isSchoolPartner"
          >
            Complete 5 tutoring sessions by February 28th, and we'll send you a
            $10 gift card! 👀
          </p>
          <p
            class="incentive-enrollment-modal__body"
            v-else-if="
              fallIncentiveProgramPayload.maxQualifiedSessionsPerWeek === 1
            "
          >
            This fall, for every week you have a tutoring session on UPchieve,
            we'll send you a $10 gift card—up to $100 total! 👀
          </p>
          <p
            class="incentive-enrollment-modal__body"
            v-else-if="
              fallIncentiveProgramPayload.maxQualifiedSessionsPerWeek >= 2
            "
          >
            This fall, for every week you have
            {{ fallIncentiveProgramPayload.maxQualifiedSessionsPerWeek }}
            tutoring sessions on UPchieve, we'll send you a ${{
              fallIncentiveProgramPayload.maxQualifiedSessionsPerWeek * 10
            }}
            gift card—up to $100 total! 👀
          </p>
          <p
            v-if="verificationMethod === VERIFICATION_METHOD.SMS"
            class="incentive-enrollment-modal__body"
          >
            Join our Fall Challenge by verifying your phone number now!
          </p>
          <p v-else class="incentive-enrollment-modal__body">
            Your school email will not allow virtual gift cards so please enter
            a personal email to enroll in the challenge!
          </p>
        </header>

        <section class="incentive-enrollment-modal__section">
          <label
            class="incentive-enrollment-modal__phone-input"
            v-if="!user.isSchoolPartner"
          >
            Phone Number
            <maz-phone-number-input
              class="incentive-enrollment-modal__phone-input"
              id="phoneNumber"
              required="true"
              v-model="phone"
              :country-code="internationalPhoneInfo.country"
              :only-countries="['US']"
              :no-search="true"
              show-code-on-list
              @update="onPhoneInputUpdate"
            />
            <span v-if="!isValidPhone && isPhoneError" class="error">
              Please enter a valid phone number.
            </span>
            <span v-if="isInternationalCountryCode" class="error">
              Please enter a US phone number.
            </span>
          </label>

          <FormEmail
            v-else
            v-model="proxyEmail"
            :is-required="true"
            label="Personal email"
          />
          <p v-if="error" class="error">
            {{
              error ||
              'We were unable to send a verification code to you. Please try again.'
            }}
          </p>

          <div
            v-if="
              isFallIncentiveParentalConsentEnabled && !user.isSchoolPartner
            "
            class="parental-consent-container"
          >
            <checkbox id="parental-consent" v-model="parentalConsent">
              I have consent from my parent/guardian to receive gift cards.
            </checkbox>
          </div>
        </section>
        <footer class="incentive-enrollment-modal__footer">
          <div
            class="incentive-enrollment-modal__buttons incentive-enrollment-modal__buttons--secondary"
          >
            <large-button
              class="incentive-enrollment-modal__buttons-button"
              @click="handleEnrollmentDenial"
              >No, thanks</large-button
            >
            <large-button
              class="incentive-enrollment-modal__buttons-button incentive-enrollment-modal__buttons-button--primary"
              @click="
                user.isSchoolPartner
                  ? handleStudentPartnerEnrollment()
                  : sendCode()
              "
              :disabled="isSendingCodeToUserDisabled"
              primary
              :showArrow="false"
            >
              {{ user.isSchoolPartner ? 'Enroll' : 'Send code' }}
            </large-button>
          </div>
          <RecaptchaCaption />
        </footer>
      </div>
      <div v-else-if="step === 2" class="incentive-enrollment-modal">
        <header>
          <h1 class="incentive-enrollment-modal__title">
            We just sent a verification code to
            <span class="verification__send-to">{{ sendTo }}</span>
          </h1>
        </header>

        <section class="incentive-enrollment-modal__section">
          <div class="uc-form-element">
            <label for="verification-code"
              >Enter your 6-digit verification code</label
            >
            <input
              id="verification-code"
              class="uc-form-text-input"
              v-model="verificationCode"
              type="text"
              placeholder="XXXXXX"
              autocomplete="off"
              required
            />
          </div>
          <div
            class="uc-form-subtext verification__sub-text"
            v-if="!hasResentCode"
          >
            Did not receive a code?
            <span
              :disabled="isSubmitting ? true : null"
              @click="resendCode"
              class="uc-link"
              >Resend code</span
            >
          </div>
        </section>
        <p v-if="error" class="error">
          {{
            error || 'We were unable to verify your number. Please try again.'
          }}
        </p>
        <footer class="incentive-enrollment-modal__footer">
          <div
            class="incentive-enrollment-modal__buttons incentive-enrollment-modal__buttons--secondary"
          >
            <!-- Only show close button if there is an error -->
            <large-button
              v-if="error"
              class="incentive-enrollment-modal__buttons-button"
              @click="handleCloseModal"
              >Close</large-button
            >
            <large-button
              class="incentive-enrollment-modal__buttons-button incentive-enrollment-modal__buttons-button--primary"
              @click="handleCodeConfirmation"
              :disabled="!isValidVerificationCode ? true : null"
              :showArrow="false"
              primary
            >
              Verify my
              {{ verificationMethodText }}
            </large-button>
          </div>
        </footer>
      </div>
      <div v-else-if="step === 3" class="incentive-enrollment-modal">
        <header>
          <h1
            class="incentive-enrollment-modal__title incentive-enrollment-modal__title--center"
          >
            {{
              user.isSchoolPartner
                ? `You're enrolled!`
                : `Your ${verificationMethodText} is verified!`
            }}
          </h1>
        </header>

        <section class="incentive-enrollment-modal__section--center">
          <updog-hooray class="updog" />
        </section>
        <footer class="incentive-enrollment-modal__footer">
          <div class="incentive-enrollment-modal__buttons">
            <large-button
              class="incentive-enrollment-modal__buttons-button incentive-enrollment-modal__buttons-button--single"
              @click="handleCloseModal"
              :showArrow="false"
              primary
            >
              Done
            </large-button>
          </div>
        </footer>
      </div>
    </modal>
  </div>
</template>

<style lang="scss" scoped>
.incentive-enrollment {
  z-index: 10;
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
    :deep(.m-input-wrapper) {
      width: 100%;
    }
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

.parental-consent-container {
  margin-top: 0.4em;
}
</style>
