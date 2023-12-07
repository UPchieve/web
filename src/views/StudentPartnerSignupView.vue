<template>
  <form-page-template>
    <div v-if="!showParentGuardianConfirmationPage" class="uc-form">
      <FormErrors :errors="errors" />

      <h1 v-if="studentPartner.name" class="uc-form-header">
        Welcome {{ studentPartner.name }}
        {{ useParentGuardianSignUpFlow ? `Parent/Guardian!` : `Student!` }}
      </h1>
      <h1 v-else class="uc-form-header">
        Welcome to UPchieve!
      </h1>
      <p v-if="studentPartner.name" class="uc-form-text">
        Not with {{ studentPartner.name }}?
        <router-link class="uc-link" to="/sign-up">Click here</router-link>
      </p>
      <p v-else class="uc-form-text">
        We're a free online tutoring platform for high school students.
      </p>

      <div v-if="useSSO && !useParentGuardianSignUpFlow">
        <div class="uc-form-element">
          <div class="uc-row justify-between">
            <label for="grade">What is your current grade?</label>
          </div>
          <v-select
            id="grade"
            class="uc-form-select-input"
            v-model="sso.currentGrade"
            placeholder="Select your grade"
            aria-label="Select your grade"
            :options="gradeLevels"
            :searchable="false"
            :clearable="false"
            required
          ></v-select>
        </div>
        <button
          class="uc-form-button google"
          @click.prevent="signUpWithGoogle"
          :disabled="isSubmittingForm || !sso.currentGrade"
        >
          <google-logo />
          Sign Up with Google
        </button>
        <p class="terms-text">
          By clicking the button above, you agree to our
          <a href="/legal" target="_blank" class="uc-link">User Agreement</a>.
        </p>
      </div>

      <form v-else @submit.prevent="registerPartnerStudent">
        <div v-if="requirePartnerSite" class="uc-form-element">
          <label
            for="site"
            v-bind:class="{
              error: hasFormValidationError(v$.formData.partnerSite),
            }"
          >
            What is {{ formTextIdentifier }} site?
          </label>
          <v-select
            id="site"
            class="uc-form-select-input"
            v-model="formData.partnerSite"
            :placeholder="`Select ${formTextIdentifier} site`"
            v-bind:class="{
              'uc-form-select-input-invalid': hasFormValidationError(
                v$.formData.partnerSite
              ),
            }"
            :options="studentPartner.sites"
            :searchable="false"
            :clearable="false"
            @close="() => v$.formData.partnerSite.$touch()"
            required
          ></v-select>
        </div>

        <div class="uc-form-element">
          <label
            for="firstName"
            v-bind:class="{
              error: hasFormValidationError(v$.formData.firstName),
            }"
            >What is {{ formTextIdentifier }} first name?
          </label>
          <input
            id="firstName"
            class="uc-form-text-input"
            type="text"
            :placeholder="`Enter ${formTextIdentifier} first name`"
            v-bind:class="{
              'uc-form-text-input-invalid': hasFormValidationError(
                v$.formData.firstName
              ),
            }"
            v-model="formData.firstName"
            @blur="v$.formData.firstName.$touch"
            autocomplete="given-name"
            required
          />
        </div>

        <div class="uc-form-element">
          <label
            for="lastName"
            v-bind:class="{
              error: hasFormValidationError(v$.formData.lastName),
            }"
            >What is {{ formTextIdentifier }} last name?
          </label>
          <input
            id="lastName"
            class="uc-form-text-input"
            type="text"
            :placeholder="`Enter ${formTextIdentifier} last name`"
            v-bind:class="{
              'uc-form-text-input-invalid': hasFormValidationError(
                v$.formData.lastName
              ),
            }"
            v-model="formData.lastName"
            @blur="v$.formData.lastName.$touch"
            autocomplete="family-name"
            required
          />
        </div>

        <div v-if="showHighSchoolCheckbox" class="uc-form-checkbox">
          <input
            id="highSchoolCheckbox"
            v-model="isHighSchoolStudent"
            type="checkbox"
          />
          <label for="highSchoolCheckbox">
            {{ formQuestionIdentifier }} currently a middle or high school
            student?
          </label>
        </div>

        <div v-if="showHighSchoolSelector" class="uc-form-element">
          <label
            for="school"
            v-bind:class="{
              error: hasFormValidationError(v$.formData.schoolId),
            }"
            >What is {{ formTextIdentifier }} school?</label
          >
          <autocomplete
            id="school"
            base-class="uc-form-autocomplete-input"
            :search="autocompleteSchool"
            :placeholder="`Search for ${formTextIdentifier} school`"
            :aria-label="`Search for ${formTextIdentifier} school`"
            :get-result-value="getSchoolDisplayName"
            @submit="handleSelectHighSchool"
            @blur="v$.formData.schoolId.$touch()"
            v-bind:class="{
              'uc-form-autocomplete-input-invalid': hasFormValidationError(
                v$.formData.schoolId
              ),
            }"
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

        <div v-if="showCollegeCheckbox" class="uc-form-checkbox">
          <input
            id="collegeCheckbox"
            v-model="isCollegeStudent"
            type="checkbox"
          />
          <label for="collegeCheckbox">
            {{ formQuestionIdentifier }} currently a college student?
          </label>
        </div>

        <div v-if="showCollegeInput" class="uc-form-element">
          <label
            for="college"
            v-bind:class="{
              error: hasFormValidationError(v$.formData.college),
            }"
            >What is {{ formTextIdentifier }} college?</label
          >
          <input
            id="college"
            class="uc-form-text-input"
            :placeholder="`Enter ${formTextIdentifier} college`"
            type="text"
            v-model="formData.college"
            v-bind:class="{
              'uc-form-text-input-invalid': hasFormValidationError(
                v$.formData.college
              ),
            }"
            @blur="v$.formData.college.$touch"
          />
        </div>

        <div class="uc-form-element">
          <div class="uc-row justify-between">
            <label
              for="email"
              v-bind:class="{
                error: hasFormValidationError(v$.formData.email),
              }"
              >What is {{ formTextIdentifier }} email?</label
            >
            <div
              v-if="hasFormValidationError(v$.formData.email)"
              class="error-caption"
            >
              {{ getFormValidationError(v$.formData.email) }}
            </div>
          </div>
          <input
            id="email"
            class="uc-form-text-input"
            type="email"
            :placeholder="`Enter ${formTextIdentifier} email address`"
            v-model="formData.email"
            v-bind:class="{
              'uc-form-text-input-invalid': hasFormValidationError(
                v$.formData.email
              ),
            }"
            @blur="v$.formData.email.$touch"
            required
          />
        </div>

        <div v-if="useParentGuardianSignUpFlow" class="uc-form-element">
          <div class="uc-row justify-between">
            <label
              for="parent-email"
              v-bind:class="{
                error: hasFormValidationError(v$.formData.parentGuardianEmail),
              }"
              >What is your email?</label
            >
            <div
              v-if="hasFormValidationError(v$.formData.parentGuardianEmail)"
              class="error-caption"
            >
              {{ getFormValidationError(v$.formData.parentGuardianEmail) }}
            </div>
          </div>
          <input
            id="parent-email"
            class="uc-form-text-input"
            type="email"
            placeholder="Enter your email address"
            v-model="formData.parentGuardianEmail"
            v-bind:class="{
              'uc-form-text-input-invalid': hasFormValidationError(
                v$.formData.parentGuardianEmail
              ),
            }"
            @blur="v$.formData.parentGuardianEmail.$touch"
            required
          />
        </div>

        <div v-if="!useParentGuardianSignUpFlow" class="uc-form-element">
          <div class="uc-row justify-between">
            <label
              for="password"
              v-bind:class="{
                error: hasFormValidationError(v$.formData.password),
              }"
              >Create a password</label
            >
            <div
              v-if="hasFormValidationError(v$.formData.password)"
              class="error-caption"
            >
              {{ getFormValidationError(v$.formData.password) }}
            </div>
          </div>
          <input
            id="password"
            class="uc-form-text-input"
            type="password"
            placeholder="Create a password"
            v-model="formData.password"
            v-bind:class="{
              'uc-form-text-input-invalid': hasFormValidationError(
                v$.formData.password
              ),
            }"
            @blur="v$.formData.password.$touch"
            required
          />
          <div
            class="metadata"
            v-bind:class="{
              'metadata error': hasFormValidationError(v$.formData.password),
            }"
          >
            Must have at least one number, one uppercase letter, one lowercase
            letter, and be at least 8 characters long.
          </div>
        </div>

        <div class="uc-form-element" v-if="requireSignupSource">
          <label
            for="signup-source"
            v-bind:class="{
              error: hasFormValidationError(v$.formData.signupSourceId),
            }"
            >How did you hear about us?</label
          >
          <v-select
            id="signup-source"
            class="uc-form-select-input"
            v-bind:class="{
              'uc-form-select-input-invalid': hasFormValidationError(
                v$.formData.signupSourceId
              ),
            }"
            v-model="formData.signupSourceId"
            placeholder="Select how you heard about us"
            :options="signupSourcesOptions"
            label="name"
            :reduce="option => option.id"
            :searchable="false"
            :clearable="false"
            required
            :loading="isLoadingSignupSource"
            @close="() => v$.formData.signupSourceId.$touch()"
          />
        </div>
        <div class="uc-form-element" v-if="shouldShowOtherSignupInput()">
          <label for="other-signup-source">How did you hear about us?</label>
          <input
            id="other-signup-source"
            type="text"
            class="uc-form-text-input"
            v-model="formData.otherSignupSource"
            autofocus
          />
        </div>

        <button
          class="uc-form-button"
          type="submit"
          :disabled="isSignUpButtonDisabled()"
        >
          Sign Up
        </button>
        <p class="terms-text">
          By clicking the button above, you agree to our
          <a href="/legal" target="_blank" class="uc-link">User Agreement</a>.
        </p>
      </form>
    </div>
    <div v-if="showParentGuardianConfirmationPage" class="uc-form">
      <div class="uc-column justify-center items-center h-full center">
        <verification-badge />
        <h1>You're all set!</h1>
        <p>An account for {{ this.formData.firstName }} has been created.</p>
        <p>
          We have sent an email to
          <span id="ph-no-capture">{{ this.formData.email }}</span> to set a
          password.
        </p>
      </div>
    </div>
  </form-page-template>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { email, helpers, required, requiredIf } from '@vuelidate/validators'
