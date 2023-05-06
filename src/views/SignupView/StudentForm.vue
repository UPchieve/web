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

  <div
    class="form-card"
    v-else-if="step === 'eligibilityNew'"
    @submit.prevent="submitEligibilityForm()"
  >
    <FormErrors :errors="errors" />

    <h1 v-if="isDashboardFirst" class="header">
      Before we connect you with your tutor, we need to ask you a few quick
      questions to make sure you're eligible for our services
    </h1>
    <h1 v-else class="header">Check if you are eligible for UPchieve</h1>
    <p class="body">
      Already have an account?
      <router-link class="link" to="/login">Log In</router-link>
    </p>

    <form id="form-eligibility" class="flex column">
      <div class="form-element">
        <v-select
          class="select-input"
          v-model="eligibility.currentGrade"
          placeholder="Select your grade*"
          @input="onGradeChange"
          :options="gradeLevels"
          :searchable="false"
          :clearable="false"
          v-bind:class="{
            'select-input-invalid': v$.eligibility.currentGrade.$errors.length,
          }"
          @close="onGradeClose"
          required
        ></v-select>

        <div class="input-metadata error">
          <div v-if="v$.eligibility.currentGrade.$errors.length">
            {{
              v$.eligibility.currentGrade.$silentErrors
                .map(e => e.$message)
                .join(', ')
            }}
          </div>
        </div>
      </div>

      <div class="form-element">
        <autocomplete
          base-class="autocomplete-school-search"
          :search="autocompleteSchool"
          :get-result-value="getSchoolDisplayName"
          placeholder="Search for your school*"
          aria-label="Search for your school*"
          @submit="handleSelectHighSchool"
          @blur="v$.eligibility.highSchool.$touch"
          v-bind:class="{
            'autocomplete-school-search-invalid':
              v$.eligibility.highSchool.$errors.length,
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
        <div class="input-metadata error">
          <div v-if="v$.eligibility.highSchool.$errors.length">
            {{
              v$.eligibility.highSchool.$errors.map(e => e.$message).join(', ')
            }}
          </div>
        </div>
      </div>

      <div class="form-element">
        <input
          id="inputZipCode"
          class="form-text-input"
          type="text"
          placeholder="Enter your zip code*"
          v-model="eligibility.zipCode"
          v-bind:class="{
            'form-text-input-invalid': v$.eligibility.zipCode.$errors.length,
          }"
          @blur="v$.eligibility.zipCode.$touch"
        />
        <div class="input-metadata error">
          <div v-if="v$.eligibility.zipCode.$errors.length">
            {{ v$.eligibility.zipCode.$errors.map(e => e.$message).join(', ') }}
          </div>
        </div>
      </div>

      <div class="form-element">
        <input
          id="inputEligibilityEmail"
          class="form-text-input"
          type="email"
          v-model="eligibility.email"
          v-bind:class="{
            'form-text-input-invalid': v$.eligibility.email.$errors.length,
          }"
          @blur="v$.eligibility.email.$touch"
          placeholder="Email*"
          required
        />
        <div class="input-metadata flex row no-wrap">
          <div>
            We will only use this email to notify you if your eligibility status
            changes in the future.
          </div>
          <div class="error">
            <div v-if="v$.eligibility.email.$errors.length">
              {{ v$.eligibility.email.$errors.map(e => e.$message).join(', ') }}
            </div>
          </div>
        </div>
      </div>

      <button
        id="btn-eligibility-submit"
        class="button-filled-lg mt-30"
        :disabled="
          !!v$.eligibility.$silentErrors.length ||
            !!v$.eligibility.$errors.length
        "
        type="submit"
      >
        Check my eligibility
      </button>
    </form>
  </div>

  <form
    v-else-if="step === 'eligibility' || step === 'referred'"
    class="uc-form-body uc-form-body--center"
    :aria-label="isReferred ? 'Student Referral Signup' : 'Student eligibility'"
    @submit.prevent="
      isReferred ? submitReferralEligibilityForm() : submitEligibilityForm()
    "
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
        v-model="eligibility.currentGrade"
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
      <button class="button-filled-lg" @click="accountPage">
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
      class="button-filled-lg"
      type="button"
      @click="ineligibleContinue"
    >
      Continue
    </button>
  </div>

  <form
    v-else-if="step === 'account'"
    class="flex column form-card"
    aria-label="Student account"
    @submit.prevent="submitAccountForm()"
  >
    <FormErrors :errors="errors" />

    <h1
      class="header"
      v-if="(!isReferred && streamlineSignUpFlow) || isDashboardFirst"
    >
      Woohoo, you're eligible for UPchieve!
    </h1>
    <h1 class="header">Finish creating your free account</h1>
    <p class="body">
      Already have an account?
      <router-link class="link" to="/login">Log In</router-link>
    </p>

    <div class="form-element">
      <input
        class="form-text-input"
        type="text"
        v-model="profile.firstName"
        v-bind:class="{
          'form-text-input-invalid': v$.profile.firstName.$errors.length,
        }"
        @blur="v$.profile.firstName.$touch"
        placeholder="First name*"
        required
      />
      <div class="input-metadata error">
        <div v-if="v$.profile.firstName.$errors.length">
          {{ v$.profile.firstName.$errors.map(e => e.$message).join(', ') }}
        </div>
      </div>
    </div>

    <div class="form-element">
      <input
        class="form-text-input"
        type="text"
        v-model="profile.lastName"
        v-bind:class="{
          'form-text-input-invalid': v$.profile.lastName.$errors.length,
        }"
        @blur="v$.profile.lastName.$touch"
        placeholder="Last name*"
        required
      />
      <div class="input-metadata error">
        <div v-if="v$.profile.lastName.$errors.length">
          {{ v$.profile.lastName.$errors.map(e => e.$message).join(', ') }}
        </div>
      </div>
    </div>

    <div class="form-element">
      <input
        class="form-text-input"
        type="password"
        v-model="credentials.password"
        v-bind:class="{
          'form-text-input-invalid': v$.credentials.password.$errors.length,
        }"
        @blur="v$.credentials.password.$touch"
        placeholder="Password*"
        aria-label="Create a password"
      />
      <p
        class="input-metadata"
        v-bind:class="{
          'input-metadata error-red': v$.credentials.password.$errors.length,
        }"
      >
        Must have at least one number, one uppercase letter, one lowercase
        letter, and be at least 8 characters long.
      </p>
    </div>

    <div class="form-element">
      <v-select
        id="signup-source"
        class="select-input mt-10"
        placeholder="How did you hear about us?"
        v-model="signupSourceId"
        :options="signupSourcesOptions"
        :reduce="option => option.id"
        :searchable="false"
        :clearable="false"
        :loading="isLoadingSignupSources"
        label="name"
      ></v-select>
    </div>

    <div class="form-element" v-if="shouldShowOtherSignupInput()">
      <input
        id="otherSignupSource"
        type="text"
        class="form-text-input"
        placeholder="Tell us where you heard about us!"
        v-model="otherSignupSource"
        autofocus
      />
    </div>

    <div class="uc-form-checkbox ml-10 mt-30">
      <input
        id="userAgreement"
        type="checkbox"
        v-model="credentials.terms"
        required
      />
      <label for="userAgreement">
        I have read and accept the
        <a href="/legal" target="_blank">User Agreement</a>.
      </label>
    </div>

    <button
      class="button-filled-lg mt-30"
      :disabled="
        isSubmittingAccountForm ||
          !!v$.profile.$silentErrors.length ||
          !!v$.profile.$errors.length ||
          !!v$.credentials.$silentErrors.length ||
          !!v$.credentials.$errors.length ||
          !credentials.terms ||
          (!streamlineSignUpFlow && !signupSourceId) ||
          (!streamlineSignUpFlow &&
            shouldShowOtherSignupInput() &&
            !this.otherSignupSource)
      "
      type="submit"
    >
      Create my account
    </button>
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
import { useVuelidate } from '@vuelidate/core'
import {
  helpers,
  required,
  requiredIf,
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
import { EVENTS, GRADES } from '@/consts'
import { backOff } from 'exponential-backoff'
import FormErrors from '@/components/FormErrors.vue'

export default {
  components: {
    Autocomplete,
    VerificationBadge,
    ErrorBadge,
    FormErrors,
  },
  props: {
    isDashboardFirst: Boolean,
  },
  setup() {
    return { v$: useVuelidate() }
  },
  validations() {
    return {
      eligibility: {
        currentGrade: { required },
        highSchool: { required },
        zipCode: { required, minLength: minLength(5), maxLength: maxLength(5) },
        email: { required, email },
      },
      profile: {
        firstName: { required },
        lastName: { required },
      },
      credentials: {
        email: { required, email },
        password: {
          required,
          isPasswordValid: helpers.regex(this.PASSWORD_PATTERN),
        },
        terms: { required },
      },
      signupSourceId: requiredIf(!this.streamlineSignUpFlow),
      otherSignupSource: requiredIf(
        !this.streamlineSignUpFlow && this.shouldShowOtherSignupInput()
      ),
    }
  },
  data() {
    return {
      gradeLevels: GRADES,
      partnerSignupCode: '',
      showSignupCodeDecision: true,
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
        terms: false,
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
      signupSourcesOptions: [],
      signupSourceId: null,
      otherSignupSource: '',
      isLoadingSignupSources: false,
      isReferred: false,
      isMiddleSchoolOptional: false,
      isSubmittingAccountForm: false,
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
      streamlineSignUpFlow: 'featureFlags/streamlineSignUpFlow',
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
    onGradeChange(value) {
      this.isMiddleSchoolOptional = Boolean(
        value === '8th grade' && this.isOptionalMiddleSchoolActive
      )
    },
    // Necessary to explicitly call on close of the currentGrade select menu
    // because v-select component is preventing blur event.
    onGradeClose() {
      if (!this.eligibility.currentGrade) {
        this.v$.eligibility.currentGrade.$touch()
      }
    },

    partnerCodePage() {
      this.step = 'partner-signup-code'
      this.$router.push('/sign-up/student/partner-code')
    },

    eligibilityPage() {
      this.$emit('hideLoginLink')
      this.step = 'eligibilityNew'
      if (!this.isDashboardFirst) {
        this.$router.push('/sign-up/student/eligibility')
      }
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

    async hasEligibilityFormErrors() {
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
            AnalyticsService.captureEvent(EVENTS.ELIGIBILITY_ELIGIBLE, {
              event: EVENTS.ELIGIBILITY_ELIGIBLE,
            })
            // autofill the user's email
            this.credentials.email = this.eligibility.email
            if (this.streamlineSignUpFlow || this.isDashboardFirst) {
              AnalyticsService.captureEvent(
                EVENTS.FLAGGED_AS_STREAMLINE_SIGN_UP_FLOW,
                {
                  event: EVENTS.FLAGGED_AS_STREAMLINE_SIGN_UP_FLOW,
                }
              )
              this.accountPage()
            } else {
              this.$emit('hideLoginLink')
              this.step = 'eligible'
              if (!this.isDashboardFirst) {
                this.$router.push('/sign-up/student/eligible')
              }
            }
          } else {
            this.step = 'ineligible'
            if (response.body.isCollegeStudent) this.isCollegeStudent = true
            if (!this.isDashboardFirst) {
              this.$router.push('/sign-up/student/ineligible')
            }
            AnalyticsService.captureEvent(EVENTS.ELIGIBILITY_INELIGIBLE, {
              event: EVENTS.ELIGIBILITY_INELIGIBLE,
            })
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
      this.$emit('hideLoginLink')
      this.step = 'account'
      if (!this.isDashboardFirst) {
        this.$router.push('/sign-up/student/account')
      }
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
      if (!this.streamlineSignUpFlow) {
        if (!this.signupSourceId) {
          this.errors.push(
            'Please select an option for how you heard about us.'
          )
        }
        if (this.shouldShowOtherSignupInput() && !this.otherSignupSource) {
          this.errors.push(
            'Please enter signup source in the text box if "Other" is selected'
          )
          this.invalidInputs.push('otherSignupSource')
        }
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
.select-input {
  box-sizing: border-box;
  width: 100%;

  .vs__search {
    margin: 0;
    padding: 0;

    &::placeholder {
      color: $c-banned-grey;
    }
  }

  &:hover {
    .vs__dropdown-option {
      background-color: #fff;
    }
  }

  .vs__selected-options {
    padding: 0;
  }

  .vs__selected {
    margin: 0;
    padding: 0;
  }

  &-invalid {
    .vs__dropdown-toggle {
      outline: 1px solid $c-error-red;
    }
  }

  .vs__dropdown-toggle {
    border: 1px solid $border-grey;
    border-radius: 4px;
    box-shadow: none;
    height: 56px;
    padding: 15px 13px;
    width: 100%;
  }

  .vs__dropdown-toggle[aria-expanded='true'] {
    outline: 1px solid $c-information-blue;
  }

  .vs__dropdown-menu {
    background: #fff;
    border: solid 1px #ccc;
    border-top: none;
    border-radius: 5px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    font-size: 14px;
    list-style: none;
    padding: 0;
    margin-top: 2px;
    max-height: 180px;
    overflow: auto;
    width: 100%;
  }

  .vs__dropdown-option {
    color: #000;
    cursor: pointer;
    padding: 10px 12px;
    width: 100%;

    &:hover,
    &:focus {
      background: #eee;
      color: #000;
    }
  }
}

.autocomplete-school-search {
  width: 100%;

  &-input {
    border: 1px solid $border-grey;
    border-radius: 4px;
    box-shadow: none;
    padding: 15px 13px;
    width: 100%;

    &::placeholder {
      color: $c-banned-grey;
    }

    &:focus-within {
      outline: 1px solid $c-information-blue;
    }
  }

  &-invalid .autocomplete-school-search-input {
    outline: 1px solid $c-error-red;
  }

  &-result-list {
    background: #fff;
    border: solid 1px #ccc;
    border-top: none;
    border-radius: 5px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    font-size: 14px;
    list-style: none;
    padding: 0;
    margin-top: 1px;
    max-height: 180px;
    overflow: auto;
    width: 100%;
  }

  [data-position='above'] .autocomplete-result-list {
    border: solid 1px #ccc;
    border-bottom: none;
    border-radius: 5px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    margin-bottom: 1px;
    margin-top: 0;
  }

  .result {
    cursor: pointer;
    padding: 10px 12px;
    width: 100%;

    &:hover,
    &:focus {
      background: #eee;
    }
  }
}
</style>

<style lang="scss" scoped>
.uc-form-body {
  @include child-spacing(top, 25px);

  &__select {
    height: 48px;
    width: 100%;
    margin-top: 20px;
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

.header {
  font-weight: 500;
  font-size: 24px;
}

.body {
  font-size: 16px;
  margin-bottom: 30px;

  .link {
    color: $c-information-blue;
  }
}

.form-card {
  padding: 20px 40px;
}

.form-element {
  display: flex;
  flex-direction: column;
  margin-bottom: 6px;
}

.form-text-input {
  border: 1px solid $border-grey;
  border-radius: 4px;
  box-shadow: none;
  box-sizing: border-box;
  padding: 15px 13px;

  &:focus {
    outline: 1px solid $c-information-blue;
  }

  &-invalid {
    outline: 1px solid $c-error-red;
  }

  &::placeholder {
    color: $c-banned-grey;
  }
}

.button-filled-lg {
  background-color: $c-information-blue;
  border: none;
  border-radius: 200px;
  color: #fff;
  height: 48px;
  padding: 12px 24px;

  &:hover {
    background-color: #103a90;
  }

  &:disabled {
    background-color: #f1f3f6;
    color: #8b939f;
  }
}

.input-metadata {
  color: $c-banned-grey;
  font-size: 12px;
  margin: 1px 10px 0 10px;

  &.error,
  .error {
    color: $c-error-red;
    font-size: 10px;
    min-height: 15px;
    text-align: right;
  }

  &.error-red {
    color: $c-error-red;
  }
}

.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}

.flex {
  display: flex;

  &.column {
    flex-direction: column;
  }

  &.row {
    flex-direction: row;
  }

  &.no-wrap {
    flex-wrap: nowrap;
  }
}

.mt-30 {
  margin-top: 30px;
}

.ml-10 {
  margin-left: 10px;
}
</style>
