<script lang="ts" setup>
import FormEmail from '@/components/FormEmail.vue'
import Modal from '@/components/Modal.vue'
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref } from 'vue'
import CrossIcon from '@/assets/cross.svg'
import NetworkService from '@/services/NetworkService'
import RecaptchaCaption from '@/components/recaptcha/RecaptchaCaption.vue'
import { useStore } from 'vuex'
import { EVENTS, VERIFICATION_METHOD, VERIFICATION_TYPE } from '@/consts'
import Spinner from '@/components/Spinner.vue'
import FormInput from '@/components/FormInput.vue'
import isEmail from 'validator/lib/isEmail'
import AnalyticsService from '@/services/AnalyticsService'

const props = defineProps<{
  showPermanentDismissOption: false
}>()

const store = useStore()
const secondaryEmail = ref<string>('')
const verificationCode = ref<string>('')
const isLoading = ref<boolean>(false)
const emit = defineEmits<{
  (e: 'dismissed', complete: { isComplete: boolean; email?: string }): void
  (e: 'completed', secondaryEmail: string): void
  (e: 'permanentlyDismissed'): void
}>()
type FormStep = 'enter_email' | 'enter_code' | 'complete'
const formStep = ref<FormStep>('enter_email')
const errorMessage = ref<string>('')

const handleError = (error: any) => {
  if (typeof error === 'string') {
    errorMessage.value = error
    return
  }

  const err = error.response.data.err
  if (err) {
    errorMessage.value = err
  } else {
    errorMessage.value = `Something went wrong sending a verification code to ${secondaryEmail.value}. Please try again. If the problem persists, please reach out to support@upchieve.org for help!`
  }
}

onBeforeUnmount(() => {
  if (formStep.value === 'complete') emit('completed', secondaryEmail.value)
})

const sendVerificationCode = async (event: Event) => {
  errorMessage.value = ''
  event.preventDefault()
  verificationCode.value = ''
  try {
    isLoading.value = true
    await NetworkService.sendVerification({
      userId: store.state.user.user.id,
      firstName: store.getters['user/firstName'],
      sendTo: secondaryEmail.value,
      verificationMethod: VERIFICATION_METHOD.EMAIL,
      verificationType: VERIFICATION_TYPE.EMAIL_FOR_PROXY_EMAIL,
    })
    formStep.value = 'enter_code'
  } catch (error) {
    handleError(error)
  } finally {
    isLoading.value = false
  }
}

const onClickSendVerificationCode = (event: Event) => {
  AnalyticsService.captureEvent(EVENTS.SECONDARY_EMAIL_CLICKED_RESEND_CODE)
  sendVerificationCode(event)
}

const confirmVerificationCode = async (event: Event) => {
  errorMessage.value = ''
  event.preventDefault()
  try {
    isLoading.value = true
    const response = await NetworkService.confirmVerification({
      userId: store.state.user.user.id,
      sendTo: secondaryEmail.value,
      verificationMethod: VERIFICATION_METHOD.EMAIL,
      verificationType: VERIFICATION_TYPE.EMAIL_FOR_PROXY_EMAIL,
      forSignup: false,
      verificationCode: verificationCode.value,
    })
    if (response.data.success) {
      formStep.value = 'complete'
      AnalyticsService.captureEvent(EVENTS.SECONDARY_EMAIL_VERIFIED)
    } else {
      handleError(
        'Invalid verification code. Please double check the code, or request a new code.'
      )
    }
  } catch (err) {
    handleError(err)
  } finally {
    isLoading.value = false
  }
}

const headingText = computed(() => {
  if (formStep.value === 'complete') {
    return 'Your email address has been verified!'
  }
  return 'Add a secondary email'
})

const isValidEmail = computed(() => {
  return isEmail(secondaryEmail.value)
})

const isValidVerificationCode = computed(() => {
  return verificationCode.value.length === 6
})

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.SECONDARY_EMAIL_OPENED_MODAL)
})
onUnmounted(() => {
  AnalyticsService.captureEvent(EVENTS.SECONDARY_EMAIL_CLOSED_MODAL)
})

