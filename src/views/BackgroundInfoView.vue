<template>
  <div class="background-info">
    <div class="background-info__wrapper">
      <h1
        class="background-info__header"
        data-testid="background-information-header"
      >
        Background Information
      </h1>
      <div v-if="hasCompletedBackgroundInfo" class="complete">
        <p data-testid="bg-info-complete">
          Thank you for submitting your background information!<br />
        </p>
        <Callout v-if="showRemovedFromNTHSMessage" variant="information">
          <template v-slot:content>
            Your responses in this form indicate that you are not currently a
            high school student. Don't worry— you can still volunteer! However,
            we have removed you from your National Tutoring Honors Society
            chapter since that program is for current high school students only.
          </template>
        </Callout>
        <LargeButton
          variant="primary"
          data-testid="bg-info-complete-button"
          class="continue-onboarding-btn"
          :showArrow="false"
          @click="goToDashboard"
          >Continue Onboarding</LargeButton
        >
      </div>
      <form
        class="background-info__form"
        @submit="submitForm"
        v-else
        autocomplete="off"
      >
        <p data-testid="background-information-explainer">
          Please provide some basic background information so that we can learn
          more about you! Don't worry: this information will be kept private
          unless we receive your permission to share it.
        </p>

        <ol>
          <li v-if="signedUpWithGoogle" class="uc-form-col">
            <p>
              How did you hear about us?
              <span class="background-info__question-required">*</span>
            </p>
            <FormSelect
              data-testid="signupSourceField"
              name="signup-source"
              v-model="signupSourceId"
              :options="signupSourcesOptions"
              option-text-field="name"
              :is-required="true"
              :reduce="(option) => option.id"
            />
            <div class="uc-column" v-if="shouldShowOtherSignupInput">
              <input
                id="otherSignupSource"
                data-testid="otherSignupSource"
                type="text"
                class="uc-form-input"
                v-model="otherSignupSource"
                v-bind:class="{
                  'uc-form-input--invalid':
                    invalidInputs.indexOf('otherSignupSource') > -1,
                }"
                placeholder="Tell us where you heard about us!"
                autofocus
                autocomplete="off"
              />
            </div>
          </li>

          <li class="uc-form-col">
            <p data-testid="question-where-do-you-live">
              Where do you currently live?<span
                class="background-info__question-required"
                >*</span
              >
            </p>

            <label class="uc-form-label location-label"
              >Country<span class="background-info__question-required"
                >*</span
              ></label
            >
            <FormSearchableSelect
              name="country-select"
              class="location-input"
              v-model="country"
              :options="countries"
              data-testid="location-input"
              isRequired="true"
            />
            <template v-if="isUnitedStatesSelected">
              <label class="uc-form-label location-label"
                >State<span class="background-info__question-required"
                  >*</span
                ></label
              >
              <FormSearchableSelect
                class="location-input"
                name="state-select"
                id="state"
                v-model="state"
                :options="states"
                :searchable="true"
                data-testid="state-select"
                isRequired="true"
              />
            </template>
            <template v-if="country">
              <label class="uc-form-label location-label" for="city"
                >City<span class="background-info__question-required"
                  >*</span
                ></label
              >
              <input
                type="text"
                v-model="city"
                placeholder="Enter a city..."
                class="uc-form-input location-input"
                id="city"
                data-testid="city-input"
                autocomplete="off"
              />
            </template>
            <p v-if="showInputErrors" class="error">
              Please fill out these fields.
            </p>
          </li>

          <li class="uc-form-col">
            <p data-testid="question-i-am-currently">
              I am currently...<span class="background-info__question-required"
                >*</span
              >
            </p>
            <p class="background-info__question-description">
              Select all that apply.
            </p>
            <p v-if="showInputErrors && occupations.length === 0" class="error">
              Please fill out this field.
            </p>
            <div
              class="uc-form-checkbox"
              v-for="option in options.occupations"
              :key="option"
            >
              <input
                type="checkbox"
                :value="option"
                v-model="occupations"
                :id="option"
                :data-testid="option"
              />
              <label class="uc-form-label" :for="option">
                {{ option }}
              </label>
            </div>
            <template v-if="isCollegeEducated">
              <label class="uc-form-label occupations-label" for="college"
                >What college/university do you currently attend?<span
                  class="background-info__question-required"
                  >*</span
                ></label
              >
              <input
                type="text"
                v-model="college"
                placeholder="Enter a college..."
                class="uc-form-input occupations-input"
                id="college"
                autocomplete="off"
              />
            </template>

            <template v-if="isWorkingFullTime">
              <label class="uc-form-label occupations-label" for="company"
                >What company do you currently work at?<span
                  class="background-info__question-required"
                  >*</span
                ></label
              >
              <input
                type="text"
                v-model="company"
                placeholder="Enter your company..."
                class="uc-form-input occupations-input"
                id="company"
                autocomplete="off"
              />
            </template>
          </li>

          <li v-if="isInHighSchool">
            <p data-testid="grade-level-question" class="uc-form-label">
              What grade will you be in during the
              {{ getAcademicYear().asString }} academic year?<span
                class="background-info__question-required"
                >*</span
              >
            </p>
            <GradeLevelSelect v-model="gradeLevel" />
          </li>

          <li class="uc-form-col">
            <p data-testid="question-linkedin-profile">
              If you have one, please provide us with a link to your LinkedIn
              profile.
            </p>
            <p class="background-info__question-description">(optional)</p>

            <input
              type="text"
              :pattern="linkedInUrlPattern.source"
              v-model="linkedInUrl"
              placeholder="https://www.linkedin.com/in/yourname"
              class="linkedin-input uc-form-input"
              id="linkedin"
              data-testid="linked-in-input"
              autocomplete="off"
            />
            <p v-if="!isValidLinkedInUrl" class="error">
              Your url should be in this format:
              https://www.linkedin.com/in/yourname
            </p>
          </li>

          <li v-if="signedUpWithGoogle" class="uc-form-col">
            <label for="phoneNumber" class="uc-form-label"
              >Cell Phone Number<span class="background-info__question-required"
                >*</span
              ></label
            >
            <maz-phone-number-input
              id="phoneNumber"
              data-testid="phoneNumberField"
              class="phone-input"
              :required="true"
              show-code-on-list
              @update="onPhoneInputUpdate"
              v-model="phoneNumber"
            />
            <p class="uc-form-subtext">
              UPchieve notifies volunteers of incoming student requests via
              text. You can customize when you receive requests.
            </p>
          </li>
        </ol>
        <p class="error form-error" v-if="formError">{{ formError }}</p>
        <button
          class="uc-form-button submit-btn"
          type="submit"
          :disabled="invalidForm() ? true : null"
          data-testid="submit-bg-info"
        >
          Submit
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import { COUNTRIES, STATES, EVENTS } from '@/consts'
import LoggerService from '@/services/LoggerService'
import LargeButton from '@/components/LargeButton.vue'
import { backOff } from 'exponential-backoff'
import MazPhoneNumberInput from 'maz-ui/components/MazPhoneNumberInput'
import { isEmpty } from 'lodash-es'
import Callout from '@/components/Callout.vue'
import { VolunteerOccupations } from '@/services/VolunteerService'
import FormSearchableSelect from '@/components/FormInputs/FormSearchableSelect.vue'
import GradeLevelSelect from '@/components/GradeLevelSelect.vue'
import { getAcademicYear } from '../utils/academic-year'
import FormSelect from '@/components/FormInputs/FormSelect.vue'

