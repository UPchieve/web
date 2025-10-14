<script lang="ts" setup>
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import { backOff } from 'exponential-backoff'
import { computed, onBeforeMount, ref } from 'vue'
import { useStore } from 'vuex'
import MazPhoneNumberInput, {
  type Results,
} from 'maz-ui/components/MazPhoneNumberInput'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import { useRouter } from 'vue-router'
import UserService from '@/services/UserService'
import Loader from '@/components/Loader.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const store = useStore()
const router = useRouter()
store.dispatch('app/hideNavigation')

const validationErrors = ref<string[]>([])
const invalidInputs = ref<string[]>([])
const phoneInputInfo = ref()
const signupSourceId = ref()
const isLoadingSignupSources = ref(false)
const isRegistering = ref(false)
const signupSourcesOptions = ref<{ name: string; id: number }[]>([])
const otherSignupSource = ref()
const submitError = ref('')

if (localStorage.getItem('isSSOSignUpRedirect')) {
  AnalyticsService.captureEvent(EVENTS.ACCOUNT_CREATED)
  AnalyticsService.captureEvent(EVENTS.ACCOUNT_VERIFIED)
  localStorage.removeItem('isSSOSignUpRedirect')
  store.dispatch('user/firstDashboardVisit', true)
}

onBeforeMount(() => {
  getSignupSources()
})

function onPhoneInputUpdate(pii: Results) {
  phoneInputInfo.value = pii
}
async function getSignupSources() {
  isLoadingSignupSources.value = true
  try {
    const response = await backOff(() =>
      NetworkService.getStudentSignupSources()
    )
    let allSources = response.data.signupSources as Array<{
      id: number
      name: string
    }>

    // volunteer sources drop School/Teacher and replace Friend/Classmate with Friend
    allSources = allSources
      .filter((source) => source.name !== 'School / Teacher')
      .map((source) => {
        if (source.name === 'Friend / Classmate') {
          source.name = 'Friend'
        }
        return source
      })
    signupSourcesOptions.value = allSources
  } catch (err) {
    LoggerService.noticeError(err)
  } finally {
    isLoadingSignupSources.value = false
  }
}

const shouldShowOtherSignupInput = computed(() => {
  if (isLoadingSignupSources.value || !signupSourcesOptions.value) {
    return false
  }
  const otherOption = signupSourcesOptions.value.find((s) => s.name === 'Other')
  return otherOption && otherOption.id === signupSourceId.value
})

function validate() {
  if (!phoneInputInfo.value) {
    validationErrors.value.push('You must enter a phone number.')
    invalidInputs.value.push('phone')
  } else if (!phoneInputInfo.value.isValid || !phoneInputInfo.value.e164) {
    const message =
      phoneInputInfo.value.phoneNumber === undefined
        ? 'You must enter a phone number.'
        : phoneInputInfo.value.phoneNumber + ' is not a valid phone number.'
    validationErrors.value.push(message)
    invalidInputs.value.push('phone')
  }

  if (
    shouldShowOtherSignupInput.value &&
    (!otherSignupSource.value || otherSignupSource.value.trim().length === 0)
  ) {
    validationErrors.value.push(
      'Please enter signup source in the text box if "Other" is selected'
    )
    invalidInputs.value.push('otherSignupSource')
  }
  if (!signupSourceId.value) {
    validationErrors.value.push(
      "Please select an option for 'How did you hear about us?'"
    )
  }
}

async function submit() {
  invalidInputs.value = []
  validationErrors.value = []
  validate()
  if (validationErrors.value.length) {
    return
  }
  isRegistering.value = true

  const payload = {
    phone: phoneInputInfo.value.e164,
    signupSourceId: signupSourceId.value,
    otherSignupSource: otherSignupSource.value,
  }
  try {
    await UserService.completeGoogleSsoVolunteerSignup(payload)
    await store.dispatch('user/fetchUser')
    window.localStorage.removeItem('upcReferredByCode')
    router.replace('/verify')
  } catch (err: any) {
    submitError.value = err?.response?.data?.err ?? 'Failed: Please try again.'
    if (err?.response.status !== 409 && err?.response.status !== 422) {
      LoggerService.noticeError(err)
    }
  } finally {
    isRegistering.value = false
  }
}
</script>

<template>
  <FormPageTemplate :formCardMaxWidth="'660px'">
    <form
      class="uc-form-body"
      aria-label="Volunteer signup"
      @submit.prevent="submit()"
    >
      <div
        v-if="validationErrors.length"
        class="step-errors"
        role="alert"
        aria-labelledby="volunteerInformationErrorsHeading"
      >
        <h5 id="volunteerInformationErrorsHeading">
          Please correct the following problems:
        </h5>
        <ul>
          <li v-for="error in validationErrors" v-bind:key="error">
            {{ error }}
          </li>
        </ul>
      </div>

      <div class="step-title">Step 2 of 2: Tell us about yourself!</div>

      <div class="uc-column">
        <label for="phoneNumber" class="uc-form-label">Cell Phone Number</label>
        <maz-phone-number-input
          id="phoneNumber"
          data-testid="phoneNumberField"
          class="phone-input"
          required="true"
          show-code-on-list
          @update="onPhoneInputUpdate"
        />
        <p class="uc-form-subtext">
          UPchieve notifies volunteers of incoming student requests via text.
          You can customize when you receive requests.
        </p>
      </div>

      <div class="uc-column">
        <label for="signup-source" class="uc-form-label"
          >How did you hear about us?</label
        >
        <FormSelect
          data-testid="signupSourceField"
          name="signup-source"
          v-model="signupSourceId"
          :options="signupSourcesOptions"
          option-text-field="name"
          :is-required="true"
          :reduce="(option: { id: string; name: string }) => option.id"
        />
      </div>
      <div class="uc-column" v-if="shouldShowOtherSignupInput">
        <input
          id="otherSignupSource"
          data-testid="otherSignupSource"
          :required="false"
          type="text"
          class="uc-form-input"
          v-model="otherSignupSource"
          v-bind:class="{
            'uc-form-input--invalid':
              invalidInputs.indexOf('otherSignupSource') > -1,
          }"
          autofocus
        />
        <p class="uc-form-subtext">Tell us where you heard about us!</p>
      </div>

      <button
        class="uc-form-button"
        type="submit"
        :disabled="isRegistering"
        data-testid="signup-button"
      >
        Sign Up
      </button>
      <loader class="register-loader" v-if="isRegistering" />
      <div v-if="submitError" role="alert">{{ submitError }}</div>
    </form>
  </FormPageTemplate>
</template>
<style lang="scss" scoped>
.uc-form-body {
  @include child-spacing(top, 25px);
  position: relative;
}

.phone-input {
  margin: 10px 0 2px;
  width: 100%;
  :deep(.m-input-wrapper) {
    width: 100%;
  }
}

.step-title {
  font-weight: bold;
  text-align: left;
}

.step-errors {
  color: #bf0000;
  font-size: 14px;
  text-align: left;
}

.register-loader {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
}
</style>
