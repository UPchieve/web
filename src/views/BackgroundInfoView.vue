<template>
  <div class="background-info">
    <h1 class="background-info__header">Background Information</h1>
    <div class="background-info__wrapper">
      <div v-if="hasCompletedBackgroundInfo">
        <p class="background-info__completed-message">
          <!-- @todo: copy -->
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
            <p>
              If you have one, please provide us with a link to your LinkedIn
              profile.
            </p>
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
              Where do you currently live?<span
                class="background-info__question-required"
                >*</span
              >
            </p>

            <label class="uc-form-label location-label">Country</label>
            <select
              class="uc-form-select location-input"
              onfocus="this.size=10;"
              onblur="this.size=1;"
              onchange="this.size=1; this.blur();"
              v-model="country"
            >
              <option selected disabled value="">Select a country...</option>
              <option
                v-for="country in countries"
                :key="country"
                :value="country"
                >{{ country }}</option
              ></select
            >
            <template v-if="country === 'United States of America'">
              <label class="uc-form-label location-label">State</label>
              <select
                class="uc-form-select location-input"
                onfocus="this.size=10;"
                onblur="this.size=1;"
                onchange="this.size=1; this.blur();"
                v-model="state"
              >
                <option selected disabled value="">Select a state...</option>
                <option v-for="state in states" :key="state" :value="state">{{
                  state
                }}</option>
              </select>
            </template>
            <template v-if="country">
              <label class="uc-form-label location-label">City</label>
              <input
                type="text"
                v-model="city"
                placeholder="Enter a city..."
                class="uc-form-input location-input"
              />
            </template>
            <p v-if="showInputErrors && !experience" class="error">
              Please fill out these fields.
            </p>
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
        background: [
          "I went to a public high school.",
          "I was eligible for free or reduced price lunch at school..",
          "My parent(s) never attended college.",
          "I was raised by a single parent.",
          "English was not my first language.",
          "I am a first or second generation immigrant.",
          "None of the above."
        ],
        experience: [
          "No prior experience",
          "0-1 years",
          "1-2 years",
          "2-5 years",
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
      occupation: [],
      linkedInUrl: "",
      experience: "",
      background: [],
      languages: [],
      showAddLanguages: false,
      addedLanguages: "",
      wasSubmitted: false,
      country: "",
      state: "",
      city: ""
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
    },
    countries() {
      return COUNTRIES;
    },
    states() {
      return STATES;
    },
    isUnitedStatesSelected() {
      return this.country === "United States of America";
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
        linkedInUrl: this.linkedInUrl,
        country: this.country,
        state: this.isUnitedStatesSelected ? this.state : "",
        city: this.city
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
        !this.experience ||
        !this.country ||
        !this.city ||
        (this.isUnitedStatesSelected && !this.state)
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
    margin: 15px;
    background-color: #fff;
    border-radius: 8px;

    @include breakpoint-above("medium") {
      padding: 40px;
      max-width: 90%;
      margin: 15px 15px 55px 40px;
    }

    @include breakpoint-above("large") {
      max-width: 70%;
    }
  }

  &__header {
    display: flex;
    margin: 0;
    align-items: center;
    justify-content: space-between;
    font-weight: 500;
    padding: 25px 15px 10px 15px;
    @include font-category("display-small");

    @include breakpoint-above("medium") {
      padding: 40px 40px 0 40px;
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

.location-label {
  display: block;
  margin-top: 1.4em;
  margin-bottom: 0.5em;
}

.linkedin-input,
.location-input {
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
</style>
