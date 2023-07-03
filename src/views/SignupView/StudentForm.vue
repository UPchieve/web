<template>
  <div v-if="step === 'eligibility' || step === 'referred'">
    <FormErrors :errors="errors" />

    <h1 class="uc-form-header">
      {{
        isReferred
          ? "Let's get started!"
          : 'Check if you are eligible for UPchieve'
      }}
    </h1>
    <p class="uc-form-text">
      Already have an account?
      <router-link class="uc-link" to="/login">Log In</router-link>
    </p>

    <form
      id="form-eligibility"
      class="uc-column"
      @submit.prevent="
        isReferred ? submitReferralEligibilityForm() : submitEligibilityForm()
      "
    >
      <div class="uc-form-element">
        <div class="uc-row justify-between">
          <label
            for="grade"
            v-bind:class="{
              error: hasFormValidationError(v$.eligibility.currentGrade),
            }"
            >Grade</label
          >
          <div
            v-if="hasFormValidationError(v$.eligibility.currentGrade)"
            class="error-caption"
          >
            {{ getFormValidationError(v$.eligibility.currentGrade) }}
          </div>
        </div>
        <v-select
          id="grade"
          class="uc-form-select-input"
          v-model="eligibility.currentGrade"
          placeholder="Select your grade"
          aria-label="Select your grade"
          :options="gradeLevels"
          :searchable="false"
          :clearable="false"
          v-bind:class="{
            'uc-form-select-input-invalid': hasFormValidationError(
              v$.eligibility.currentGrade
            ),
          }"
          @close="onGradeClose"
          required
        ></v-select>
      </div>

      <div class="uc-form-element">
        <div class="uc-row justify-between">
          <label
            for="school"
            v-bind:class="{
              error: hasFormValidationError(v$.eligibility.highSchool),
            }"
            >School</label
          >
          <div
            v-if="hasFormValidationError(v$.eligibility.highSchool)"
            class="error-caption"
          >
            {{ getFormValidationError(v$.eligibility.highSchool) }}
          </div>
        </div>
        <autocomplete
          id="school"
          base-class="uc-form-autocomplete-input"
          placeholder="Search for your school"
          aria-label="Search for your school"
          :search="autocompleteSchool"
          :get-result-value="getSchoolDisplayName"
          @submit="handleSelectHighSchool"
          @blur="v$.eligibility.highSchool.$touch"
          v-bind:class="{
            'uc-form-autocomplete-input-invalid': hasFormValidationError(
              v$.eligibility.highSchool
            ),
          }"
          required
        >
          <template #result="{ result, props }">
            <li v-bind="props">
              <div v-if="result.name" class="result">
                {{ result.name }} ({{ result.city }}, {{ result.state }})
              </div>
              <a
                v-if="result.cantFindSchool"
                target="_blank"
                href="https://upchieve.org/cant-find-school"
              >
                <div class="result">
                  {{ CANNOT_FIND_SCHOOL_TEXT }}
                </div>
              </a>
            </li>
          </template>
        </autocomplete>
      </div>

      <div class="uc-form-element">
        <div class="uc-row justify-between">
          <label
            for="zipCode"
            v-bind:class="{
              error: hasFormValidationError(v$.eligibility.zipCode),
            }"
            >Zip Code</label
          >
          <div
            v-if="hasFormValidationError(v$.eligibility.zipCode)"
            class="error-caption"
          >
            {{ getFormValidationError(v$.eligibility.zipCode) }}
          </div>
        </div>
        <input
          id="zipCode"
          class="uc-form-text-input"
          type="text"
          placeholder="Enter your zip code"
          v-model="eligibility.zipCode"
          v-bind:class="{
            'uc-form-text-input-invalid': hasFormValidationError(
              v$.eligibility.zipCode
            ),
          }"
          @blur="v$.eligibility.zipCode.$touch"
          required
        />
      </div>

      <div class="uc-form-element">
        <div class="uc-row justify-between">
          <label
            for="email"
            v-bind:class="{
              error: hasFormValidationError(v$.eligibility.email),
            }"
            >Email</label
          >
          <div
            v-if="hasFormValidationError(v$.eligibility.email)"
            class="error-caption"
          >
            {{ getFormValidationError(v$.eligibility.email) }}
          </div>
        </div>
        <input
          id="email"
          class="uc-form-text-input"
          type="email"
          placeholder="Enter your email address"
          v-model="eligibility.email"
          v-bind:class="{
            'uc-form-text-input-invalid': hasFormValidationError(
              v$.eligibility.email
            ),
          }"
          @blur="v$.eligibility.email.$touch"
          required
        />
        <div class="metadata">
          We will only use this email to notify you if your eligibility status
          changes in the future.
        </div>
      </div>

      <button
        id="btn-eligibility-submit"
        class="uc-form-button"
        :disabled="cannotSubmitForm(v$.eligibility)"
        type="submit"
      >
        {{ isReferred ? 'Continue' : 'Check my eligibility' }}
      </button>
    </form>
  </div>

  <div
    v-else-if="step === 'eligible'"
    class="uc-column justify-center items-center h-full"
  >
    <verification-badge />
    <h1 class="uc-form-header center">Woohoo, you're eligible!</h1>
    <p class="uc-form-text center">
      Finish setting up your free account
    </p>
    <button class="uc-form-button" @click="accountPage">
      Continue
    </button>
  </div>

  <div
    v-else-if="step === 'ineligible'"
    class="uc-column justify-center items-center h-full"
  >
    <error-badge />
    <h1 class="uc-form-header center">{{ title }}</h1>

    <p v-if="isCollegeStudent" class="small-paragraph">
      We don't have the capacity to help college students right now, but did you
      know that many UPchieve students dream of going to college just like you?
      Give back by
      <a href="https://upchieve.org/volunteer" target="_blank" class="uc-link"
        >becoming an Academic Coach.</a
      >
    </p>
    <p v-else class="small-paragraph">
      We weren’t able to verify your eligibility based on the information you’ve
      entered so far.
      <strong>Don’t worry: you may still be eligible!</strong> We just need your
      parent/guardian to answer some more questions first!
    </p>

    <p v-if="isCollegeStudent" class="small-paragraph">
      <i
        >Still need help?
        <a
          href="https://upchieve.org/resources-for-college-students"
          target="_blank"
          class="uc-link"
        >
          Find college resources here.
        </a></i
      >
    </p>

    <button
      v-if="!isCollegeStudent"
      class="uc-form-button"
      type="button"
      @click="ineligibleContinue"
    >
      Continue
    </button>
  </div>

  <div v-else-if="step === 'account'">
    <FormErrors :errors="errors" />

    <h1 class="uc-form-header">Finish creating your free account</h1>
    <p class="uc-form-text">
      Already have an account?
      <router-link class="uc-link" to="/login">Log In</router-link>
    </p>

    <form
      aria-label="Create student account"
      @submit.prevent="submitAccountForm()"
    >
      <div class="uc-form-element">
        <div class="uc-row justify-between">
          <label
            for="firstName"
            v-bind:class="{
              error: hasFormValidationError(v$.profile.firstName),
            }"
            >First Name</label
          >
          <div
            v-if="hasFormValidationError(v$.profile.firstName)"
            class="error-caption"
          >
            {{ getFormValidationError(v$.profile.firstName) }}
          </div>
        </div>
        <input
          id="firstName"
          class="uc-form-text-input"
          type="text"
          placeholder="Enter your first name"
          v-model="profile.firstName"
          v-bind:class="{
            'uc-form-text-input-invalid': hasFormValidationError(
              v$.profile.firstName
            ),
          }"
          @blur="v$.profile.firstName.$touch"
          required
        />
      </div>

      <div class="uc-form-element">
        <div class="uc-row justify-between">
          <label
            for="lastName"
            v-bind:class="{
              error: hasFormValidationError(v$.profile.lastName),
            }"
            >Last Name</label
          >
          <div
            v-if="hasFormValidationError(v$.profile.lastName)"
            class="error-caption"
          >
            {{ getFormValidationError(v$.profile.lastName) }}
          </div>
        </div>
        <input
          id="lastName"
          class="uc-form-text-input"
          type="text"
          placeholder="Enter your last name"
          v-model="profile.lastName"
          v-bind:class="{
            'uc-form-text-input-invalid': hasFormValidationError(
              v$.profile.lastName
            ),
          }"
          @blur="v$.profile.lastName.$touch"
          required
        />
      </div>

      <div class="uc-form-element">
        <div class="uc-row justify-between">
          <label
            for="password"
            v-bind:class="{
              error: hasFormValidationError(v$.credentials.password),
            }"
            >Password</label
          >
          <div
            v-if="hasFormValidationError(v$.credentials.password)"
            class="error-caption"
          >
            {{ getFormValidationError(v$.credentials.password) }}
          </div>
        </div>
        <input
          id="password"
          class="uc-form-text-input"
          type="password"
          placeholder="Create a password"
          v-model="credentials.password"
          v-bind:class="{
            'uc-form-text-input-invalid': hasFormValidationError(
              v$.credentials.password
            ),
          }"
          @blur="v$.credentials.password.$touch"
          required
        />
        <div
          class="metadata"
          v-bind:class="{
            'metadata error': hasFormValidationError(v$.credentials.password),
          }"
        >
          Must have at least one number, one uppercase letter, one lowercase
          letter, and be at least 8 characters long.
        </div>
      </div>

      <button
        class="uc-form-button"
        :disabled="
          isSubmittingAccountForm ||
            cannotSubmitForm(v$.profile) ||
            cannotSubmitForm(v$.credentials)
        "
        type="submit"
      >
        Create my account
      </button>
      <p class="terms-text">
        By clicking the button above, you agree to our
        <a href="/legal" target="_blank" class="uc-link">User Agreement</a>.
      </p>
    </form>

    <div v-if="offerGoogleSSO">
      <div class="uc-row items-center w-full break-line-container">
        <span class="break-line w-full"></span>
        <p class="or-text">or</p>
        <span class="break-line w-full"></span>
      </div>
      <button
        class="uc-form-button google"
        @click.prevent="signUpWithGoogle"
        :disabled="isSubmittingAccountForm"
      >
        <google-logo />
        Sign Up with Google
      </button>
      <p class="terms-text">
        By clicking the button above, you agree to be 13 years of age or older
        and agree to our
        <a href="/legal" target="_blank" class="uc-link">User Agreement</a>.
      </p>
    </div>
  </div>

  <div
    v-else-if="step === 'international'"
    class="uc-column justify-center items-center"
  >
    <error-badge />
    <h1 class="uc-form-header center">
      Looks like you're not in <br />the U.S.!
    </h1>

    <p class="international-availability-info">
      UPchieve is currently only available to students in the U.S. We're sorry
      for the inconvenience! 😔
    </p>

    <p class="international-contact-us">
      Live in the U.S. and still seeing this message? Make sure you're not using
      a VPN.
      <router-link to="/contact" class="uc-link">Contact Us</router-link> if you
      still need help!
    </p>
  </div>
  <div v-else class="uc-form-body">Unexpected Error</div>
