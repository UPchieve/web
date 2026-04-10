<template>
  <form
    v-if="step == 'step-1'"
    autocomplete="off"
    class="uc-form-body"
    aria-label="Volunteer signup"
    @submit.prevent="nextPage()"
  >
    <div
      v-if="validationErrors.length"
      class="step-errors"
      role="alert"
      aria-labelledby="errorsHeading"
    >
      <h5 id="errorsHeading">Please correct the following problems:</h5>
      <ul>
        <li v-for="error in validationErrors" v-bind:key="error">
          {{ error }}
        </li>
      </ul>
    </div>

    <div class="step-title">Step 1 of 2: Choose your log-in details</div>

    <div class="uc-column">
      <label for="inputEmail" class="uc-form-label">What's your email?</label>
      <input
        id="inputEmail"
        type="email"
        class="uc-form-input"
        v-bind:class="{
          'uc-form-input--invalid': invalidInputs.indexOf('inputEmail') > -1,
        }"
        v-model="credentials.email"
        required
        autofocus
        autocomplete="off"
      />
      <p class="uc-form-subtext">
        We will only use your email to contact you about your account. See our
        Privacy Policy for more info.
      </p>
    </div>

    <div class="uc-column">
      <label for="inputPassword" class="uc-form-label">
        Create a password.
      </label>
      <input
        id="inputPassword"
        type="password"
        class="uc-form-input"
        v-bind:class="{
          'uc-form-input--invalid': invalidInputs.indexOf('inputPassword') > -1,
        }"
        v-model="credentials.password"
        required
        autocomplete="new-password"
      />
      <p class="uc-form-subtext">
        Keep your account safe by choosing a password with one number, one
        uppercase letter, and one lowercase letter.
      </p>
    </div>

    <button class="uc-form-button" type="submit">Continue</button>

    <div v-if="submitError !== ''" role="alert" class="submission-error">
      {{ submitError }}
    </div>

    <div v-if="isGoogleSignupForVolunteersEnabled">
      <LineDivider text="Sign Up with" />
      <div class="sso-container">
        <SsoButton
          @click="signUpWithGoogle"
          class="sso-button"
          data-testid="googleSsoButton"
          :buttonText="'Google'"
          :ssoMethod="SsoProvider.GOOGLE"
        />
        <p class="terms-text">
          By clicking the button above, you agree to our
          <a href="https://upchieve.org/legal" target="_blank" class="uc-link"
            >User Agreement</a
          >.
        </p>
      </div>
    </div>
  </form>

  <form
    v-else-if="step == 'step-2'"
    autocomplete="off"
    class="uc-form-body"
    aria-label="Volunteer information"
    @submit.prevent="checkInputs($event)"
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
      <!-- Fix for bug in Chrome where the first two fields are parsed as a username and password
       even if the HTML5 autocomplete attributes are set to the right values -->
      <label for="username" class="d-none">Username</label>
      <input
        type="text"
        class="d-none"
        id="username"
        v-model="credentials.email"
        autocomplete="off"
      />
      <label for="password" class="d-none">Password</label>
      <input
        type="password"
        class="d-none"
        id="password"
        v-model="credentials.password"
        autocomplete="new-password"
      />

      <label for="firstName" class="uc-form-label">First Name</label>
      <input
        id="firstName"
        data-testId="firstNameField"
        type="text"
        class="uc-form-input"
        v-bind:class="{
          'uc-form-input--invalid': invalidInputs.indexOf('firstName') > -1,
        }"
        v-model="profile.firstName"
        required
        autofocus
        autocomplete="off"
      />
    </div>

    <div class="uc-column">
      <label for="lastName" class="uc-form-label">Last Name</label>
      <input
        id="lastName"
        data-testid="lastNameField"
        type="text"
        class="uc-form-input"
        v-bind:class="{
          'uc-form-input--invalid': invalidInputs.indexOf('lastName') > -1,
        }"
        v-model="profile.lastName"
        required
        autocomplete="off"
      />
    </div>

    <div class="uc-column">
      <label for="phoneNumber" class="uc-form-label">Cell Phone Number</label>
      <maz-phone-number-input
        id="phoneNumber"
        data-testid="phoneNumberField"
        class="phone-input"
        required="true"
        v-model="profile.phone"
        show-code-on-list
        @update="onPhoneInputUpdate"
      />
      <p class="uc-form-subtext">
        UPchieve notifies volunteers of incoming student requests via text. You
        can customize when you receive requests.
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
        :reduce="(option) => option.id"
      />
    </div>
    <div class="uc-column" v-if="shouldShowOtherSignupInput()">
      <input
        id="otherSignupSource"
        data-testid="otherSignupSource"
        autocomplete="off"
        :required="true"
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

    <div class="uc-form-checkbox">
      <input
        id="userAgreement"
        data-testid="userAgreementCheckbox"
        v-model="credentials.terms"
        type="checkbox"
        required
      />
      <label for="userAgreement">
        I have read and accept the
        <a href="https://upchieve.org/legal" target="_blank">user agreement</a>
        and
        <a href="https://upchieve.org/legal#volunteer-agreement" target="_blank"
          >volunteer agreement</a
        >.
      </label>
    </div>

    <button
      class="uc-form-button"
      type="submit"
      :disabled="isRegistering ? true : null"
      data-testid="signup-button"
    >
      Sign Up
    </button>
    <loader class="register-loader" v-if="isRegistering" />
    <div v-if="submitError" role="alert">{{ submitError }}</div>
  </form>

  <div v-else class="uc-form-body">Unexpected Error</div>
