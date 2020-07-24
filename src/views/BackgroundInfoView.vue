<template>
  <div class="background-info">
    <div class="background-info__wrapper">
      <h1 class="background-info__header">Background Information</h1>
      <div v-if="hasCompletedBackgroundInfo">
        <p class="background-info__completed-message">
          Thank you for submitting your background information. Our students,
          and school partners, are interested in learning more about the
          volunteers at UPchieve!
        </p>
      </div>
      <form class="background-info__form" @submit="submitForm" v-else>
        <p>
          Our students, and school partners, are interested in learning more
          about the volunteers at UPchieve! Please fill in the following
          background information- who knows, it might help us pair you with the
          right student!
        </p>

        <ol>
          <li class="uc-form-col">
            <p>
              I am currently...<span class="background-info__question-required"
                >*</span
              >
            </p>
            <p class="background-info__question-description">
              Select all that apply.
            </p>
            <p v-if="showInputErrors && occupation.length === 0" class="error">
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
                v-model="occupation"
                :id="option"
              />
              <label class="uc-form-label" :for="option">
                {{ option }}
              </label>
            </div>
            <template v-if="isCollegeEducated">
              <label class="uc-form-label occupations-label" for="college"
                >What college/university do you currently attend?</label
              >
              <input
                type="text"
                v-model="college"
                placeholder="Enter a college..."
                class="uc-form-input occupations-input"
                id="college"
              />
            </template>

            <template v-if="isWorkingFullTime">
              <label class="uc-form-label occupations-label" for="company"
                >What company do you currently work at?</label
              >
              <input
                type="text"
                v-model="company"
                placeholder="Enter your company..."
                class="uc-form-input occupations-input"
                id="company"
              />
            </template>
          </li>

          <li class="uc-form-col">
            <p>
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
            />
            <p v-if="!isValidLinkedInUrl" class="error">
              Your url should be in this format:
              https://www.linkedin.com/in/yourname
            </p>
          </li>

          <li class="uc-form-col">
            <p>
              Where do you currently live?<span
                class="background-info__question-required"
                >*</span
              >
            </p>

            <label class="uc-form-label location-label">Country</label>
            <v-select
              class="location-input"
              v-model="country"
              :options="countries"
              :searchable="true"
            />
            <template v-if="country === 'United States of America'">
              <label class="uc-form-label location-label">State</label>
              <v-select
                class="location-input"
                id="state"
                v-model="state"
                :options="states"
                :searchable="true"
              />
            </template>
            <template v-if="country">
              <label class="uc-form-label location-label" for="city"
                >City</label
              >
              <input
                type="text"
                v-model="city"
                placeholder="Enter a city..."
                class="uc-form-input location-input"
                id="city"
              />
            </template>
            <p v-if="showInputErrors && !experience" class="error">
              Please fill out these fields.
            </p>
          </li>

          <li class="uc-form-col">
            <p>
              How much prior experience do you have with the following
              activities?<span class="background-info__question-required"
                >*</span
              >
            </p>
            <p v-if="showInputErrors && !experience" class="error">
              Please fill out this field.
            </p>

            <table class="questions-table">
              <tr class="question-row">
                <div class="position-wrapper">
                  <div class="question-scroll-container">
                    <tr class="radio-question-row">
                      <td class="mobile-remove"></td>
                      <td
                        class="radio-question-selection-title"
                        v-for="title in experienceRadioQuestion.columnTitle"
                        v-bind:key="title"
                      >
                        {{ title }}
                      </td>
                    </tr>
                    <tr
                      class="radio-question-row"
                      v-for="(subquestion,
                      subquestionIndex) in experienceRadioQuestion.options"
                      :key="subquestion"
                    >
                      <td class="radio-question-cell">{{ subquestion }}</td>
                      <td
                        class="radio-question-selection-cell"
                        v-for="index in experienceRadioQuestion.columnTitle
                          .length"
                        :key="index"
                      >
                        <input
                          class="uc-form-input"
                          v-model="
                            experience[
                              experienceRadioQuestion.optionsAlias[
                                subquestionIndex
                              ]
                            ]
                          "
                          type="radio"
                          :value="index"
                        />
                      </td>
                    </tr>
                    <div class="mobile-pinned-questions-container">
                      <tr class="radio-question-row">
                        <td class="mobile-remove mobile-remove--shadow"></td>
                        <td
                          class="radio-question-selection-title radio-question-selection-title--hidden"
                          v-for="title in experienceRadioQuestion.columnTitle"
                          v-bind:key="title"
                        >
                          {{ title }}
                        </td>
                      </tr>
                      <tr
                        class="radio-question-row"
                        v-for="subquestion in experienceRadioQuestion.options"
                        v-bind:key="subquestion"
                      >
                        <td
                          class="radio-question-cell radio-question-cell--shadow"
                        >
                          {{ subquestion }}
                        </td>
                        <td
                          class="radio-question-selection-cell--hidden"
                          v-for="index in experienceRadioQuestion.columnTitle
                            .length"
                          v-bind:key="index"
                        >
                          <input class="uc-form-input" type="radio" />
                        </td>
                      </tr>
                    </div>
                  </div>
                </div>
              </tr>
            </table>
          </li>

          <li class="uc-form-col">
            <p>
              Are there any other languages (besides English) that you would
              feel comfortable tutoring a student in?
            </p>
            <p class="background-info__question-description">
              Select all that apply. (optional)
            </p>

            <div
              class="uc-form-checkbox"
              v-for="option in options.languages"
              :key="option"
            >
              <input
                type="checkbox"
                :value="option"
                v-model="languages"
                :id="option"
              />
              <label class="uc-form-label" :for="option">
                {{ option }}
              </label>
            </div>
            <div class="uc-form-checkbox">
              <input
                type="checkbox"
                value="other"
                id="other"
                @change="toggleAddLanguages"
              />
              <label for="other">Other</label>
            </div>
            <input
              type="text"
              v-model="addedLanguages"
              class=" uc-form-input"
              v-if="showAddLanguages"
              placeholder="Enter a language"
            />
          </li>
        </ol>
        <p class="error form-error" v-if="formError">{{ formError }}</p>
        <button class="uc-form-button submit-btn" :disabled="invalidForm()">
          Submit
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import NetworkService from "@/services/NetworkService";
import { COUNTRIES, STATES } from "@/consts";