</template>

<script>
import { mapGetters } from 'vuex'
import { useVuelidate } from '@vuelidate/core'
import {
  helpers,
  required,
  email,
  minLength,
  maxLength,
} from '@vuelidate/validators'
import Autocomplete from '@trevoreyre/autocomplete-vue'
import LoggerService from '@/services/LoggerService'
import AuthService from '@/services/AuthService'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import VerificationBadge from '@/assets/verification.svg'
import ErrorBadge from '@/assets/error_badge.svg'
import GoogleLogo from '@/assets/google_logo.svg'
import { EVENTS, GRADES } from '@/consts'
import FormErrors from '@/components/FormErrors.vue'
import config from '../../config'

export default {
  components: {
    Autocomplete,
    VerificationBadge,
    ErrorBadge,
    GoogleLogo,
    FormErrors,
  },
  setup() {
    return { v$: useVuelidate() }
  },
  validations() {
    return {
      eligibility: {
        currentGrade: { required: helpers.withMessage('Required', required) },
        highSchool: { required: helpers.withMessage('Required', required) },
        zipCode: {
          required: helpers.withMessage('Required', required),
          minLength: minLength(5),
          maxLength: maxLength(5),
        },
        email: {
          required: helpers.withMessage('Required', required),
          email: helpers.withMessage('Not a valid email address', email),
        },
      },
      profile: {
        firstName: { required: helpers.withMessage('Required', required) },
        lastName: { required: helpers.withMessage('Required', required) },
      },
      credentials: {
        email: {
          required: helpers.withMessage('Required', required),
          email: helpers.withMessage('Not a valid email address', email),
        },
        password: {
          required: helpers.withMessage('Required', required),
          isPasswordValid: helpers.regex(this.PASSWORD_PATTERN),
        },
      },
    }
  },
  data() {
    return {
      gradeLevels: GRADES,
      msg: '',
      errors: [],
      invalidInputs: [],
      eligibility: {
        currentGrade: '',
        highSchool: {},
        zipCode: '',
        email: '',
      },
      credentials: {
        email: '',
        password: '',
      },
      profile: {
        firstName: '',
        lastName: '',
      },
      step: '',
      hasStartedSearchingForSchool: false,
      hasEnteredEmail: false,
      hasEnteredZipCode: false,
      hasEnteredFirstName: false,
      hasEnteredLastName: false,
      hasEnteredPassword: false,
      isCollegeStudent: false,
      isReferred: false,
      isSubmittingAccountForm: false,
    }
  },
  async mounted() {
    if (this.isFailureRedirect()) {
      const params = this.$route.query
      this.eligibility = {
        currentGrade: params['currentGrade'],
        highSchool: {
          upchieveId: params['highSchoolId'],
        },
        zipCode: params['zipCode'],
        email: params['email'],
      }
      this.credentials.email = params['email']
      this.errors.push(
        this.$route.query['error'] ??
          'Failed to sign up with Google. Please use password instead.'
      )
      this.step = 'account'
    } else if (this.isReferred) this.step = 'referred'
    else this.eligibilityPage()

    const isDomesticIpAddress = await this.isDomesticIpAddress()
    if (!isDomesticIpAddress) return this.internationalPage()
  },
  computed: {
    ...mapGetters({
      offerGoogleSSO: 'featureFlags/offerGoogleSSO',
    }),
    trimCurrentGrade() {
      // extracting the first word out of the gradeLevels
      // example: "8th grade" --> "8th"
      return this.eligibility.currentGrade.split(' ')[0]
    },
    title() {
      if (this.isCollegeStudent)
        return "Oops, looks like you're not a high school student!"
      else return "Sorry, we can't verify your eligibility yet."
    },
    CANNOT_FIND_SCHOOL_TEXT() {
      return `Can't find your school?`
    },
    GRADE_LEVELS() {
      return GRADES
    },
    PASSWORD_PATTERN() {
      return /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/
    },
  },
  watch: {
    'eligibility.email': function(currentValue, oldValue) {
      if (currentValue && !oldValue) {
        if (!this.hasEnteredEmail)
          AnalyticsService.captureEvent(EVENTS.STUDENT_ENTERED_EMAIL)
        this.hasEnteredEmail = true
      }
    },
    'eligibility.zipCode': function(currentValue, oldValue) {
      if (currentValue && !oldValue) {
        if (!this.hasEnteredZipCode)
          AnalyticsService.captureEvent(EVENTS.STUDENT_ENTERED_ZIP_CODE)
        this.hasEnteredZipCode = true
      }
    },
    'profile.firstName'(currentValue, oldValue) {
      if (currentValue && !oldValue) {
        if (!this.hasEnteredFirstName)
          AnalyticsService.captureEvent(EVENTS.STUDENT_ENTERED_FIRST_NAME)
        this.hasEnteredFirstName = true
      }
    },
    'profile.lastName'(currentValue, oldValue) {
      if (currentValue && !oldValue) {
        if (!this.hasEnteredLastName)
          AnalyticsService.captureEvent(EVENTS.STUDENT_ENTERED_LAST_NAME)
        this.hasEnteredLastName = true
      }
    },
    'credentials.password'(currentValue, oldValue) {
      if (currentValue && !oldValue) {
        if (!this.hasEnteredPassword)
          AnalyticsService.captureEvent(EVENTS.STUDENT_ENTERED_PASSWORD)
        this.hasEnteredPassword = true
      }
    },
  },
  methods: {
    isFailureRedirect() {
      return (
        !!this.$route.query['email'] &&
        !!this.$route.query['highSchoolId'] &&
        !!this.$route.query['zipCode'] &&
        !!this.$route.query['currentGrade']
      )
    },

    // Necessary to explicitly call on close of the currentGrade select menu
    // because v-select component is preventing blur event.
    onGradeClose() {
      if (!this.eligibility.currentGrade) {
        this.v$.eligibility.currentGrade.$touch()
      }
    },

    eligibilityPage() {
      this.step = 'eligibility'
      this.$router.push('/sign-up/student/eligibility')
    },

    async isDomesticIpAddress() {
      try {
        await NetworkService.checkIpAddress()
        return true
      } catch (error) {
        return false
      }
    },

    internationalPage() {
      this.step = 'international'
      this.$router.push('/sign-up/student/international')
    },

    async hasEligibilityFormErrors() {
      this.errors = []

      if (!this.eligibility.highSchool.upchieveId) {
        this.errors.push('You must select a school.')
      }

      const zipCode = this.eligibility.zipCode

      const {
        body: { isValidZipCode },
      } = await NetworkService.checkZipCode(this, { zipCode })
      if (!isValidZipCode) {
        this.errors.push('You must enter a valid United States zip code.')
      }

      if (!this.eligibility.email) {
        this.errors.push('An email address is required.')
      }

      if (!this.eligibility.currentGrade) {
        this.errors.push('You must select your grade level.')
      }

      return !!this.errors.length
    },

    // transitions from the referred sign up view to account view
    async submitReferralEligibilityForm() {
      if (await this.hasEligibilityFormErrors()) return
      this.accountPage()
    },

    async submitEligibilityForm() {
      AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_CHECK_MY_ELIGIBILITY)

      // reset error msg from server
      this.msg = ''

      if (await this.hasEligibilityFormErrors()) return

      NetworkService.checkStudentEligibility(this, {
        schoolUpchieveId: this.eligibility.highSchool.upchieveId,
        zipCode: this.eligibility.zipCode,
        email: this.eligibility.email,
        referredByCode: window.localStorage.getItem('upcReferredByCode'),
        currentGrade: this.trimCurrentGrade,
      })
        .then(async response => {
          const isEligible = response.body.isEligible
          if (isEligible) {
            AnalyticsService.captureEvent(EVENTS.ELIGIBILITY_ELIGIBLE, {
              event: EVENTS.ELIGIBILITY_ELIGIBLE,
            })
            // autofill the user's email
            this.credentials.email = this.eligibility.email
            this.step = 'eligible'
            this.$router.push('/sign-up/student/eligible')
          } else {
            AnalyticsService.captureEvent(EVENTS.ELIGIBILITY_INELIGIBLE, {
              event: EVENTS.ELIGIBILITY_INELIGIBLE,
            })
            if (response.body.isCollegeStudent) this.isCollegeStudent = true
            this.step = 'ineligible'
            this.$router.push('/sign-up/student/ineligible')
          }
          const isDomesticIpAddress = await this.isDomesticIpAddress()
          if (!isDomesticIpAddress) return this.internationalPage()
        })
        .catch(res => {
          const error =
            (res.body && (res.body.err || res.body.message)) ||
            'Unknown server error'
          this.errors.push(error)
        })
    },

    async accountPage() {
      this.step = 'account'
      this.$router.push('/sign-up/student/account')
      const isDomesticIpAddress = await this.isDomesticIpAddress()
      if (!isDomesticIpAddress) return this.internationalPage()
    },

    ineligibleContinue() {
      AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_STUDENT_ACCESS_PAGE)
      window.location = 'https://upchieve.org/request-access'
    },

    autocompleteSchool(input) {
      this.eligibility.highSchool = {}

      return new Promise(resolve => {
        if (input.length < 3) {
          return resolve([])
        }

        if (!this.hasStartedSearchingForSchool)
          AnalyticsService.captureEvent(EVENTS.STUDENT_SEARCHED_SCHOOL)
        this.hasStartedSearchingForSchool = true

        let cantFindSchoolItem = {
          cantFindSchool: true,
        }

        NetworkService.searchSchool(this, { query: input })
          .then(response => response.body.results)
          .then(schools => {
            schools.push(cantFindSchoolItem)
            resolve(schools)
          })
      })
    },
    getSchoolDisplayName(school) {
      if (school.cantFindSchool) {
        return
      }
      return `${school.name} (${school.city}, ${school.state})`
    },
    handleSelectHighSchool(school) {
      if (school.value === this.CANNOT_FIND_SCHOOL_TEXT) {
        AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_CANT_FIND_SCHOOL)
      } else {
        AnalyticsService.captureEvent(EVENTS.STUDENT_SELECTED_SCHOOL)
        this.eligibility.highSchool = school || {}
      }
    },

    hasAccountFormErrors() {
      this.errors = []

      if (!this.profile.firstName || !this.profile.lastName) {
        this.errors.push('You must enter your first and last name.')
      }
      if (!this.credentials.password) {
        this.errors.push('A password is required.')
      }

      return !!this.errors.length
    },

    async submitAccountForm() {
      this.isSubmittingAccountForm = true
      if (this.hasAccountFormErrors()) {
        this.isSubmittingAccountForm = false
        return
      }

      AuthService.registerOpenStudent(this, {
        email: this.credentials.email,
        password: this.credentials.password,
        terms: true,
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        highSchoolId: this.eligibility.highSchool.upchieveId,
        zipCode: this.eligibility.zipCode,
        currentGrade: this.trimCurrentGrade,
        referredByCode: window.localStorage.getItem('upcReferredByCode'),
      })
        .then(() => {
          window.localStorage.removeItem('upcReferredByCode')
          this.isSubmittingAccountForm = false
          this.$router.push('/verify')
        })
        .catch(err => {
          this.isSubmittingAccountForm = false
          this.errors.push(err.message)
          if (err.message && err.message.match(/^Password/))
            AnalyticsService.captureEvent(
              EVENTS.STUDENT_ENTERED_INVALID_PASSWORD
            )
          if (err.status !== 422) {
            LoggerService.noticeError(err)
          }
        })
    },
    signUpWithGoogle() {
      AnalyticsService.captureEvent(EVENTS.USER_CLICKED_SIGN_UP_WITH_GOOGLE)
      const data = {
        email: this.eligibility.email,
        highSchoolId: this.eligibility.highSchool.upchieveId,
        zipCode: this.eligibility.zipCode,
        currentGrade: this.trimCurrentGrade,
        referredByCode: window.localStorage.getItem('upcReferredByCode'),
      }
      const dataAsQueryParams = Object.entries(data)
        .map(q => `${q[0]}=${q[1]}`)
        .join('&')
      const url = `${config.serverRoot}/auth/register/google/student?${dataAsQueryParams}`
      window.location.replace(url)
    },

    hasFormValidationError(el) {
      return !!el.$errors.length
    },
    cannotSubmitForm(el) {
      return !!el.$errors.length || !!el.$silentErrors.length
    },
    getFormValidationError(el) {
      return el.$errors.map(e => e.$message).join(', ')
    },
  },
}
</script>

<style lang="scss" scoped>
p.small-paragraph {
  color: $c-soft-black;
  font-size: 14px;
  margin-top: 25px;
}

.international-availability-info,
.international-contact-us {
  font-weight: 500;
  margin-top: 24px;
}

.international-contact-us {
  font-style: italic;
  margin-top: 0.5em;
}

.uc-form-text {
  margin-top: 10px;
}

.break-line-container {
  margin-top: 16px;
}

.break-line {
  background-color: $c-secondary-grey;
  height: 1px;
}

.or-text {
  color: $c-secondary-grey;
  font-style: italic;
  padding: 0 10px;
  margin: 0;
}

.terms-text {
  font-size: 14px;
  font-style: italic;
  margin: 4px 0;
  text-align: center;
}
</style>
