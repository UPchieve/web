<template>
  <form
    v-if="step === 'partner-signup-code'"
    class="uc-form-body"
    aria-label="Student signup"
    @submit.prevent="submitPartnerSignupCode()"
  >
    <FormErrors :errors="errors" />

    <template v-if="showSignupCodeDecision">
      <div class="step-title step-title--center">
        Do you have a sign-up code?
      </div>
      <div class="uc-column">
        <button class="uc-form-button" type="button" @click="signupCodeYes">
          Yes
        </button>
      </div>
      <div class="uc-column">
        <button class="uc-form-button" type="button" @click="eligibilityPage">
          No
        </button>
      </div>
    </template>

    <template v-else>
      <div class="uc-column">
        <button
          class="back-button"
          type="button"
          @click="backToSignupCodeDecision"
        >
          Back
        </button>

        <label for="inputPartnerCode" class="uc-form-label">Sign-up code</label>
        <input
          id="inputPartnerCode"
          type="text"
          class="uc-form-input"
          v-model="partnerSignupCode"
          placeholder="Code"
          aria-label="Registration code"
        />
      </div>

      <button class="uc-form-button enter-signup-code-button" type="submit">
        Enter
      </button>
    </template>

    <div v-if="msg !== ''" role="alert">{{ msg }}</div>
  </form>

  <form
    v-else-if="step === 'eligibility' || step === 'referred'"
    class="uc-form-body uc-form-body--center"
    :aria-label="isReferred ? 'Student Referral Signup' : 'Student eligibility'"
    @submit.prevent="isReferred ? continueToAccountPage() : submitEligibility()"
  >
    <FormErrors :errors="errors" />

    <div class="uc-column title-wrapper">
      <h3>Great! Let's get started</h3>
      <p v-if="!isReferred">
        First, we need to ask you a few quick questions to make sure you're
        eligible for our services.
      </p>
    </div>

    <div class="uc-column grade-select">
      <div class="uc-form-label">
        What grade are you in?
      </div>
      <v-select
        class="uc-form-body__select"
        v-model="profile.currentGrade"
        placeholder="Select your grade"
        @input="onGradeChange"
        :options="gradeLevels"
        :searchable="false"
      ></v-select>
    </div>

    <div class="uc-column">
      <label for="inputHighschool" class="uc-form-label"
        >What school do you go to?
        <span v-if="isMiddleSchoolOptional">(Optional)</span></label
      >
      <div class="school-search">
        <autocomplete
          base-class="uc-autocomplete"
          :search="autocompleteSchool"
          placeholder="Search for your school"
          aria-label="Search for your school"
          :get-result-value="getSchoolDisplayName"
          @submit="handleSelectHighSchool"
        >
          <template #result="{ result, props }">
            <li v-bind="props">
              <div>
                <span v-if="result.name">
                  {{ result.name }} ({{ result.city }},
                  {{ result.state }})</span
                >
                <a
                  v-if="result.cantFindSchool"
                  target="_blank"
                  href="https://upchieve.org/cant-find-school"
                  @click="cantFindSchool"
                >
                  Can't find your school?
                </a>
              </div>
            </li>
          </template>
        </autocomplete>
      </div>
    </div>

    <div class="uc-column">
      <label for="inputZipCode" class="uc-form-label"
        >What zip code do you live in?</label
      >
      <input
        id="inputZipCode"
        type="text"
        pattern="[0-9]{5}"
        class="uc-form-input"
        v-bind:class="{
          'uc-form-input--invalid': invalidInputs.indexOf('inputZipCode') > -1,
        }"
        v-model="eligibility.zipCode"
        required
        placeholder="5 digit zip code"
        aria-label="5 digit zip code"
      />
    </div>

    <div class="uc-column">
      <label for="inputEligibilityEmail" class="uc-form-label"
        >What's your email?</label
      >
      <input
        id="inputEligibilityEmail"
        type="email"
        class="uc-form-input"
        v-bind:class="{
          'uc-form-input--invalid':
            invalidInputs.indexOf('inputEligibilityEmail') > -1,
        }"
        v-model="eligibility.email"
        required
        placeholder="Email"
        aria-label="Email"
      />
      <p class="uc-form-subtext" v-if="!isReferred">
        We will only use this email to notify you if your eligibility status
        changes in the future.
      </p>
    </div>

    <button class="uc-form-button-big" type="submit">
      {{ !isReferred ? 'Check my eligibility' : 'Continue' }}
    </button>

    <div v-if="msg !== ''" role="alert">{{ msg }}</div>
  </form>

  <div
    v-else-if="step === 'eligible'"
    class="uc-form-body uc-form-body--center"
  >
    <div>
      <verification-badge />
      <h3>Woohoo, you're eligible!</h3>
      <p>
        Finish setting up your free account
      </p>
    </div>
    <div>
      <button class="uc-form-button-big" type="button" @click="accountPage">
        Continue
      </button>
    </div>
  </div>

  <div
    v-else-if="step === 'ineligible'"
    class="uc-form-body uc-form-body--center"
  >
    <div class="ineligible-icon-wrapper">
      <error-badge />
    </div>
    <h3>{{ title }}</h3>

    <p v-if="isCollegeStudent" class="small-paragraph college-ineligibility">
      We don't have the capacity to help college students right now, but did you
      know that many UPchieve students dream of going to college just like you?
      Give back by
      <a href="https://upchieve.org/volunteer" target="_blank"
        >becoming an Academic Coach.</a
      >
    </p>
    <p v-else class="small-paragraph">
      We weren’t able to verify your eligibility based on the information you’ve
      entered so far.
      <strong>Don’t worry: you may still be eligible!</strong> We just need your
      parent/guardian to answer some more questions first!
    </p>

    <p v-if="isCollegeStudent" class="small-paragraph college-ineligibility">
      <i
        >Still need help?
        <a
          href="https://upchieve.org/resources-for-college-students"
          target="_blank"
        >
          Find college resources here.
        </a></i
      >
    </p>

    <button
      v-if="!isCollegeStudent"
      class="uc-form-button-big"
      type="button"
      @click="ineligibleContinue"
    >
      Continue
    </button>
  </div>

  <form
    v-else-if="step === 'account'"
    class="uc-form-body uc-form-body--center"
    aria-label="Student account"
    @submit.prevent="submitAccountForm()"
  >
    <FormErrors :errors="errors" />

    <h3 v-if="isReferred">Finish creating your account</h3>
    <div class="step-title" v-else>Finish creating your account</div>

    <div class="uc-column">
      <label for="firstName" class="uc-form-label">What's your name?</label>
      <div class="uc-row name-fields">
        <div class="uc-column">
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
          <p class="uc-form-subtext">First Name</p>
        </div>
        <div class="uc-column">
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
          <p class="uc-form-subtext">Last Name</p>
        </div>
      </div>
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
        Must have at least one number, one uppercase letter, and one lowercase
        letter.
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
        type="checkbox"
        v-model="credentials.terms"
        required
      />
      <label for="userAgreement">
        I am at least 13 years of age and have read and accept the
        <a href="/legal" target="_blank">User Agreement</a>.
      </label>
    </div>

    <button class="uc-form-button-big" type="submit">
      Create my account
    </button>

    <div v-if="msg !== ''" role="alert">{{ msg }}</div>
  </form>

  <div
    v-else-if="step === 'international'"
    class="uc-form-body uc-form-body--center"
  >
    <error-badge />
    <h3>Looks like you're not in <br />the U.S.!</h3>

    <p class="international-availability-info">
      UPchieve is currently only available to students in the U.S. We're sorry
      for the inconvenience! 😔
    </p>

    <p class="international-contact-us">
      Live in the U.S. and still seeing this message? Make sure you're not using
      a VPN.
      <router-link to="/contact" class="contact">Contact Us</router-link> if you
      still need help!
    </p>
  </div>
  <div v-else class="uc-form-body">Unexpected Error</div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import validator from 'validator'