export default {
  name: "background-info-view",
  data() {
    return {
      options: {
        occupations: [
          "A high school student",
          "An undergraduate student",
          "A graduate student",
          "Working full-time",
          "Working part-time",
          "Unemployed",
          "Caregiver",
          "Retired"
        ],
        languages: [
          "Spanish",
          "Mandarin",
          "Cantonese",
          "Tagalog",
          "Vietnamese",
          "Arabic",
          "French",
          "Korean",
          "Russian",
          "German"
        ]
      },
      showInputErrors: false,
      formError: "",
      occupation: [],
      linkedInUrl: "",
      experience: {
        tutoring: "",
        collegeCounseling: "",
        mentoring: ""
      },
      languages: [],
      showAddLanguages: false,
      addedLanguages: "",
      wasSubmitted: false,
      country: "",
      state: "",
      city: "",
      college: "",
      company: "",
      experienceRadioQuestion: {
        columnTitle: [
          "No prior experience",
          "0-1 years",
          "1-2 years",
          "2-5 years",
          "5+ years"
        ],
        options: ["Tutoring", "College Counseling", "Mentoring"],
        optionsAlias: ["tutoring", "collegeCounseling", "mentoring"]
      }
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    hasCompletedBackgroundInfo() {
      return (
        this.user.occupation &&
        this.user.occupation.length > 0 &&
        this.user.country
      );
    },
    countries() {
      return COUNTRIES;
    },
    states() {
      return STATES;
    },
    isUnitedStatesSelected() {
      return this.country === "United States of America";
    },
    linkedInUrlPattern() {
      return /https?:\/\/(www\.)?linkedin\.com.*\/in\/.{1,}$/;
    },
    isValidLinkedInUrl() {
      if (!this.linkedInUrl) return true;
      return this.linkedInUrlPattern.test(this.linkedInUrl);
    },
    isCollegeEducated() {
      return (
        this.occupation.includes("An undergraduate student") ||
        this.occupation.includes("A graduate student")
      );
    },
    isWorkingFullTime() {
      return (
        this.occupation.includes("Working full-time") &&
        !this.user.volunteerPartnerOrg
      );
    }
  },
  methods: {
    async submitForm(event) {
      event.preventDefault();

      this.showInputErrors = false;
      this.formError = "";

      if (this.wasSubmitted) return;
      if (this.invalidForm()) {
        this.showInputErrors = true;
        this.formError = "Please answer the required fields above.";
        return;
      }
      this.wasSubmitted = true;

      const { tutoring, collegeCounseling, mentoring } = this.experience;
      const { columnTitle } = this.experienceRadioQuestion;
      const experience = {
        tutoring: columnTitle[tutoring - 1],
        collegeCounseling: columnTitle[collegeCounseling - 1],
        mentoring: columnTitle[mentoring - 1]
      };

      const data = {
        occupation: this.occupation,
        experience,
        languages: this.languages,
        linkedInUrl: this.linkedInUrl,
        country: this.country,
        state: this.isUnitedStatesSelected ? this.state : "",
        city: this.city,
        college: this.college,
        company: this.company
      };

      if (this.languages.length > 0) {
        const languages = Array.from(this.languages);
        if (this.addedLanguages) languages.push(this.addedLanguages);
        data.languages = languages;
      }

      try {
        await NetworkService.addBackgroundInfo(data);
        this.wasSubmitted = false;

        // mandatory fields: occupation, experience, country / state / city,
        // update is a subset of mandatory fields
        const update = {
          occupation: data.occupation,
          country: data.country
        };

        this.$store.dispatch("user/addToUser", update);
      } catch (error) {
        this.formError = "Sorry, we had some trouble saving your information.";
        this.wasSubmitted = false;
      }
    },
    toggleAddLanguages() {
      this.showAddLanguages = !this.showAddLanguages;
    },
    invalidForm() {
      const { tutoring, collegeCounseling, mentoring } = this.experience;

      return (
        this.occupation.length === 0 ||
        !tutoring ||
        !collegeCounseling ||
        !mentoring ||
        !this.country ||
        !this.city ||
        (this.isUnitedStatesSelected && !this.state) ||
        !this.isValidLinkedInUrl ||
        (this.isCollegeEducated && !this.college) ||
        (this.isWorkingFullTime && !this.company)
      );
    }
  }
};
</script>

<style lang="scss" scoped>
input:invalid {
  border-bottom: $c-error-red solid 3px;
}

ol {
  padding-inline-start: 30px;
  @include breakpoint-above("medium") {
    padding-inline-start: 40px;
  }
}

.uc-form-checkbox {
  margin-bottom: 0.6em;

  & label {
    @include font-category("body");
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
  @include font-category("body");

  &__wrapper {
    max-width: 100%;
    background-color: #fff;
    border-radius: 8px;

    @include breakpoint-above("medium") {
      padding: 40px;
      max-width: 90%;
      margin: 15px 15px 55px 40px;
    }

    @include breakpoint-above("large") {
      max-width: 800px;
    }
  }

  &__header {
    margin: 0;
    text-align: left;
    font-weight: 500;
    padding: 40px 20px 20px 20px;
    @include font-category("display-small");

    @include breakpoint-above("medium") {
      padding: 20px;
    }
  }

  &__completed-message {
    padding: 1em;
  }

  &__form {
    border-radius: 8px;
    padding: 20px;
    text-align: left;
    max-width: 95%;

    @include breakpoint-above("large") {
      max-width: 80%;
    }
  }

  &__question-description {
    @include font-category("helper-text");
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

  @include breakpoint-above("medium") {
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

  @include breakpoint-above("medium") {
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

  @include breakpoint-above("medium") {
    width: 100%;
    padding: 4em;
  }
}

.questions-table {
  width: 100%;
  font-size: 13px;
  display: inline-block;

  @include breakpoint-above("large") {
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

    @include breakpoint-above("medium") {
      box-shadow: 5px 0 5px -1px #e0e0e0;
    }

    @include breakpoint-above("large") {
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

    @include breakpoint-above("medium") {
      box-shadow: none;
    }
  }
}
</style>