const message = computed((): { main: string; sub?: string } => {
  const firstName = store.getters['user/firstName']
  return {
    main: `📣 Hey ${firstName}! Add your personal email now so that you can stay in the loop about internships, volunteer opportunities, and the UPchieve community.`,
    sub: store.state.user.user.email.endsWith('.edu')
      ? 'Please be sure to add a secondary email ASAP if you are using a school email!'
      : undefined,
  }
})

const onPermanentlyDismissed = () => {
  AnalyticsService.captureEvent(
    EVENTS.SECONDARY_EMAIL_PERMANENTLY_DISMISSED_MODAL
  )
  emit('permanentlyDismissed')
  emit('dismissed', { isComplete: false })
}
</script>

<template>
  <Modal>
    <div class="header">
      <div class="uc-form-header header-text">{{ headingText }}</div>
      <CrossIcon
        class="dismiss-button"
        @click="
          emit('dismissed', {
            isComplete: formStep === 'complete',
            email: secondaryEmail,
          })
        "
      />
    </div>
    <div class="content flex-col">
      <div v-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>
      <div class="message" v-if="formStep === 'enter_email'">
        <span>{{ message.main }}</span>
        <span class="sub-message" v-if="message?.sub">{{ message?.sub }}</span>
      </div>

      <form
        v-if="formStep === 'enter_email'"
        autocomplete="off"
        @submit="sendVerificationCode"
      >
        <Spinner v-if="isLoading" />
        <FormEmail
          v-else
          :is-required="true"
          :is-autofocused="true"
          label="Secondary email"
          name="secondaryEmail"
          v-model="secondaryEmail"
          :disabled="isLoading"
          @change="
            () =>
              AnalyticsService.captureEvent(
                EVENTS.SECONDARY_EMAIL_ENTERED_EMAIL
              )
          "
        />
        <button
          class="uc-form-button form-button"
          type="submit"
          :disabled="!secondaryEmail || isLoading || !isValidEmail"
          @click="
            () =>
              AnalyticsService.captureEvent(
                EVENTS.SECONDARY_EMAIL_CLICKED_SEND_CODE
              )
          "
        >
          Send verification code
        </button>
      </form>
      <form
        v-else-if="formStep === 'enter_code'"
        autocomplete="off"
        @submit="confirmVerificationCode"
      >
        We have sent a verification code to
        <strong
          ><span id="ph-no-capture">{{ secondaryEmail }}</span></strong
        >.<br />
        Please enter the code below:
        <FormInput
          :is-autofocused="true"
          :isRequired="true"
          label="Verification code"
          :minLength="6"
          :maxLength="6"
          placeholder="123456"
          v-model="verificationCode"
          @change="
            () =>
              AnalyticsService.captureEvent(EVENTS.SECONDARY_EMAIL_ENTERED_CODE)
          "
        />
        <div class="buttons-container" v-if="!isLoading">
          <button
            type="button"
            class="uc-form-button-secondary w-full form-button"
            @click="onClickSendVerificationCode"
            :disabled="isLoading"
          >
            Resend code
          </button>
          <button
            class="uc-form-button form-button"
            type="submit"
            :disabled="!isValidVerificationCode"
            @click="
              () =>
                AnalyticsService.captureEvent(
                  EVENTS.SECONDARY_EMAIL_CLICKED_CONFIRM_CODE
                )
            "
          >
            Confirm code
          </button>
        </div>
        <Spinner v-else />
      </form>
      <button
        type="button"
        v-else
        class="uc-form-button"
        @click="
          emit('dismissed', {
            isComplete: formStep === 'complete',
            email: secondaryEmail,
          })
        "
      >
        Close
      </button>
    </div>
    <RecaptchaCaption v-if="formStep !== 'complete'" />
    <button
      type="button"
      class="permanent-dismiss-button"
      v-if="props.showPermanentDismissOption && formStep !== 'complete'"
      @click="onPermanentlyDismissed"
    >
      Don't show this again
    </button>
  </Modal>
</template>

<style lang="scss" scoped>
.header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.header-text {
  flex: 1;
}

.dismiss-button {
  width: 20px;
  height: 20px;
  fill: $c-soft-black;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 24px;

  .form-button {
    padding-top: 0px;
    margin-top: 0px;
  }
}

.message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  .sub-message {
    font-weight: $font-weight-medium;
  }
}

.permanent-dismiss-button {
  color: $c-information-blue;
}
</style>
