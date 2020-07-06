<template>
  <div class="background-info">
    <h1 class="background-info__header">Background Information</h1>
    <div class="background-info__wrapper">
      <div v-if="hasCompletedBackgroundInfo">
        <p class="background-info__subheader">
          <!-- @todo: copy -->
          Thank you for submitting your background information. Our students,
          and school partners, are interested in learning more about the
          volunteers at UPchieve!
        </p>
      </div>
      <form class="background-info__form" @submit="submitForm" v-else>
        <p class="background-info__subheader">
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
          </li>

          <li class="uc-form-col">
            <p>
              Do you identify with any of the following statements?<span
                class="background-info__question-required"
                >*</span
              >
            </p>
            <p class="background-info__question-description">
              Select all that apply.
            </p>
            <p v-if="showInputErrors && background.length === 0" class="error">
              Please fill out this field.
            </p>

            <div
              class="uc-form-checkbox"
              v-for="option in options.background"
              :key="option"
            >
              <input
                type="checkbox"
                :value="option"
                v-model="background"
                :id="option"
              />
              <label class="uc-form-label" :for="option">
                {{ option }}
              </label>
            </div>
          </li>

          <li class="uc-form-col">
            <label for="linkedin" class="uc-form-label">
              If you have one, please provide us with a link to your LinkedIn
              profile.
            </label>
            <p class="background-info__question-description">(optional)</p>

            <input
              type="text"
              pattern=".*linkedin\.com.*\/in\/.*"
              v-model="linkedInUrl"
              placeholder="linkedin.com/in/example"
              class="linkedin-input uc-form-input"
              id="linkedin"
            />
          </li>

          <li class="uc-form-col">
            <p>
              How much prior tutoring and/or college counseling experience do
              you have?<span class="background-info__question-required">*</span>
            </p>
            <p v-if="showInputErrors && !experience" class="error">
              Please fill out this field.
            </p>

            <div
              v-for="option in options.experience"
              :key="option"
              class="uc-form-radio"
            >
              <input
                type="radio"
                name="experience"
                :value="option"
                v-model="experience"
                :id="option"
              />
              <label class="uc-form-label" :for="option">
                {{ option }}
              </label>
            </div>
          </li>

          <li class="uc-form-col">
            <p>
              Are you proficient in another language?
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
        background: [
          "From a low-income background",
          "Raised by a single parent",
          "First-generation college student",
          "First or second generation immigrant",
          "Belong to a racial/ethnic minority group",
          "Went to a Title 1/low-income high school",
          "Were you eligible for free or reduced-priced lunch"
        ],
        experience: [
          "No prior experience",
          "Less than 6 months",
          "6-12 months",
          "1-2 years",
          "3-5 years",
          "5+ years"
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
      invalidInputs: [],
      occupation: [],
      linkedInUrl: "",
      experience: "",
      background: [],
      languages: [],
      showAddLanguages: false,
      addedLanguages: "",
      wasSubmitted: false
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    hasCompletedBackgroundInfo() {
      return (
        this.user.background &&
        this.user.background.length > 0 &&
        this.user.occupation &&
        this.user.occupation.length > 0 &&
        this.user.experience
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

      const data = {
        occupation: this.occupation,
        experience: this.experience,
        background: this.background,
        languages: this.languages,
        linkedInUrl: this.linkedInUrl
      };

      if (this.languages.length > 0) {
        const languages = Array.from(this.languages);
        if (this.addedLanguages) languages.push(this.addedLanguages);
        data.languages = languages;
      }

      try {
        await NetworkService.addBackgroundInfo(data);
        this.wasSubmitted = false;
        // the mandatory fields to have completed background information
        const update = {
          occupation: data.occupation,
          experience: data.experience,
          background: data.background
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
      return (
        this.background.length === 0 ||
        this.occupation.length === 0 ||
        !this.experience
      );
    }
  }
};
</script>

<style lang="scss" scoped>
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
    margin: 15px 15px 55px 40px;
    @include flex-container(column);
    align-items: stretch;
    background-color: #fff;
    border-radius: 8px;

    @include child-spacing(top, 16px);
    @include child-spacing(right, 0);

    @include breakpoint-above("large") {
      padding: 40px;
      max-width: 70%;

      @include child-spacing(top, 0);
      @include child-spacing(right, 40px);

      @include flex-container(row);
    }
  }

  &__header {
    display: flex;
    margin: 0;
    align-items: center;
    justify-content: space-between;
    font-weight: 500;
    padding: 25px 15px 10px 35px;
    @include font-category("display-small");

    @include breakpoint-above("large") {
      padding: 40px 40px 0 40px;
    }
  }

  &__subheading {
    @include font-category("subheading");
  }

  &__form {
    border-radius: 8px;
    padding: 20px;
    text-align: left;
    max-width: 80%;

    @include breakpoint-above("large") {
      padding: 40px;
    }
  }

  &__question-description {
    @include font-category("helper-text");
    margin-top: 10px;
    color: $c-secondary-grey;
  }

  &__question-required {
    color: $c-information-blue;
  }
}

.linkedin-input {
  width: 100%;

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
</style>
