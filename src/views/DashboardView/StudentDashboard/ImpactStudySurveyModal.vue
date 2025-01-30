<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { EVENTS, VERIFICATION_TYPE } from '@/consts'
import CrossIcon from '@/assets/cross.svg'
import UpdogStarIcon from '@/assets/updog-star.svg'
import LargeButton from '@/components/LargeButton.vue'
import Modal from '@/components/Modal.vue'
import FormEmail from '@/components/FormEmail.vue'
import RecaptchaCaption from '@/components/recaptcha/RecaptchaCaption.vue'
import Loader from '@/components/Loader.vue'
import { useSurvey } from '@/composables/useSurvey'
import { useVerification } from '@/composables/useVerification'
import { useStepper } from '@/composables/useStepper'
import AnalyticsService from '@/services/AnalyticsService'
import FeatureFlagService from '@/services/FeatureFlagService'
import { SURVEY_TYPES } from '@/services/SurveyService'

type ModalView = 'intro' | 'email-verify' | ''
type EmailVerifyModalView = 'proxy' | 'email' | ''

const props = defineProps({
  closeModal: {
    type: Function,
    required: true,
  },
})

const store = useStore()
const $router = useRouter()
const v$ = useVuelidate()
const { surveyRewardAmount, initializeSurvey } = useSurvey({
  surveyType: SURVEY_TYPES.IMPACT_STUDY,
})
const {
  proxyEmail,
  email,
  sendCode,
  isSendingCodeDisabled,
  verificationCode,
  hasResentCode,
  resendCode,
  handleCodeConfirmation,
  isValidVerificationCode,
  updateVerificationType,
} = useVerification()

const totalSteps = 2
const { currentStep, nextStep, goToStep } = useStepper(totalSteps)

const modalView = ref<ModalView>('')
const emailVerifyModalView = ref<EmailVerifyModalView>('')
const error = ref('')
const onMountError = ref('')
const isSubmitting = ref(false)
const loadingMessage = ref('')

const user = computed(() => store.state.user.user)
const mobileMode = computed(() => store.getters['app/mobileMode'])
const isValidInput = computed(
  () => !v$.value.$error && !v$.value.$silentErrors?.length
)

const impactStudySurveyModalViewCount = computed(() => {
  const viewCount = parseInt(
    localStorage.getItem('impactStudySurveyModalViewCount') ?? ''
  )
  if (!isNaN(viewCount)) return viewCount
  else return 0
})

const isEmailNeeded = computed(() => {
  return (
    (user.value.isSchoolPartner && !user.value.proxyEmail) ||
    (!user.value.email && !user.value.verifiedEmail)
  )
})

function handleClose() {
  AnalyticsService.captureEvent(EVENTS.STUDENT_IMPACT_STUDY_SURVEY_MODAL_CLOSED)
  props.closeModal()
}

async function handleSendCode() {
  error.value = ''
  if (!isValidInput.value || isSubmitting.value) return

  isSubmitting.value = true
  loadingMessage.value = 'Sending a verification code. Please wait...'

  try {
    await sendCode()
    nextStep()
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    isSubmitting.value = false
    loadingMessage.value = ''
  }
}

async function handleVerificationSubmit() {
  error.value = ''
  if (isSubmitting.value) return
  if (!isValidVerificationCode.value) {
    error.value = 'Please enter a 6-digit verification code'
    return
  }

  isSubmitting.value = true
  loadingMessage.value = 'Checking the verification code. Please wait...'

  try {
    await handleCodeConfirmation()
    goToSurveyPage()
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    isSubmitting.value = false
    loadingMessage.value = ''
  }
}

function handleViewFromIntroView() {
  if (user.value.isSchoolPartner && !user.value.proxyEmail) {
    modalView.value = 'email-verify'
    emailVerifyModalView.value = 'proxy'
    updateVerificationType(VERIFICATION_TYPE.EMAIL_FOR_PROXY_EMAIL)
  } else if (!user.value.email && !user.value.verifiedEmail) {
    modalView.value = 'email-verify'
    emailVerifyModalView.value = 'email'
    updateVerificationType(VERIFICATION_TYPE.EMAIL_FOR_EMAIL)
  } else goToSurveyPage()
}