import Autocomplete from '@trevoreyre/autocomplete-vue'
import LoggerService from '@/services/LoggerService'
import AuthService from '@/services/AuthService'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import VerificationBadge from '@/assets/verification.svg'
import ErrorBadge from '@/assets/error_badge.svg'
import { EVENTS } from '@/consts'
import { backOff } from 'exponential-backoff'
import FormErrors from '@/components/FormErrors.vue'

export default {
  components: {
    Autocomplete,
    VerificationBadge,
    ErrorBadge,
    FormErrors,
  },
  data() {
    const gradeLevels = [
      '8th grade',
      '9th grade',
      '10th grade',
      '11th grade',
      '12th grade',
      'College',
      'Other',
    ]

    return {
      gradeLevels,
      partnerSignupCode: '',
      showSignupCodeDecision: true,
      msg: '',
      errors: [],
      invalidInputs: [],
      eligibility: {
        highSchool: {},
        zipCode: '',
        email: '',
      },
      credentials: {
        email: '',
        password: '',
        terms: false,
      },
      profile: {
        firstName: '',
        lastName: '',
        currentGrade: '',
      },
      step: '',
      hasStartedSearchingForSchool: false,
      hasEnteredEmail: false,
      hasEnteredZipCode: false,
      hasEnteredFirstName: false,
      hasEnteredLastName: false,
      hasEnteredPassword: false,
      isCollegeStudent: false,
      signupSourcesOptions: [],
      signupSourceId: null,
      otherSignupSource: '',
      isLoadingSignupSources: false,
      isReferred: false,
      isMiddleSchoolOptional: false,
    }
  },
  async mounted() {
    if (this.isReferred) this.step = 'referred'
    else if (this.isMobileApp) this.partnerCodePage()
    else this.eligibilityPage()

    const isDomesticIpAddress = await this.isDomesticIpAddress()
    if (!isDomesticIpAddress) return this.internationalPage()
  },
  computed: {
    ...mapState({
      isMobileApp: state => state.app.isMobileApp,
    }),
    ...mapGetters({
      isOptionalMiddleSchoolActive: 'featureFlags/isOptionalMiddleSchoolActive',
    }),
    trimCurrentGrade() {
      // extracting the first word out of the gradeLevels
      // example: "8th grade" --> "8th"
      return this.profile.currentGrade.split(' ')[0]
    },
    title() {
      if (this.isCollegeStudent)
        return "Oops, looks like you're not a high school student!"
      else return "Sorry, we can't verify your eligibility yet."
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
    onGradeChange(value) {
      this.isMiddleSchoolOptional = Boolean(
        value === '8th grade' && this.isOptionalMiddleSchoolActive
      )
    },

    partnerCodePage() {
      this.step = 'partner-signup-code'
      this.$router.push('/sign-up/student/partner-code')
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
      this.$emit('hideLoginLink')
      this.step = 'international'
      this.$router.push('/sign-up/student/international')
    },

    signupCodeYes() {
      this.showSignupCodeDecision = false
    },

    backToSignupCodeDecision() {
      this.errors = []
      this.invalidInputs = []
      this.showSignupCodeDecision = true
    },

    submitPartnerSignupCode() {
      this.errors = []
      this.invalidInputs = []

      NetworkService.checkStudentPartnerSignupCode(this.partnerSignupCode)
        .then(res => {
          const studentPartnerKey = res.body.studentPartnerKey
          const studentPartnerRoute = `/signup/student/${studentPartnerKey}`

          // Redirect to student partner signup page
          this.$router.push(studentPartnerRoute)
        })
        .catch(() => {
          this.errors.push('Invalid sign-up code')
        })
    },

    async checkEligibilityErrors() {
      // validate input
      this.errors = []
      this.invalidInputs = []

      if (
        !this.eligibility.highSchool.upchieveId &&
        !this.isMiddleSchoolOptional
      ) {
        this.errors.push('You must select a school.')
      }

      const zipCode = this.eligibility.zipCode

      const {
        body: { isValidZipCode },
      } = await NetworkService.checkZipCode(this, { zipCode })
      if (!isValidZipCode) {
        this.errors.push('You must enter a valid United States zip code')
        this.invalidInputs.push('inputZipCode')
      }

      if (!this.eligibility.email) {
        this.errors.push('An email address is required.')
        this.invalidInputs.push('inputEligibilityEmail')
      } else if (!validator.isEmail(this.eligibility.email)) {
        this.errors.push(
          this.eligibility.email + ' is not a valid email address.'
        )
        this.invalidInputs.push('inputEligibilityEmail')
      }

      if (!this.profile.currentGrade) {
        this.errors.push('You must select your grade level.')
      }
    },

    // transitions from the referred sign up view to account view
    async continueToAccountPage() {
      await this.checkEligibilityErrors()
      if (this.errors.length) return

      // autofill the user's email
      this.credentials.email = this.eligibility.email
      this.step = 'account'
      this.$router.push('/sign-up/student/account')
      await this.getSignupSources()
    },

    async submitEligibility() {
      AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_CHECK_MY_ELIGIBILITY)

      // reset error msg from server
      this.msg = ''

      await this.checkEligibilityErrors()
      if (this.errors.length) return

      let schoolUpchieveId = this.eligibility.highSchool.upchieveId
      if (this.isMiddleSchoolOptional) {
        schoolUpchieveId =
          schoolUpchieveId || '00000e00-00b0-00ca-0000-0b00c0b0000f'
      }

      NetworkService.checkStudentEligibility(this, {
        schoolUpchieveId,
        zipCode: this.eligibility.zipCode,
        email: this.eligibility.email,
        referredByCode: window.localStorage.getItem('upcReferredByCode'),
        currentGrade: this.trimCurrentGrade,
      })
        .then(async response => {
          const isEligible = response.body.isEligible
          if (isEligible) {
            this.step = 'eligible'
            this.$router.push('/sign-up/student/eligible')
            AnalyticsService.captureEvent(EVENTS.ELIGIBILITY_ELIGIBLE, {
              event: EVENTS.ELIGIBILITY_ELIGIBLE,
            })
            // autofill the user's email
            this.credentials.email = this.eligibility.email
          } else {
            this.step = 'ineligible'
            if (response.body.isCollegeStudent) this.isCollegeStudent = true
            this.$router.push('/sign-up/student/ineligible')
            AnalyticsService.captureEvent(EVENTS.ELIGIBILITY_INELIGIBLE, {
              event: EVENTS.ELIGIBILITY_INELIGIBLE,
            })
          }
          const isDomesticIpAddress = await this.isDomesticIpAddress()
          if (!isDomesticIpAddress) return this.internationalPage()
        })
        .catch(res => {
          const error = (res.body && res.body.err) || 'Unknown server error'
          this.errors.push(error)
        })
    },
    async accountPage() {
      this.step = 'account'
      this.$router.push('/sign-up/student/account')
      const isDomesticIpAddress = await this.isDomesticIpAddress()
      if (!isDomesticIpAddress) return this.internationalPage()
      await this.getSignupSources()
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
        return `Can't Find School`
      }
      return `${school.name} (${school.city}, ${school.state})`
    },
    handleSelectHighSchool(school) {
      AnalyticsService.captureEvent(EVENTS.STUDENT_SELECTED_SCHOOL)
      this.eligibility.highSchool = school || {}
    },
    submitAccountForm() {
      this.errors = []
      this.invalidInputs = []
      if (!this.profile.firstName || !this.profile.lastName) {
        this.errors.push('You must enter your first and last name.')
      }
      if (!this.profile.firstName) {
        this.invalidInputs.push('firstName')
      }
      if (!this.profile.lastName) {
        this.invalidInputs.push('lastName')
      }
      if (!this.credentials.terms) {
        // necessary because the CSS hides the browser's validation message
        this.errors.push('You must read and accept the user agreement.')
      }
      if (!this.credentials.password) {
        this.errors.push('A password is required.')
        this.invalidInputs.push('inputPassword')
      }
      if (!this.signupSourceId) {
        this.errors.push('Please select an option for how you heard about us.')
      }
      if (this.shouldShowOtherSignupInput() && !this.otherSignupSource) {
        this.errors.push(
          'Please enter signup source in the text box if "Other" is selected'
        )
        this.invalidInputs.push('otherSignupSource')
      }

      if (!this.errors.length) this.submit()
    },
    submit() {
      AuthService.registerOpenStudent(this, {
        email: this.credentials.email,
        password: this.credentials.password,
        terms: this.credentials.terms,
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        highSchoolId: this.eligibility.highSchool.upchieveId,
        zipCode: this.eligibility.zipCode,
        currentGrade: this.trimCurrentGrade,
        referredByCode: window.localStorage.getItem('upcReferredByCode'),
        signupSourceId: this.signupSourceId,
        otherSignupSource: this.otherSignupSource,
      })
        .then(() => {
          window.localStorage.removeItem('upcReferredByCode')
          this.$router.push('/verify')
        })
        .catch(err => {
          this.errors.push(err.message)
          if (err.message.match(/^Password/))
            AnalyticsService.captureEvent(
              EVENTS.STUDENT_ENTERED_INVALID_PASSWORD
            )
          if (err.status !== 422) {
            LoggerService.noticeError(err)
          }
        })
    },
    cantFindSchool() {
      AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_CANT_FIND_SCHOOL)
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
        this.signupSourcesOptions = data.body.signupSources
      } catch (err) {
        LoggerService.noticeError(err)
      } finally {
        this.isLoadingSignupSources = false
      }
    },
  },
}
</script>

