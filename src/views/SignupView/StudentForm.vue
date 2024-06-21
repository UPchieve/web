<template>
  <div v-if="step === 'eligibility' || step === 'referred'">
    <FormErrors :errors="errors" />

    <h1
      v-if="!isCollegeConfidential"
      class="uc-form-header"
      data-testid="eligibility-title"
    >
      {{ customEligibilityHeader || `Awesome! Let's check if we're a match` }}
    </h1>
    <div v-if="showBigFutureIntroCopy">
      <p class="uc-form-text">
        {{ bfIntroCopy }}
      </p>
    </div>
    <div v-if="isCollegeConfidential">
      <div v-if="ccIntroCopy === 'get-that-a'">
        <h1 class="uc-form-header">Get that A you deserve!</h1>
        <p class="uc-form-text">
          Students who use UPchieve get better grades in their classes and are
          more competitive during college admission season! Sign up for free
          access to the 24/7 academic support that can help you achieve your
          dream.
        </p>
      </div>
      <div v-else-if="ccIntroCopy === 'stuck-on-problem'">
        <h1 class="uc-form-header">Stuck on a problem? Our tutors can help!</h1>
        <p class="uc-form-text">
          UPchieve connects students with tutors that will help them during any
          part of a homework problem. Why struggle alone? Sign up for free
          access to our thousands of 1:1 24/7 tutors that can help you whenever
          you need it.
        </p>
      </div>
      <div v-else-if="ccIntroCopy === 'grade-focused'">
        <h1 class="uc-form-header">
          6th to 12th grade, UPchieve has you covered!
        </h1>
        <p class="uc-form-text">
          UPchieve provides students with trained 1:1 coaches who can follow you
          in your academic journey and prepare you for future success. Why go
          through school alone? Sign up for free 24/7 tutoring and college prep!
        </p>
      </div>
      <div v-else>
        <h1 class="uc-form-header">Welcome College Confidential Student!</h1>
        <p class="uc-form-text">
          UPchieve is partnering with College Confidential to offer 100% free,
          online college counseling and tutoring available 24/7! Share some
          quick info below to see if you're eligible.
        </p>
      </div>
    </div>
    <div v-if="isCodeDotOrgStudent" data-testid="code-dot-org-custom-copy">
      Create an account now to access FREE, 24/7 tutoring in all your classes,
      including AP Computer Science.
    </div>
    <form
      id="form-eligibility"
      class="uc-column"
      @submit.prevent="
        isReferred ? submitReferralEligibilityForm() : submitEligibilityForm()
      "
    >
      <div class="uc-form-element" v-if="useParentGuardianSignUpFlow">
        <label
          for="studentFirstName"
          data-testid="student-first-name-label"
          v-bind:class="{
            error: hasFormValidationError(v$.eligibility.studentFirstName),
          }"
          >What is
          {{ getFormLabelIdentifierPossessive }}
          first name?
        </label>
        <input
          id="studentFirstName"
          class="uc-form-text-input"
          data-testid="pg-student-first-name-input"
          type="text"
          :placeholder="`Enter ${getFormLabelIdentifierPossessive} first name`"
          v-bind:class="{
            'uc-form-text-input-invalid': hasFormValidationError(
              v$.eligibility.studentFirstName
            ),
          }"
          v-model="eligibility.studentFirstName"
          @blur="v$.eligibility.studentFirstName.$touch"
          autocomplete="given-name"
          required
        />
      </div>

      <div class="uc-form-element" v-if="useParentGuardianSignUpFlow">
        <label
          for="studentLastName"
          data-testid="student-last-name-label"
          v-bind:class="{
            error: hasFormValidationError(v$.eligibility.studentLastName),
          }"
          >What is
          {{ getFormLabelIdentifierPossessive }}
          last name?
        </label>
        <input
          id="studentLastName"
          class="uc-form-text-input"
          data-testid="pg-student-last-name-input"
          type="text"
          :placeholder="`Enter ${getFormLabelIdentifierPossessive} last name`"
          v-bind:class="{
            'uc-form-text-input-invalid': hasFormValidationError(
              v$.eligibility.studentLastName
            ),
          }"
          v-model="eligibility.studentLastName"
          @blur="v$.eligibility.studentLastName.$touch"
          autocomplete="family-name"
          required
        />
      </div>

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
          data-testid="student-grade-select"
          class="uc-form-select-input"
          v-model="eligibility.currentGrade"
          :placeholder="`Select ${getFormLabelIdentifierPossessive} grade`"
          :aria-label="`Select ${getFormLabelIdentifierPossessive} grade`"
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
          data-testid="student-school-autocomplete"
          base-class="uc-form-autocomplete-input"
          :placeholder="`Search for ${getFormLabelIdentifierPossessive} school`"
          :aria-label="`Search for ${getFormLabelIdentifierPossessive} school`"
          :search="autocompleteSchool"
          :get-result-value="getSchoolDisplayName"
          :debounce-time="500"
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
              <div v-if="result.name" id="ph-no-capture" class="result">
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
          data-testid="student-zipcode-input"
          class="uc-form-text-input"
          type="text"
          :placeholder="`Enter ${getFormLabelIdentifierPossessive} zip code`"
          :aria-label="`Enter ${getFormLabelIdentifierPossessive} zip code`"
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

      <div v-if="!skipEligibilityEmail" class="uc-form-element">
        <div class="uc-row justify-between">
          <label
            for="student-email"
            v-bind:class="{
              error: hasFormValidationError(v$.eligibility.studentEmail),
            }"
            >Student Email</label
          >
          <div
            v-if="hasFormValidationError(v$.eligibility.studentEmail)"
            class="error-caption"
          >
            {{ getFormValidationError(v$.eligibility.studentEmail) }}
          </div>
        </div>
        <input
          id="student-email"
          data-testid="student-email-input"
          class="uc-form-text-input"
          type="email"
          :placeholder="`Enter ${getFormLabelIdentifierPossessive} email address`"
          :aria-label="`Enter ${getFormLabelIdentifierPossessive} email address`"
          v-model="eligibility.studentEmail"
          v-bind:class="{
            'uc-form-text-input-invalid': hasFormValidationError(
              v$.eligibility.studentEmail
            ),
          }"
          @blur="v$.eligibility.studentEmail.$touch"
          required
        />
        <div class="metadata">
          We will only use this email to notify
          {{ getFormLabelIdentifier }} if
          {{ getFormLabelIdentifierPossessive }}
          eligibility status changes in the future.
        </div>

        <div v-if="useParentGuardianSignUpFlow" class="uc-form-element">
          <div class="uc-row justify-between">
            <label
              for="parent-guardian-email"
              v-bind:class="{
                error: hasFormValidationError(
                  v$.eligibility.parentGuardianEmail
                ),
              }"
              >Your Email</label
            >
            <div
              v-if="hasFormValidationError(v$.eligibility.parentGuardianEmail)"
              class="error-caption"
            >
              {{ getFormValidationError(v$.eligibility.parentGuardianEmail) }}
            </div>
          </div>
          <input
            id="parent-guardian-email"
            data-testid="parent-guardian-email-input"
            class="uc-form-text-input"
            type="email"
            placeholder="Enter your email address"
            aria-label="Enter your email address"
            v-model="eligibility.parentGuardianEmail"
            v-bind:class="{
              'uc-form-text-input-invalid': hasFormValidationError(
                v$.eligibility.parentGuardianEmail
              ),
            }"
            @blur="v$.eligibility.parentGuardianEmail.$touch"
            required
          />
        </div>
      </div>

      <button
        id="btn-eligibility-submit"
        data-testid="eligibility-form-submit-btn"
        class="uc-form-button"
        :disabled="cannotSubmitForm(v$.eligibility) ? true : null"
        type="submit"
      >
        Continue
      </button>
    </form>
    <p class="uc-form-text below text-center">
      Already have an account?
      <router-link class="uc-link" to="/login">Log In</router-link>
    </p>
  </div>

  <div
    v-else-if="step === 'eligible'"
    class="uc-column justify-center items-center h-full"
  >
    <verification-badge />
    <h1 class="uc-form-header center">Woohoo, you're eligible!</h1>
    <p class="uc-form-text center">Finish setting up your free account</p>
    <button class="uc-form-button" @click="accountPage">Continue</button>
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
    <p v-else class="small-paragraph" data-testid="eligibility-appeal-message">
      We weren’t able to verify
      {{ getFormLabelIdentifierPossessive }}
      eligibility based on the information you’ve entered so far.
      <strong
        >Don’t worry: {{ getFormLabelIdentifier }} may still be
        eligible!</strong
      >
      {{ getIneligibleCanAppealText }}
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

  <div
    id="pg-confirmation-message"
    v-else-if="step === 'parentGuardianConfirmation'"
    class="uc-form"
    data-testid="pg-confirmation-message"
  >
    <div class="uc-column justify-center items-center h-full center">
      <verification-badge />
      <h1>You're all set!</h1>
      <p>
        An account for {{ this.eligibility.studentFirstName }} has been created.
      </p>
      <p>
        We have sent an email to
        <span id="ph-no-capture" data-e2e-ignore>{{
          this.eligibility.studentEmail
        }}</span>
        to set a password.
      </p>
    </div>
  </div>

  <div v-else-if="step === 'account'">
    <FormErrors :errors="errors" />

    <h1 class="uc-form-header">Finish creating your free account</h1>
    <p class="uc-form-text">
      Already have an account?
      <router-link class="uc-link" to="/login">Log In</router-link>
    </p>

    <div v-if="offerGoogleSSO">
      <button
        class="uc-form-button google"
        @click.prevent="signUpWithGoogle"
        :disabled="isSubmittingAccountForm ? true : null"
      >
        <google-logo />
        Sign Up with Google
      </button>
      <p class="terms-text">
        By clicking the button above, you agree to our
        <a href="https://upchieve.org/legal" target="_blank" class="uc-link"
          >User Agreement</a
        >.
      </p>
      <div class="uc-row items-center w-full break-line-container">
        <span class="break-line w-full"></span>
        <p class="or-text">or</p>
        <span class="break-line w-full"></span>
      </div>
    </div>

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
          data-testid="student-first-name-input"
          class="uc-form-text-input"
          type="text"
          :placeholder="`Enter ${getFormLabelIdentifierPossessive} first name`"
          :aria-label="`Enter ${getFormLabelIdentifierPossessive} first name`"
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
          data-testid="student-last-name-input"
          class="uc-form-text-input"
          type="text"
          :placeholder="`Enter ${getFormLabelIdentifierPossessive} last name`"
          :aria-label="`Enter ${getFormLabelIdentifierPossessive} last name`"
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

      <div v-if="!eligibility.studentEmail" class="uc-form-element">
        <div class="uc-row justify-between">
          <label
            for="email"
            v-bind:class="{
              error: hasFormValidationError(v$.credentials.email),
            }"
            >Email</label
          >
          <div
            v-if="hasFormValidationError(v$.credentials.email)"
            class="error-caption"
          >
            {{ getFormValidationError(v$.credentials.email) }}
          </div>
        </div>
        <input
          id="email"
          class="uc-form-text-input"
          type="email"
          :placeholder="`Enter ${getFormLabelIdentifierPossessive} email address`"
          :aria-label="`Enter ${getFormLabelIdentifierPossessive} email address`"
          v-model="credentials.email"
          v-bind:class="{
            'uc-form-text-input-invalid': hasFormValidationError(
              v$.credentials.email
            ),
          }"
          @blur="v$.credentials.email.$touch"
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
          data-testid="student-password-input"
          class="uc-form-text-input"
          type="password"
          placeholder="Create a password"
          aria-label="Create a password"
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
            ? true
            : null
        "
        type="submit"
      >
        Create my account
      </button>
      <p class="terms-text">
        By clicking the button above, you agree to our
        <a href="https://upchieve.org/legal" target="_blank" class="uc-link"
          >User Agreement</a
        >.
      </p>
    </form>
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
  email,
  helpers,
  maxLength,
  minLength,
  required,
  requiredIf,
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
import * as signupUtils from '@/utils/signup-utils'

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
        highSchool: { required: helpers.withMessage('Required', required) }, // @TODO rename highSchool -> school
        zipCode: {
          required: helpers.withMessage('Required', required),
          minLength: helpers.withMessage(
            'Must be 5 characters long',
            minLength(5)
          ),
          maxLength: helpers.withMessage(
            'Must be 5 characters long',
            maxLength(5)
          ),
        },
        studentEmail: {
          required: helpers.withMessage(
            'Required',
            requiredIf(!this.skipEligibilityEmail)
          ),
          email: helpers.withMessage('Not a valid email address', email),
        },
        parentGuardianEmail: {
          required: helpers.withMessage(
            'Required',
            requiredIf(this.useParentGuardianSignUpFlow)
          ),
          email: helpers.withMessage('Not a valid email address', email),
        },
        studentFirstName: {
          required: helpers.withMessage(
            'Required',
            requiredIf(this.useParentGuardianSignUpFlow)
          ),
        },
        studentLastName: {
          required: helpers.withMessage(
            'Required',
            requiredIf(this.useParentGuardianSignUpFlow)
          ),
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
        studentFirstName: '',
        studentLastName: '',
        studentEmail: '',
        parentGuardianEmail: '',
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
      partnerKey: undefined,
      studentPartner: undefined,
      // Reach Studies:
      isCollegeConfidential: false,
      showBigFutureIntroCopy: false,
      showCodeDotOrgIntroCopy: false,
      skipEligibilityEmail: false,
      useParentGuardianSignUpFlow: false,
    }
  },
  async mounted() {
    if (this.$route.params.partner) {
      this.studentPartner = this.$route.params.partner
      this.partnerKey = this.studentPartner.key
    }

    const queryParams = this.$route.query
    if (this.shouldUseParentGuardianSignUpFlow(queryParams)) {
      this.useParentGuardianSignUpFlow = true
    }

    localStorage.removeItem('isSSOSignUpRedirect')
    if (this.isFailureRedirect()) {
      this.eligibility = {
        currentGrade: queryParams['gradeLevel'],
        highSchool: {
          upchieveId: queryParams['schoolId'],
        },
        zipCode: queryParams['zipCode'],
        email: queryParams['email'],
      }
      this.partnerKey = queryParams['studentPartnerOrgKey']
      this.credentials.email = queryParams['email']
      this.errors.push(
        this.$route.query['error'] ??
          'Failed to sign up with Google. Please use password instead.'
      )
      this.step = 'account'
    } else if (this.isReferred) this.step = 'referred'
    else this.eligibilityPage(queryParams)

    if (queryParams['utm_source'] === 'collegeconfidential') {
      this.isCollegeConfidential = true
    }

    if (queryParams['partner']) {
      this.partnerKey = queryParams['partner']

      if (
        this.partnerKey === 'bigfuture' &&
        this.isBfIntroCopyEnabled &&
        this.bfIntroCopy
      ) {
        this.showBigFutureIntroCopy = true
      }
    }

    this.skipEligibilityEmail =
      this.eligibilityEmail && this.partnerKey === 'bigfuture'
    if (this.skipEligibilityEmail) {
      AnalyticsService.captureEvent(EVENTS.SKIPPING_ELIGIBILITY_EMAIL)
    }

    const isDomesticIpAddress = await this.isDomesticIpAddress()
    if (!isDomesticIpAddress) return this.internationalPage()
  },
  computed: {
    ...mapGetters({
      offerGoogleSSO: 'featureFlags/offerGoogleSSO',
      ccIntroCopy: 'featureFlags/ccIntroCopy',
      isBfIntroCopyEnabled: 'featureFlags/isBfIntroCopyEnabled',
      bfIntroCopy: 'featureFlags/bfIntroCopy',
      eligibilityEmail: 'featureFlags/eligibilityEmail',
    }),
    trimCurrentGrade() {
      // extracting the first word out of the gradeLevels
      // example: "8th grade" --> "8th"
      return this.eligibility.currentGrade.split(' ')[0]
    },
    title() {
      if (this.isCollegeStudent)
        return "Oops, looks like you're not a middle or high school student!"
      else return "Sorry, we can't verify your eligibility yet."
    },
    CANNOT_FIND_SCHOOL_TEXT() {
      return `Can't find your school?`
    },
    PASSWORD_PATTERN() {
      return /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/
    },
    customEligibilityHeader() {
      if (this.studentPartner) {
        if (this.isCodeDotOrgStudent) {
          return 'Welcome to UPchieve!'
        }
        return `Welcome ${this.studentPartner.name} ${this.getFormAddressee}!`
      }
      return ''
    },
    isCodeDotOrgStudent() {
      return this.studentPartner?.key === 'code-org'
    },
    getIneligibleCanAppealText() {
      return signupUtils.getIneligibleCanAppealText(
        this.useParentGuardianSignUpFlow
      )
    },
    getFormLabelIdentifierPossessive() {
      return signupUtils.getFormLabelIdentifierPossessive(
        this.useParentGuardianSignUpFlow
      )
    },
    getFormLabelIdentifier() {
      return signupUtils.getFormLabelIdentifier(
        this.useParentGuardianSignUpFlow
      )
    },
    getFormAddressee() {
      return signupUtils.getFormAddressee(this.useParentGuardianSignUpFlow)
    },
  },
  watch: {
    'eligibility.email': function (currentValue, oldValue) {
      if (currentValue && !oldValue) {
        if (!this.hasEnteredEmail)
          AnalyticsService.captureEvent(EVENTS.STUDENT_ENTERED_EMAIL)
        this.hasEnteredEmail = true
      }
    },
    'eligibility.zipCode': function (currentValue, oldValue) {
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
      return !!this.$route.query['provider']
    },

    // Necessary to explicitly call on close of the currentGrade select menu
    // because v-select component is preventing blur event.
    onGradeClose() {
      if (!this.eligibility.currentGrade) {
        this.v$.eligibility.currentGrade.$touch()
      }
    },

    eligibilityPage(params) {
      this.step = 'eligibility'
      const destination = {
        path: `/sign-up/student/eligibility`,
        query: params,
      }
      if (
        this.$route.path !== destination.path &&
        this.$route.query !== destination.query
      )
        this.$router.replace(destination).catch((err) => {
          LoggerService.noticeError(err)
        })
    },

    shouldUseParentGuardianSignUpFlow(params) {
      return Object.keys(params).some((key) => key.trim() === 'parent')
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
      this.$router.replace('/sign-up/student/international')
    },

    async hasEligibilityFormErrors() {
      this.errors = []

      if (!this.eligibility.highSchool.upchieveId) {
        this.errors.push('You must select a school.')
      }

      const zipCode = this.eligibility.zipCode

      const {
        data: { isValidZipCode },
      } = await NetworkService.checkZipCode({ zipCode })
      if (!isValidZipCode) {
        this.errors.push('You must enter a valid United States zip code.')
      }

      if (!this.eligibility.studentEmail && !this.skipEligibilityEmail) {
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
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_CLICKED_CHECK_MY_ELIGIBILITY,
        {
          partnerKey: this.partnerKey,
        }
      )

      // reset error msg from server
      this.msg = ''

      if (await this.hasEligibilityFormErrors()) return

      NetworkService.checkStudentEligibility({
        email: this.eligibility.studentEmail,
        gradeLevel: this.trimCurrentGrade,
        referredByCode: window.localStorage.getItem('upcReferredByCode'),
        schoolId: this.eligibility.highSchool.upchieveId,
        zipCode: this.eligibility.zipCode,
      })
        .then(async (response) => {
          const isEligible = response.data.isEligible
          AnalyticsService.captureEvent(
            isEligible
              ? EVENTS.ELIGIBILITY_ELIGIBLE
              : EVENTS.ELIGIBILITY_INELIGIBLE,
            {
              partnerKey: this.partnerKey,
            }
          )
          if (isEligible) {
            // autofill the user's email
            this.credentials.email = this.eligibility.studentEmail

            // On the parent/guardian flow, eligible users can skip the eligibility screen
            if (this.useParentGuardianSignUpFlow) {
              await AuthService.registerStudent({
                email: this.eligibility.studentEmail,
                firstName: this.eligibility.studentFirstName,
                gradeLevel: this.trimCurrentGrade,
                lastName: this.eligibility.studentLastName,
                parentGuardianEmail: this.eligibility.parentGuardianEmail,
                schoolId: this.eligibility.highSchool.upchieveId,
                studentPartnerOrgKey: this.partnerKey,
                zipCode: this.eligibility.zipCode,
              })
                .then(() => {
                  this.step = 'parentGuardianConfirmation'
                })
                .catch((err) => {
                  this.errors.push(
                    err?.response?.data?.err ?? 'Failed: Please try again.'
                  )
                  if (err?.response?.status !== 422) {
                    LoggerService.noticeError(err)
                  }
                })
            } else {
              this.step = 'eligible'
              this.$router.replace('/sign-up/student/eligible')
            }
          } else {
            if (response.data.isCollegeStudent) this.isCollegeStudent = true
            this.step = 'ineligible'
            this.$router.replace('/sign-up/student/ineligible')
          }
          const isDomesticIpAddress = await this.isDomesticIpAddress()
          if (!isDomesticIpAddress) return this.internationalPage()
        })
        .catch((res) => {
          const error =
            (res.body && (res.body.err || res.body.message)) ||
            'Unknown server error'
          this.errors.push(error)
        })
    },

    async accountPage() {
      this.step = 'account'
      this.$router.replace('/sign-up/student/account')
      const isDomesticIpAddress = await this.isDomesticIpAddress()
      if (!isDomesticIpAddress) return this.internationalPage()
    },

    ineligibleContinue() {
      AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_STUDENT_ACCESS_PAGE)
      window.location = 'https://upchieve.org/request-access'
    },

    autocompleteSchool(input) {
      this.eligibility.highSchool = {}

      return new Promise((resolve) => {
        if (input.length < 3) {
          return resolve([])
        }

        if (!this.hasStartedSearchingForSchool)
          AnalyticsService.captureEvent(EVENTS.STUDENT_SEARCHED_SCHOOL)
        this.hasStartedSearchingForSchool = true

        let cantFindSchoolItem = {
          cantFindSchool: true,
        }

        NetworkService.searchSchool({ query: input })
          .then((response) => response.data.results)
          .then((schools) => {
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

      try {
        await AuthService.registerStudent({
          email: this.credentials.email,
          firstName: this.profile.firstName,
          gradeLevel: this.trimCurrentGrade,
          lastName: this.profile.lastName,
          password: this.credentials.password,
          referredByCode: window.localStorage.getItem('upcReferredByCode'),
          schoolId: this.eligibility.highSchool.upchieveId,
          studentPartnerOrgKey: this.partnerKey,
          zipCode: this.eligibility.zipCode,
        })
        window.localStorage.removeItem('upcReferredByCode')
        this.$router.replace('/verify')
      } catch (e) {
        const errorMsg = e?.response?.data?.err ?? 'Failed: Please try again.'
        this.errors.push(errorMsg)
        if (errorMsg && errorMsg.match(/^Password/))
          AnalyticsService.captureEvent(EVENTS.STUDENT_ENTERED_INVALID_PASSWORD)
        if (e?.response?.status !== 422) {
          LoggerService.noticeError(e)
        }
      } finally {
        this.isSubmittingAccountForm = false
      }
    },
    signUpWithGoogle() {
      AnalyticsService.captureEvent(EVENTS.USER_CLICKED_SIGN_UP_WITH_GOOGLE)
      localStorage.setItem('isSSOSignUpRedirect', true)
      const data = {
        email: this.eligibility.studentEmail,
        gradeLevel: this.trimCurrentGrade,
        isLogin: false,
        provider: 'google',
        referredByCode: window.localStorage.getItem('upcReferredByCode'),
        schoolId: this.eligibility.highSchool.upchieveId,
        studentPartnerOrgKey: this.partnerKey,
        zipCode: this.eligibility.zipCode,
      }
      const params = new URLSearchParams(data).toString()
      const url = `${config.serverRoot}/auth/sso?${params}`
      window.location.replace(url)
    },

    hasFormValidationError(el) {
      return !!el.$errors.length
    },
    cannotSubmitForm(el) {
      return !!el.$errors.length || !!el.$silentErrors.length
    },
    getFormValidationError(el) {
      return el.$errors.map((e) => e.$message).join(', ')
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

  &.below {
    margin-top: 20px;
  }
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