function goToSurveyPage() {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_VIEW_IMPACT_STUDY_SURVEY)
  $router.push('/surveys/impact-study')
}

function handleModalViewCount() {
  const updatedModalViewCount = impactStudySurveyModalViewCount.value + 1
  localStorage.setItem(
    'impactStudySurveyModalViewCount',
    String(updatedModalViewCount)
  )
  AnalyticsService.captureEvent(
    EVENTS.STUDENT_IMPACT_STUDY_SURVEY_MODAL_SHOWN,
    {
      $set: { impactStudySurveyModalViewCount: updatedModalViewCount },
    }
  )
  FeatureFlagService.setPersonPropertiesForFlags({
    impactStudySurveyModalViewCount: updatedModalViewCount,
  })
}

onMounted(async () => {
  try {
    await initializeSurvey()
    handleModalViewCount()
    modalView.value = 'intro'
  } catch (err) {
    onMountError.value = (err as Error).message
  }
})

watch(modalView, () => {
  goToStep(1)
})
</script>

<template>
  <modal :backText="''">
    <header
      class="cross-icon-container"
      @click="handleClose"
      data-testid="survey-container"
    >
      <cross-icon class="cross-icon" />
    </header>

    <p v-if="onMountError" class="impact-study-error">
      {{ onMountError }}
    </p>

    <loader
      v-if="isSubmitting"
      :message="loadingMessage"
      class="impact-study-modal__loader"
    />

    <section
      v-else-if="modalView === 'intro'"
      class="impact-study-verification"
    >
      <div v-if="currentStep === 1" class="impact-study-verification">
        <section>
          <updog-star-icon class="updog" />
          <h1 class="impact-study-modal__title">
            Take our 5 min survey and earn ${{ surveyRewardAmount }}
          </h1>

          <p class="impact-study-modal__subtitle">
            Help UPchieve learn how we can help students like you improve their
            grades. We'll send you a ${{ surveyRewardAmount }} visa gift card!
          </p>
        </section>

        <div v-if="!mobileMode" class="impact-study-modal__separator" />

        <footer>
          <div class="impact-study-buttons">
            <LargeButton
              class="impact-study-buttons--secondary-button"
              @click="handleClose"
            >
              No, thanks
            </LargeButton>
            <LargeButton
              class="impact-study-buttons--secondary-button impact-study-buttons--primary"
              @click="handleViewFromIntroView"
              primary
              :showArrow="false"
            >
              {{ isEmailNeeded ? 'Next' : 'Start survey' }}
            </LargeButton>
          </div>
          <RecaptchaCaption />
        </footer>
      </div>
    </section>

    <section
      v-else-if="modalView === 'email-verify'"
      class="impact-study-verification"
    >
      <div v-if="currentStep === 1" class="impact-study-verification">
        <header>
          <h1 class="impact-study-modal__title">
            Verify your personal email before earning ${{ surveyRewardAmount }}!
          </h1>
          <p class="impact-study-modal__subtitle">
            We'll send your $10 gift card to your personal email
          </p>
        </header>

        <section class="impact-study-modal__section">
          <FormEmail
            v-if="emailVerifyModalView === 'proxy'"
            v-model="proxyEmail"
            :is-required="true"
            label="Personal email"
          />
          <FormEmail
            v-else
            v-model="email"
            :is-required="true"
            label="Personal email"
          />
          <p v-if="error" class="impact-study-error">
            {{
              error ||
              'We were unable to send a verification code to you. Please try again.'
            }}
          </p>
        </section>

        <div v-if="!mobileMode" class="impact-study-modal__separator" />

        <footer>
          <div class="impact-study-buttons">
            <LargeButton
              class="impact-study-buttons--secondary-button"
              @click="handleClose"
            >
              No, thanks
            </LargeButton>
            <LargeButton
              class="impact-study-buttons--secondary-button impact-study-buttons--primary"
              @click="handleSendCode"
              :disabled="isSendingCodeDisabled"
              primary
              :showArrow="false"
            >
              Send code
            </LargeButton>
          </div>
          <RecaptchaCaption />
        </footer>
      </div>

      <div v-else-if="currentStep === 2" class="impact-study-verification">
        <header>
          <h1 class="impact-study-modal__title">
            Enter your verification code
            <span class="impact-study-verification__send-to">{{
              proxyEmail
            }}</span>
          </h1>
        </header>

        <section class="impact-study-modal__section">
          <div class="uc-form-element">
            <label for="verification-code"
              >You can find your 6-digit code in your email
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
            class="uc-form-subtext impact-study-verification__sub-text"
            v-if="!hasResentCode"
          >
            Did not receive a code?
            <span
              :disabled="isSubmitting ? true : null"
              @click="resendCode"
              class="uc-link"
            >
              Resend code
            </span>
          </div>

          <p v-if="error" class="impact-study-error">
            {{
              error || 'We were unable to verify your number. Please try again.'
            }}
          </p>
        </section>

        <div v-if="!mobileMode" class="impact-study-modal__separator" />

        <footer class="impact-study-buttons">
          <LargeButton
            v-if="error"
            class="impact-study-buttons--secondary-button"
            @click="handleClose"
          >
            Close
          </LargeButton>
          <LargeButton
            class="impact-study-buttons--primary impact-study-buttons--verify"
            @click="handleVerificationSubmit"
            :disabled="!isValidVerificationCode"
            :showArrow="false"
            primary
          >
            Start survey
          </LargeButton>
        </footer>
      </div>
    </section>
  </modal>
