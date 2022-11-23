<template>
  <form
    v-if="step == 'step-1'"
    class="uc-form-body"
    aria-label="Volunteer signup"
    @submit.prevent="nextPage()"
  >
    <div
      v-if="errors.length"
      class="step-errors"
      role="alert"
      aria-labelledby="errorsHeading"
    >
      <h5 id="errorsHeading">Please correct the following problems:</h5>
      <ul>
        <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
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
        autocomplete="email"
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

    <button class="uc-form-button" type="submit">
      Continue
    </button>

    <div v-if="msg !== ''" role="alert">{{ msg }}</div>
  </form>

  <form
    v-else-if="step == 'step-2'"
    class="uc-form-body"
    aria-label="Volunteer information"
    @submit.prevent="checkInputs($event)"
  >
    <div
      v-if="errors.length"
      class="step-errors"
      role="alert"
      aria-labelledby="volunteerInformationErrorsHeading"
    >
      <h5 id="volunteerInformationErrorsHeading">
        Please correct the following problems:
      </h5>
      <ul>
        <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
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
        autocomplete="username"
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
        type="text"
        class="uc-form-input"
        v-bind:class="{
          'uc-form-input--invalid': invalidInputs.indexOf('firstName') > -1,
        }"
        v-model="profile.firstName"
        required
        autofocus
        autocomplete="given-name"
      />
    </div>

    <div class="uc-column">
      <label for="lastName" class="uc-form-label">Last Name</label>
      <input
        id="lastName"
        type="text"
        class="uc-form-input"
        v-bind:class="{
          'uc-form-input--invalid': invalidInputs.indexOf('lastName') > -1,
        }"
        v-model="profile.lastName"
        required
        autocomplete="family-name"
      />
    </div>

    <div class="uc-column">
      <label for="phoneNumber" class="uc-form-label">Cell Phone Number</label>
      <vue-phone-number-input
        id="phoneNumber"
        class="phone-input"
        v-model="profile.phone"
        :required="true"
        :error="invalidInputs.indexOf('phone') > -1 && !phoneInputInfo.isValid"
        color="#555"
        valid-color="#16ba97"
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
      <v-select
        id="signup-source"
        class="uc-form-select"
        v-model="signupSourceId"
        :options="signupSourcesOptions"
        label="name"
        :reduce="option => option.id"
        :searchable="false"
        :clearable="false"
        required
        :loading="isLoadingSignupSources"
      />
    </div>
    <div class="uc-column" v-if="shouldShowOtherSignupInput()">
      <input
        id="otherSignupSource"
        type="text"
        class="uc-form-input"
        v-model="otherSignupSource"
        v-bind:class="{
          'uc-form-input--invalid':
            invalidInputs.indexOf('otherSignupSource') > -1,
        }"
        autofocus
      />
      <p class="uc-form-subtext">
        Tell us where you heard about us!
      </p>
    </div>

    <div class="uc-form-checkbox">
      <input
        id="userAgreement"
        v-model="credentials.terms"
        type="checkbox"
        required
      />
      <label for="userAgreement">
        I have read and accept the
        <a href="/legal" target="_blank">user agreement</a> and
        <a href="/legal#volunteer" target="_blank">volunteer agreement</a>.
      </label>
    </div>

    <button class="uc-form-button" type="submit" :disabled="isRegistering">
      Sign Up
    </button>
    <loader class="register-loader" v-if="isRegistering" />
    <div v-if="msg" role="alert">{{ msg }}</div>
  </form>

  <div v-else class="uc-form-body">Unexpected Error</div>
</template>

<script>
import validator from 'validator'
import * as Sentry from '@sentry/browser'
import AuthService from '@/services/AuthService'
import VuePhoneNumberInput from 'vue-phone-number-input'
import Loader from '@/components/Loader'
import NetworkService from '@/services/NetworkService'
import { backOff } from 'exponential-backoff'