<style lang="scss">
.school-search ul {
  z-index: 11 !important;
}
</style>

<style lang="scss" scoped>
.uc-form-body .grade-select {
  z-index: 10;
}

.uc-form-body {
  @include child-spacing(top, 25px);

  &__select {
    height: 48px;
    width: 100%;
    margin-top: 20px;
    z-index: 0;
  }

  ::placeholder {
    color: $c-banned-grey;
  }
}

.step-title {
  font-weight: bold;
  text-align: left;

  &--center {
    text-align: center;
  }
}

.back-button {
  display: flex;
  margin-bottom: 25px;
  cursor: pointer;
  align-self: flex-start;
  color: #777;

  &:before {
    content: '←';
    padding-right: 5px;
  }
}

.title-wrapper {
  h3 {
    margin: 0 0 5px 0;
  }

  p {
    font-size: 14px;
  }
}

.college-ineligibility {
  a {
    color: $c-success-green;
    font-weight: 500;
    text-decoration: underline;
  }
}

.name-fields {
  @include child-spacing(right, 15px);

  input {
    box-sizing: border-box;
    width: 100%;
    height: 45px;
  }
}

p.small-paragraph {
  color: $c-soft-black;
  font-size: 14px;
}

.enter-signup-code-button {
  margin-bottom: 25px;
}

.school-search {
  position: relative;

  &__no-results {
    position: absolute;
    left: 0;
    top: 100%;
    width: 100%;
    padding: 10px 12px;
    border: solid 1px #ccc;
    border-top: none;
    border-radius: 5px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    text-align: left;
    font-size: 14px;
    background: #fff;
    color: #666;

    a {
      text-decoration: underline;
    }
  }
}

.d-none {
  display: none !important;
}

.international-availability-info,
.international-contact-us {
  font-weight: 500;
}

.international-contact-us {
  font-style: italic;
  margin-top: 0.5em;
}

.contact {
  color: $c-success-green;
}
</style>