</template>

<style lang="scss" scoped>
.impact-study-modal {
  width: 100%;
  display: flex;
  flex-direction: column;
  text-align: left;

  &__title {
    font-weight: 500;
    @include font-category('display-small');
    margin: 0.5em 0;
    color: $c-soft-black;
  }

  &__subtitle {
    @include font-category('helper-text');
  }

  &__separator {
    border: 1px solid $c-border-grey;
    width: 100%;
    height: 1px;
    margin-top: 1em;
  }
}

.impact-study-buttons {
  width: 100%;
  @include flex-container(row, flex-end, center);
  margin: 1.5em 0;

  button {
    margin-right: 1em;

    &:last-child {
      margin-right: initial;
    }
  }

  &--secondary {
    @include flex-container(row, space-between, center);

    &-button {
      margin: 0 auto;
      width: 100%;
      margin-bottom: 1.3em;

      @include breakpoint-above('small') {
        width: 250px;
        margin-bottom: initial;
      }

      &--primary {
        background-color: $c-information-blue;

        &:hover {
          background: darken($c-information-blue, 5%);
        }
      }

      &--verify {
        margin-left: auto;
      }
    }
  }
}

.impact-study-verification {
  &__send-to {
    font-weight: bold;
  }
}

.impact-study-stepper {
  width: 200px;
  margin: 1em 0 1.5em 0;

  :deep(path) {
    fill: white;
  }
}

.cross-icon-container {
  @include flex-container(row, flex-end);
  cursor: pointer;
  align-self: flex-end;
}

.cross-icon {
  fill: $icon-grey;
  width: 15px;
  height: 15px;
}

.impact-study-question {
  &__title {
    margin-bottom: 5px;
    text-align: left;
    font-weight: 500;
    color: $c-soft-black;
    @include font-category('heading');
  }

  &__responses {
    text-align: left;
    margin-bottom: 1.5em;

    &-images {
      @include flex-container(row, center);
      flex-wrap: wrap;
      margin-top: 2em;
    }
  }

  &__response {
    margin: 0.75em 0;

    &-image {
      flex-basis: 30%;

      @include breakpoint-above('medium') {
        flex-basis: 20%;
      }
    }
  }
}

.impact-study-error {
  color: $c-error-red;
}

.updog {
  height: 100px;
  width: 100px;
}
</style>