export default {
  name: 'background-info-view',
  components: {
    GradeLevelSelect,
    FormSearchableSelect,
    Callout,
    LargeButton,
    MazPhoneNumberInput,
    FormSelect,
  },
  data() {
    return {
      options: {
        occupations: VolunteerOccupations,
      },
      showInputErrors: false,
      formError: '',
      occupations: [],
      linkedInUrl: '',
      wasSubmitted: false,
      country: '',
      state: '',
      city: '',
      college: '',
      company: '',
      signupSourceId: '',
      signupSourcesOptions: [],
      otherSignupSource: '',
      isLoadingSignupSources: false,
      invalidInputs: [],
      phoneInputData: {},
      phoneNumber: '',
      showRemovedFromNTHSMessage: false,
      gradeLevel: '',
    }
  },
  async beforeMount() {
    await this.getSignupSources()
  },
  computed: {
    isInHighSchool() {
      return this.occupations.includes(VolunteerOccupations.HIGH_SCHOOL_STUDENT)
    },
    ...mapState({
      user: (state) => state.user.user,
    }),
    ...mapGetters({
      isStudentVolunteer: 'user/isStudentVolunteer',
    }),
    hasCompletedBackgroundInfo() {
      return (
        Object.hasOwn(this.user, 'occupation') &&
        this.user.occupation.length > 0 &&
        Object.hasOwn(this.user, 'country') &&
        this.user.country.length > 0
      )
    },
    countries() {
      return COUNTRIES
    },
    states() {
      return STATES
    },
    isUnitedStatesSelected() {
      return this.country === 'United States of America'
    },
    linkedInUrlPattern() {
      return /https?:\/\/(www\.)?linkedin\.com.*\/in\/.{1,}$/
    },
    isValidLinkedInUrl() {
      if (!this.linkedInUrl) return true
      return this.linkedInUrlPattern.test(this.linkedInUrl)
    },
    isCollegeEducated() {
      return (
        this.occupations.includes('An undergraduate student') ||
        this.occupations.includes('A graduate student')
      )
    },
    isWorkingFullTime() {
      return (
        this.occupations.includes('Working full-time') &&
        !this.user.volunteerPartnerOrg
      )
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
    signedUpWithGoogle() {
      return !isEmpty(this.user.issuers)
    },
  },
  methods: {
    getAcademicYear,
    goToDashboard() {
      this.$router.push('/dashboard')
    },
    onPhoneInputUpdate(newData) {
      this.phoneInputData = newData
    },
    async getSignupSources() {
      this.isLoadingSignupSources = true
      try {
        const response = await backOff(() =>
          NetworkService.getStudentSignupSources()
        )
        let allSources = response.data.signupSources

        // volunteer sources drop School/Teacher and replace Friend/Classmate with Friend
        allSources = allSources
          .filter((source) => source.name !== 'School / Teacher')
          .map((source) => {
            if (source.name === 'Friend / Classmate') {
              source.name = 'Friend'
            }
            return source
          })

        this.signupSourcesOptions = allSources
      } catch (err) {
        LoggerService.noticeError(err)
      } finally {
        this.isLoadingSignupSources = false
      }
    },

    async submitForm(event) {
      event.preventDefault()

      this.showInputErrors = false
      this.formError = ''

      if (this.wasSubmitted) return
      if (this.invalidForm()) {
        this.showInputErrors = true
        this.formError = 'Please answer the required fields above.'
        return
      }
      this.wasSubmitted = true

      const data = {
        occupation: this.occupations,
        linkedInUrl: this.linkedInUrl,
        country: this.country,
        state: this.isUnitedStatesSelected ? this.state : '',
        city: this.city,
        college: this.college,
        company: this.company,
        phoneNumber: this.phoneNumber,
        signupSourceId: this.signupSourceId,
        otherSignupSource: this.otherSignupSource,
        gradeLevel: this.isInHighSchool ? this.gradeLevel : undefined, // only send up if HS occupation remains selected
      }

      try {
        const response = await NetworkService.addBackgroundInfo(data)
        if (response.data?.wasRemovedFromNTHS) {
          this.showRemovedFromNTHSMessage = true
          await this.$store.commit('nths/setNTHSGroups', [])
        }
        AnalyticsService.captureEvent(EVENTS.BACKGROUND_INFORMATION_COMPLETED, {
          event: EVENTS.BACKGROUND_INFORMATION_COMPLETED,
        })
        if (this.isStudentVolunteer)
          AnalyticsService.captureEvent(
            EVENTS.ROLE_SWITCHING_USER_COMPLETED_BACKGROUND_INFO_FORM
          )

        if (this.user.volunteerPartnerOrg)
          AnalyticsService.captureEvent(EVENTS.ACCOUNT_APPROVED, {
            event: EVENTS.ACCOUNT_APPROVED,
          })

        // mandatory fields: occupation, country / state / city
        // update is a subset of mandatory fields
        const update = {
          occupation: data.occupation,
          country: data.country,
          gradeLevel: data.gradeLevel ?? this.user.gradeLevel ?? '',
        }
        await this.$store.dispatch('user/addToUser', update)
      } catch (error) {
        LoggerService.noticeError(error)
        AnalyticsService.captureEvent(EVENTS.BACKGROUND_INFORMATION_ERROR, {
          error: error?.message,
        })
        this.formError = 'Sorry, we had some trouble saving your information.'
        this.wasSubmitted = false
      }
    },
    invalidForm() {
      return (
        this.occupations.length === 0 ||
        (this.signedUpWithGoogle &&
          (!this.phoneInputData.isValid || !this.signupSourceId)) ||
        !this.country ||
        !this.city ||
        (this.isUnitedStatesSelected && !this.state) ||
        !this.isValidLinkedInUrl ||
        (this.isCollegeEducated && !this.college) ||
        (this.isWorkingFullTime && !this.company) ||
        (this.isInHighSchool && !this.gradeLevel) ||
        (this.shouldShowOtherSignupInput && !this.otherSignupSource)
      )
    },
  },
}
</script>

<style lang="scss" scoped>
input:invalid {
  border-bottom: $c-error-red solid 3px;
}

ol {
  padding-inline-start: 30px;
  @include breakpoint-above('medium') {
    padding-inline-start: 40px;
  }
}

.uc-form-checkbox {
  margin-bottom: 0.6em;

  & label {
    @include font-category('body');
  }
}

.uc-form-col {
  margin: 4em 0;
}

.uc-form-radio {
  margin-bottom: 0.6em;

  & label {
    margin-left: 15px;
  }
}

textarea {
  width: 100%;
  height: 80px;
}

.background-info {
  @include font-category('body');

  &__wrapper {
    max-width: 100%;
    background-color: #fff;
    border-radius: 8px;

    @include breakpoint-above('medium') {
      padding: 40px;
      max-width: 90%;
      margin: 15px 15px 55px 40px;
    }

    @include breakpoint-above('large') {
      max-width: 800px;
    }
  }

  &__header {
    margin: 0;
    text-align: left;
    font-weight: 500;
    padding: 40px 20px 20px 20px;
    @include font-category('display-small');

    @include breakpoint-above('medium') {
      padding: 20px;
    }
  }

  &__form {
    border-radius: 8px;
    padding: 20px;
    text-align: left;
    max-width: 95%;

    @include breakpoint-above('large') {
      max-width: 80%;
    }
  }

  &__question-description {
    @include font-category('helper-text');
    margin-top: 10px;
    color: $c-secondary-grey;
  }

  &__question-required {
    color: $c-error-red;
  }
}

.location-label,
.occupations-label {
  display: block;
  margin-top: 1.4em;
  margin-bottom: 0.5em;
}

.linkedin-input,
.location-input,
.occupations-input {
  width: 90%;

  @include breakpoint-above('medium') {
    width: 80%;
  }
}

.submit-btn {
  width: 200px;
}

.error {
  color: $c-error-red;
}

.form-error {
  margin-bottom: 2em;
}

.question-row {
  overflow: hidden;
  width: 100%;
  display: inline-block;
  margin-bottom: 4em;

  @include breakpoint-above('medium') {
    width: 100%;
  }
}

.question-scroll-container {
  overflow-x: auto;
}

.position-wrapper {
  position: relative;
}

.mobile-pinned-questions-container {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  pointer-events: none;
}

.questions-container {
  padding: 1em;
  width: 100%;
  width: 100vw;

  @include breakpoint-above('medium') {
    width: 100%;
    padding: 4em;
  }
}

.questions-table {
  width: 100%;
  font-size: 13px;
  display: inline-block;

  @include breakpoint-above('large') {
    display: table;
    font-size: 15px;
  }
}

.radio-question-row:nth-child(even) {
  background: #f1f8fc;
}

.radio-question-row:nth-child(odd) {
  background: #e5f2fc;
}

.radio-question-row:nth-child(1) {
  background: white;
}

.radio-question-cell {
  width: 175px;
  padding: 1.4em 1.2em 1.6em 1em;

  &--shadow {
    box-shadow: 5px 0 5px -1px #e0e0e0;

    @media screen and (min-width: 620px) and (max-width: 770px) {
      box-shadow: none;
    }

    @include breakpoint-above('medium') {
      box-shadow: 5px 0 5px -1px #e0e0e0;
    }

    @include breakpoint-above('large') {
      box-shadow: none;
    }
  }
}

.radio-question-selection-title {
  display: table-cell;
  padding-left: 14px;
  padding-right: 14px;
  text-align: center;
  vertical-align: middle;
  padding-top: 8px;
  padding-bottom: 15px;

  &--hidden {
    visibility: hidden;
  }
}

.radio-question-selection-cell {
  text-align: center;
  vertical-align: middle;

  &--hidden {
    display: none;
  }
}

.mobile-remove {
  &--shadow {
    box-shadow: 5px 0 5px -1px #ffffff;

    @include breakpoint-above('medium') {
      box-shadow: none;
    }
  }
}

.complete {
  display: flex;
  flex-direction: column;
  padding: 1em;
  align-items: center;
  gap: 16px;

  .continue-onboarding-btn {
    width: fit-content;
    margin-top: 16px;
  }
}
</style>