import LoggerService from '@/services/LoggerService'
import Autocomplete from '@trevoreyre/autocomplete-vue'

import FormPageTemplate from '@/components/FormPageTemplate.vue'
import FormErrors from '@/components/FormErrors.vue'
import AuthService from '@/services/AuthService'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import { backOff } from 'exponential-backoff'
import { EVENTS, GRADES } from '@/consts'
import GoogleLogo from '@/assets/google_logo.svg'
import config from '../config'
import VerificationBadge from '@/assets/verification.svg'

export default {
  name: 'student-partner-signup-view',
  components: {
    FormPageTemplate,
    FormErrors,
    Autocomplete,
    GoogleLogo,
    VerificationBadge,
  },
  setup() {
    return { v$: useVuelidate() }
  },
  validations() {
    return {
      formData: {
        partnerSite: {
          required: helpers.withMessage(
            'Required',
            requiredIf(() => this.requirePartnerSite)
          ),
        },
        firstName: { required: helpers.withMessage('Required', required) },
        lastName: { required: helpers.withMessage('Required', required) },
        schoolId: {
          required: helpers.withMessage(
            'Required',
            requiredIf(this.showHighSchoolSelector)
          ),
        },
        college: {
          required: helpers.withMessage(
            'Required',
            requiredIf(this.showCollegeInput)
          ),
        },
        email: {
          isValidEmail: helpers.withMessage('Not a valid email address', email),
          required: helpers.withMessage('Required', required),
        },
        password: {
          isPasswordValid: helpers.regex(this.PASSWORD_PATTERN),
          required: helpers.withMessage(
            'Required',
            requiredIf(() => !this.useParentGuardianSignUpFlow)
          ),
        },
        parentGuardianEmail: {
          isValidEmail: helpers.withMessage('Not a valid email address', email),
          required: helpers.withMessage(
            'Required',
            requiredIf(() => this.useParentGuardianSignUpFlow)
          ),
        },
        signupSourceId: {
          required: helpers.withMessage(
            'Required',
            requiredIf(() => this.requireSignupSource)
          ),
        },
      },
    }
  },
  beforeRouteEnter(to, from, next) {
    const partnerId = to.params.partnerId

    NetworkService.getStudentPartner(partnerId)
      .then(res => {
        const studentPartner = res.data.studentPartner
        if (!studentPartner) return next('/sign-up')
        if (studentPartner.deactivated) {
          AnalyticsService.captureEvent(
            EVENTS.STUDENT_VISITED_DEACTIVATED_PARTNER,
            { partner: partnerId }
          )
          return next('/sign-up')
        }
        return next(_this => (_this.studentPartner = studentPartner))
      })
      .catch(err => {
        if (err?.response?.status !== 404) {
          // we shouldn't get 422 here, since semantics of GET request are expected
          // to be correct regardless of user input
          LoggerService.noticeError(err)
        }
        return next('/sign-up')
      })
  },
  async mounted() {
    localStorage.removeItem('isSSOSignUpRedirect')
    const params = this.$route.query
    if (this.shouldUseSSO(params)) {
      this.useSSO = true
    }
    if (this.shouldUseParentGuardianSignUpFlow(params)) {
      this.useParentGuardianSignUpFlow = true
    }
    if (this.isFailureRedirect(params)) {
      this.errors.push(params['error'] || 'Failed to sign up with Google.')
    }
  },
  async created() {
    this.$store.dispatch('app/hideNavigation')
    await this.getSignupSources()
  },
  data() {
    return {
      useSSO: false,
      useParentGuardianSignUpFlow: false,
      showParentGuardianConfirmationPage: false,
      gradeLevels: GRADES,
      sso: {
        currentGrade: '',
      },
      studentPartner: {
        name: '',
        highSchoolSignup: false,
        collegeSignup: false,
        schoolSignupRequired: false,
        sites: [],
      },
      isHighSchoolStudent: false,
      isCollegeStudent: false,
      formData: {
        college: '',
        email: '',
        firstName: '',
        lastName: '',
        otherSignupSource: '',
        partnerSite: undefined,
        password: '',
        parentGuardianEmail: '',
        schoolId: undefined,
        signupSourceId: undefined,
      },
      errors: [],
      serverErrorMsg: '',
      signupSourcesOptions: [],
      isLoadingSignupSource: false,
      isSubmittingForm: false,
    }
  },
  computed: {
    formTextIdentifier() {
      if (this.useParentGuardianSignUpFlow) return 'the student'
      return 'your'
    },
    formQuestionIdentifier() {
      if (this.useParentGuardianSignUpFlow) return 'Is the student'
      return 'Are you'
    },
    PASSWORD_PATTERN() {
      return /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/
    },
    CANNOT_FIND_SCHOOL_TEXT() {
      return `Can't find your school?`
    },
    trimGradeLevel() {
      // extracting the first word out of the gradeLevels
      // example: "8th grade" --> "8th"
      return this.sso.currentGrade.split(' ')[0]
    },

    showHighSchoolCheckbox() {
      // Don't show if high school input is disabled
      if (!this.studentPartner.highSchoolSignup) return false

      // Don't show if high school input is required
      if (this.onlyHighSchoolRequired) return false

      // Only show if high school input is enabled but not required, i.e. optional
      return true
    },

    showHighSchoolSelector() {
      // No high school input
      if (!this.studentPartner.highSchoolSignup) return false

      // Require high school input
      if (this.onlyHighSchoolRequired) return true

      // Optional high school input, so show if the checkbox is selected
      return this.isHighSchoolStudent
    },

    showCollegeCheckbox() {
      // Don't show if high school input is disabled
      if (!this.studentPartner.collegeSignup) return false

      // Don't show if high school input is required
      if (this.onlyCollegeRequired) return false

      // Only show if high school input is enabled but not required, i.e. optional
      return true
    },

    showCollegeInput() {
      // Don't show if college input is disabled
      if (!this.studentPartner.collegeSignup) return false

      // Show if college input is required
      if (this.onlyCollegeRequired) return true

      // Only show if high school input is enabled but not required, i.e. optional
      return this.isCollegeStudent
    },

    requirePartnerSite() {
      return !!this.studentPartner.sites
    },
    requireSignupSource() {
      return this.studentPartner.isManuallyApproved
    },

    onlyHighSchoolRequired() {
      return (
        this.studentPartner.highSchoolSignup &&
        !this.studentPartner.collegeSignup &&
        this.studentPartner.schoolSignupRequired
      )
    },

    onlyCollegeRequired() {
      return (
        this.studentPartner.collegeSignup &&
        !this.studentPartner.highSchoolSignup &&
        this.studentPartner.schoolSignupRequired
      )
    },
  },
  methods: {
    isFailureRedirect(params) {
      return Object.keys(params).includes('error')
    },
    shouldUseSSO(params) {
      return params['sso'] === 'google'
    },
    shouldUseParentGuardianSignUpFlow(params) {
      return 'parent' in params
    },
    autocompleteSchool(input) {
      this.formData.schoolId = undefined

      return new Promise(resolve => {
        if (input.length < 3) {
          return resolve([])
        }

        let cantFindSchoolItem = {
          cantFindSchool: true,
        }

        NetworkService.searchSchool({ query: input })
          .then(response => response.data.results)
          .then(schools => {
            schools.push(cantFindSchoolItem)
            resolve(schools)
          })
      })
    },

    getSchoolDisplayName(school) {
      if (school.cantFindSchool) {
        return this.CANNOT_FIND_SCHOOL_TEXT
      }
      return `${school.name} (${school.city}, ${school.state})`
    },

    handleSelectHighSchool(school) {
      this.formData.schoolId = school.upchieveId
    },
    shouldShowOtherSignupInput() {
      if (this.isLoadingSignupSource || !this.signupSourcesOptions) {
        return false
      }
      const otherOption = this.signupSourcesOptions.find(
        s => s.name === 'Other'
      )
      return otherOption && otherOption.id === this.formData.signupSourceId
    },

    hasFormErrors() {
      this.errors = []

      // If school sign up is required and both student and college options are true the student must select one
      if (
        this.studentPartner.schoolSignupRequired &&
        this.studentPartner.highSchoolSignup &&
        this.studentPartner.collegeSignup &&
        !this.isHighSchoolStudent &&
        !this.isCollegeStudent
      )
        this.errors.push(
          "You must select if you're a high school or college student."
        )

      if (this.isHighSchoolStudent && !this.formData.schoolId) {
        this.errors.push('You must select your high school.')
      }

      if (this.isCollegeStudent && !this.formData.college) {
        this.errors.push('You must enter a college.')
      }

      if (
        this.studentPartner.isManuallyApproved &&
        !this.formData.signupSourceId
      ) {
        this.errors.push('Please select an option for how you heard about us.')
      }

      return !!this.errors.length
    },

    async getSignupSources() {
      this.isLoadingSignupSource = true
      try {
        const res = await backOff(() =>
          NetworkService.getStudentSignupSources()
        )
        this.signupSourcesOptions = res.data.signupSources
      } catch (err) {
        LoggerService.noticeError(err)
      } finally {
        this.isLoadingSignupSource = false
      }
    },

    registerPartnerStudent() {
      this.isSubmittingForm = true

      if (this.hasFormErrors()) {
        return
      }

      AuthService.registerStudent({
        college: this.formData.college,
        email: this.formData.email,
        firstName: this.formData.firstName,
        lastName: this.formData.lastName,
        parentGuardianEmail: this.formData.parentGuardianEmail,
        partnerSite: this.formData.partnerSite,
        password: this.formData.password,
        schoolId: this.formData.schoolId,
        signupSourceId: this.formData.signupSourceId,
        studentPartnerOrg: this.$route.params.partnerId,
        otherSignupSource: this.formData.otherSignupSource,
      })
        .then(() => {
          if (this.useParentGuardianSignUpFlow) {
            this.showParentGuardianConfirmationPage = true
          } else {
            this.$router.push('/verify')
          }
        })
        .catch(err => {
          this.isSubmittingForm = false
          this.errors.push(
            err?.response?.data?.err ?? 'Failed: Please try again.'
          )
          if (err?.response?.status !== 422) {
            LoggerService.noticeError(err)
          }
        })
    },

    signUpWithGoogle() {
      AnalyticsService.captureEvent(
        EVENTS.PARTNER_STUDENT_CLICKED_SIGN_UP_WITH_GOOGLE
      )
      localStorage.setItem('isSSOSignUpRedirect', true)
      const data = {
        studentPartnerOrg: this.studentPartner.key,
        currentGrade: this.trimGradeLevel,
      }
      const dataAsQueryParams = Object.entries(data)
        .map(q => `${q[0]}=${q[1]}`)
        .join('&')
      const url = `${config.serverRoot}/auth/register/google/partner-student?${dataAsQueryParams}`
      window.location.replace(url)
    },

    hasFormValidationError(el) {
      return !!el.$errors.length
    },
    getFormValidationError(el) {
      return el.$errors.map(e => e.$message).join(', ')
    },

    isSignUpButtonDisabled() {
      return (
        this.v$.formData.$errors.length ||
        this.v$.formData.$silentErrors.length ||
        this.isSubmittingForm
      )
    },
  },
}
</script>

<style lang="scss" scoped>
.uc-form-text {
  margin-top: 10px;
}

.uc-form-checkbox {
  margin-top: 10px;
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