</template>

<script>
import isEmail from 'validator/lib/isEmail'
import LoggerService from '@/services/LoggerService'
import AuthService from '@/services/AuthService'
import MazPhoneNumberInput from 'maz-ui/components/MazPhoneNumberInput'
import Loader from '@/components/Loader.vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import NetworkService from '@/services/NetworkService'
import { backOff } from 'exponential-backoff'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import config from '../../config'
import { mapGetters } from 'vuex'
import LineDivider from '@/components/LineDivider.vue'
import SsoButton from '@/components/SsoButton.vue'
import { SsoProvider } from '@/services/SsoService'

export default {
  components: {
    MazPhoneNumberInput,
    Loader,
    FormSelect,
    LineDivider,
    SsoButton,
  },
  setup() {
    return { SsoProvider }
  },
  data() {
    return {
      submitError: '',
      validationErrors: [],
      invalidInputs: [],
      credentials: {
        email: '',
        password: '',
        terms: false,
      },
      profile: {
        firstName: '',
        lastName: '',
        phone: '',
      },
      step: 'step-1',
      phoneInputInfo: {},
      isRegistering: false,
      signupSourcesOptions: [],
      signupSourceId: null,
      otherSignupSource: '',
      isLoadingSignupSources: false,
    }
  },
  mounted() {
    this.$router.push('/sign-up/volunteer/account')
  },
  computed: {
    ...mapGetters({
      isGoogleSignupForVolunteersEnabled:
        'featureFlags/isGoogleSignupForVolunteersEnabled',
    }),
  },
  methods: {
    nextPage() {
      // validate input
      this.validationErrors = []
      this.invalidInputs = []
      this.submitError = ''
      if (!this.credentials.email) {
        this.validationErrors.push('An email address is required.')
        this.invalidInputs.push('inputEmail')
      } else if (!isEmail(this.credentials.email)) {
        // this is necessary because browsers ignore <input type="email"> until the
        // user actually tries to submit the form, which does not occur until step 2
        this.validationErrors.push(
          this.credentials.email + ' is not a valid email address.'
        )
        this.invalidInputs.push('inputEmail')
      }
      if (!this.credentials.password) {
        this.validationErrors.push('A password is required.')
        this.invalidInputs.push('inputPassword')
      }
      if (this.validationErrors.length) {
        return
      }

      // check credentials
      AuthService.checkRegister({
        email: this.credentials.email,
        password: this.credentials.password,
      })
        .then(() => {
          this.step = 'step-2'
          this.$router.push('/sign-up/volunteer/about')
          this.getSignupSources()
        })
        .catch((err) => {
          this.submitError =
            err?.response?.data?.err ?? 'Failed: Please try again.'
          if (err?.response?.status !== 409 && err?.response?.status !== 422) {
            LoggerService.noticeError(err)
          }
        })
    },
    checkInputs() {
      this.validationErrors = []
      this.invalidInputs = []

      // validate input
      if (!this.profile.firstName || !this.profile.lastName) {
        this.validationErrors.push('You must enter your first and last name.')
      }
      if (!this.profile.firstName) {
        this.invalidInputs.push('firstName')
      }
      if (!this.profile.lastName) {
        this.invalidInputs.push('lastName')
      }
      if (!this.profile.phone) {
        this.validationErrors.push('You must enter a phone number.')
        this.invalidInputs.push('phone')
      } else if (!this.phoneInputInfo.isValid || !this.phoneInputInfo.e164) {
        this.validationErrors.push(
          this.profile.phone + ' is not a valid phone number.'
        )
        this.invalidInputs.push('phone')
      }
      if (!this.credentials.terms) {
        this.validationErrors.push(
          'You must read and accept the user agreement.'
        )
      }
      if (this.shouldShowOtherSignupInput() && !this.otherSignupSource) {
        this.validationErrors.push(
          'Please enter signup source in the text box if "Other" is selected'
        )
        this.invalidInputs.push('otherSignupSource')
      }
      if (!this.signupSourceId) {
        this.validationErrors.push(
          "Please select an option for 'How did you hear about us?'"
        )
      }
      if (!this.validationErrors.length) {
        this.submit()
      }
    },
    submit() {
      this.submitError = ''
      if (this.isRegistering) return
      const joinedTeamCode = localStorage.getItem('joinedTeamCode')
      if (joinedTeamCode) {
        this.joinedTeamCode = joinedTeamCode
      }
      this.isRegistering = true
      AuthService.registerOpenVolunteer({
        email: this.credentials.email,
        password: this.credentials.password,
        terms: this.credentials.terms,
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        phone: this.phoneInputInfo.e164,
        signupSourceId: this.signupSourceId,
        otherSignupSource: this.otherSignupSource,
        referredByCode: window.localStorage.getItem('upcReferredByCode'),
        inviteCode: joinedTeamCode,
      })
        .then(() => {
          this.isRegistering = false
          window.localStorage.removeItem('upcReferredByCode')
          localStorage.removeItem('joinedTeamCode')
          this.$router.push('/verify')
        })
        .catch((err) => {
          this.isRegistering = false
          this.submitError =
            err?.response?.data?.err ?? 'Failed: Please try again.'
          if (err?.response.status !== 409 && err?.response.status !== 422) {
            LoggerService.noticeError(err)
          }
        })
    },
    signUpWithGoogle() {
      AnalyticsService.captureEvent(EVENTS.USER_CLICKED_SIGN_UP_WITH_GOOGLE, {
        isVolunteer: true,
      })
      localStorage.setItem('isSSOSignUpRedirect', true)
      const joinedTeamCode = localStorage.getItem('joinedTeamCode')
      const data = {
        errorRedirect: '/sign-up/volunteer/account',
        isLogin: false,
        provider: 'google',
        referredByCode: window.localStorage.getItem('upcReferredByCode'),
        accountType: 'volunteer',
        inviteCode: joinedTeamCode,
      }

      if (this.partnerKey) {
        data.volunteerPartnerOrgKey = this.partnerKey
      }

      // Allow for the provider to populate the email
      const params = new URLSearchParams(data).toString()
      const url = `${config.serverRoot}/auth/sso?${params}`
      window.location.replace(url)
    },
    onPhoneInputUpdate(phoneInputInfo) {
      this.phoneInputInfo = phoneInputInfo
    },
    shouldShowOtherSignupInput() {
      if (this.isLoadingSignupSources || !this.signupSourcesOptions) {
        return false
      }
      const otherOption = this.signupSourcesOptions.find(
        (s) => s.name === 'Other'
      )
      return otherOption && otherOption.id === this.signupSourceId
    },
    async getSignupSources() {
      this.isLoadingSignupSources = true
      try {
        const response = await backOff(() =>
          NetworkService.getStudentSignupSources()
        )
        let allSources = response.data.signupSources

        // volunteer sources drop School/Teacher and replace Friend/Classmate with Friend
        allSources = allSources.filter(
          (source) => source.name !== 'School / Teacher'
        )
        allSources.find((source) => source.name === 'Friend / Classmate').name =
          'Friend'
        this.signupSourcesOptions = allSources
      } catch (err) {
        LoggerService.noticeError(err)
      } finally {
        this.isLoadingSignupSources = false
      }
    },
  },
}
</script>

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

.d-none {
  display: none !important;
}

.register-loader {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
}

.submission-error {
  color: $c-error-red;
}
.sso-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  :deep(.sso-button) {
    min-width: 200px;
  }
}
</style>