export default {
  components: {
    VuePhoneNumberInput,
    Loader,
  },
  data() {
    return {
      msg: '',
      errors: [],
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
  methods: {
    nextPage() {
      // validate input
      this.errors = []
      this.invalidInputs = []
      this.msg = ''
      if (!this.credentials.email) {
        this.errors.push('An email address is required.')
        this.invalidInputs.push('inputEmail')
      } else if (!validator.isEmail(this.credentials.email)) {
        // this is necessary because browsers ignore <input type="email"> until the
        // user actually tries to submit the form, which does not occur until step 2
        this.errors.push(
          this.credentials.email + ' is not a valid email address.'
        )
        this.invalidInputs.push('inputEmail')
      }
      if (!this.credentials.password) {
        this.errors.push('A password is required.')
        this.invalidInputs.push('inputPassword')
      }
      if (this.errors.length) {
        return
      }

      // check credentials
      AuthService.checkRegister(this, {
        email: this.credentials.email,
        password: this.credentials.password,
      })
        .then(() => {
          this.step = 'step-2'
          this.$router.push('/sign-up/volunteer/about')
          this.getSignupSources()
        })
        .catch(err => {
          this.msg = err.message
          if (err.status !== 409 && err.status !== 422) {
            Sentry.captureException(err)
          }
        })
    },
    checkInputs() {
      this.errors = []
      this.invalidInputs = []

      // validate input
      if (!this.profile.firstName || !this.profile.lastName) {
        this.errors.push('You must enter your first and last name.')
      }
      if (!this.profile.firstName) {
        this.invalidInputs.push('firstName')
      }
      if (!this.profile.lastName) {
        this.invalidInputs.push('lastName')
      }
      if (!this.profile.phone) {
        this.errors.push('You must enter a phone number.')
        this.invalidInputs.push('phone')
      } else if (!this.phoneInputInfo.isValid || !this.phoneInputInfo.e164) {
        this.errors.push(this.profile.phone + ' is not a valid phone number.')
        this.invalidInputs.push('phone')
      }
      if (!this.credentials.terms) {
        this.errors.push('You must read and accept the user agreement.')
      }
      if (this.shouldShowOtherSignupInput() && !this.otherSignupSource) {
        this.errors.push(
          'Please enter signup source in the text box if "Other" is selected'
        )
        this.invalidInputs.push('otherSignupSource')
      }
      if (!this.errors.length) {
        this.submit()
      }
    },
    submit() {
      this.msg = ''
      if (this.isRegistering) return
      this.isRegistering = true
      AuthService.registerOpenVolunteer(this, {
        email: this.credentials.email,
        password: this.credentials.password,
        terms: this.credentials.terms,
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        phone: this.phoneInputInfo.e164,
        signupSourceId: this.signupSourceId,
        otherSignupSource: this.otherSignupSource,
      })
        .then(() => {
          this.isRegistering = false
          this.$router.push('/verify')
        })
        .catch(err => {
          this.isRegistering = false
          this.msg = err.message
          if (err.status !== 409 && err.status !== 422) {
            Sentry.captureException(err)
          }
        })
    },
    onPhoneInputUpdate(phoneInputInfo) {
      this.phoneInputInfo = phoneInputInfo
    },
    shouldShowOtherSignupInput() {
      if (this.isLoadingSignupSources || !this.signupSourcesOptions) {
        return false
      }
      const otherOption = this.signupSourcesOptions.find(
        s => s.name === 'Other'
      )
      return otherOption && otherOption.id === this.signupSourceId
    },
    async getSignupSources() {
      this.isLoadingSignupSources = true
      try {
        const data = await backOff(() =>
          NetworkService.getStudentSignupSources()
        )
        let allSources = data.body.signupSources

        // volunteer sources drop School/Teacher and replace Friend/Classmate with Friend
        allSources = allSources.filter(
          source => source.name !== 'School / Teacher'
        )
        allSources.find(source => source.name === 'Friend / Classmate').name =
          'Friend'
        this.signupSourcesOptions = allSources
      } catch (err) {
        Sentry.captureException(err)
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
</style>
