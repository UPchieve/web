<template>
  <form-page-template>
    <div class="uc-form">
      <div class="uc-form-header">
        <router-link to="/login" class="uc-form-header-link"
          >Log In</router-link
        >
        <div class="uc-form-header-link--active">Sign Up</div>
      </div>

      <form
        v-if="formStep === 'step-1'"
        class="uc-form-body"
        @submit.prevent="formStepTwo()"
      >
        <div v-if="errors.length" class="step-errors">
          <h5>Please correct the following problems:</h5>
          <ul>
            <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
          </ul>
        </div>

        <div class="step-header">
          <div class="step-header__title">
            <span v-if="studentPartner.name"
              >Welcome {{ studentPartner.name }} Student!</span
            >
            <span v-else>Welcome to UPchieve!</span>
          </div>
          <div class="step-header__subtitle">
            <span v-if="studentPartner.name"
              >Not with {{ studentPartner.name }}?
              <router-link to="/sign-up">Click here</router-link></span
            >
            <span v-else
              >We're a free online tutoring platform for HS students</span
            >
          </div>
        </div>

        <div v-if="requirePartnerSite" class="uc-column">
          <label for="inputSite" class="uc-form-label"
            >Which site do you belong to?</label
          >
          <v-select
            id="inputSite"
            class="uc-form-select"
            v-bind:class="{
              'uc-form-select--invalid': invalidInputs.indexOf('inputSite') > -1
            }"
            v-model="formData.partnerSite"
            :options="studentPartner.sites"
            :searchable="false"
            :clearable="false"
            required
          />
        </div>

        <div class="uc-column">
          <label for="inputEmail" class="uc-form-label"
            >What's your email?</label
          >
          <input
            id="inputEmail"
            type="email"
            class="uc-form-input"
            v-bind:class="{
              'uc-form-input--invalid': invalidInputs.indexOf('inputEmail') > -1
            }"
            v-model="formData.email"
            required
            autofocus
            autocomplete="email"
          />
        </div>

        <div class="uc-column">
          <label for="inputEmail" class="uc-form-label"
            >Create a password</label
          >
          <input
            id="inputPassword"
            type="password"
            class="uc-form-input"
            v-bind:class="{
              'uc-form-input--invalid':
                invalidInputs.indexOf('inputPassword') > -1
            }"
            v-model="formData.password"
            required
            autocomplete="new-password"
          />
          <p class="uc-form-subtext">
            Must contain at least one number, one uppercase letter, and one
            lowercase letter.
          </p>
        </div>

        <button
          class="uc-form-button"
          type="submit"
          @click.prevent="formStepTwo()"
        >
          Continue
        </button>

        <div v-if="serverErrorMsg !== ''">{{ serverErrorMsg }}</div>
      </form>
      <form
        v-if="formStep === 'step-2'"
        class="uc-form-body"
        @submit.prevent="submitSignupForm()"
      >
        <div v-if="errors.length" class="step-errors">
          <h5>Please correct the following problems:</h5>
          <ul>
            <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
          </ul>
        </div>

        <div class="step-header">
          <div class="step-header__title">Finish creating your account</div>
          <div class="step-header__subtitle">
            You're moments away from unlimited free tutoring!
          </div>
        </div>

        <!-- Fix for bug in Chrome where the first two fields are parsed as a username and password
        even if the HTML5 autocomplete attributes are set to the right values -->
        <label for="username" class="d-none">Username</label>
        <input
          type="text"
          class="d-none"
          id="username"
          v-model="formData.email"
          autocomplete="username"
        />
        <label for="password" class="d-none">Password</label>
        <input
          type="password"
          class="d-none"
          id="password"
          v-model="formData.password"
          autocomplete="new-password"
        />

        <div class="uc-column">
          <label for="firstName" class="uc-form-label">First Name</label>
          <input
            id="firstName"
            type="text"
            class="uc-form-input"
            v-bind:class="{
              'uc-form-input--invalid': invalidInputs.indexOf('firstName') > -1
            }"
            v-model="formData.firstName"
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
              'uc-form-input--invalid': invalidInputs.indexOf('lastName') > -1
            }"
            v-model="formData.lastName"
            required
            autocomplete="family-name"
          />
        </div>

        <div v-if="showHighSchoolCheckbox" class="uc-form-checkbox">
          <input
            id="highSchoolCheckbox"
            v-model="isHighSchoolStudent"
            type="checkbox"
          />
          <label for="highSchoolCheckbox">
            Are you currently a high school student?
          </label>
        </div>

        <div v-if="showHighSchoolSelector" class="uc-column">
          <label for="inputHighschool" class="uc-form-label"
            >High School Name</label
          >

          <div class="school-search">
            <autocomplete
              id="inputHighschool"
              class="school-search__autocomplete"
              :search="autocompleteSchool"
              :get-result-value="getSchoolDisplayName"
              base-class="uc-autocomplete"
              auto-select
              placeholder="Search for your high school"
              aria-label="Search for your high school"
              @submit="handleSelectHighSchool"
            ></autocomplete>

            <div v-if="noHighSchoolResults" class="school-search__no-results">
              <a href="https://upchieve.org/cant-find-school" target="_blank">
                Can't find your high school?
              </a>
            </div>
          </div>
        </div>

        <div v-if="showCollegeCheckbox" class="uc-form-checkbox">
          <input
            id="collegeCheckbox"
            v-model="isCollegeStudent"
            type="checkbox"
          />
          <label for="collegeCheckbox">
            Are you currently a college student?
          </label>
        </div>

        <div v-if="showCollegeInput" class="uc-column">
          <label for="college" class="uc-form-label">College</label>
          <input
            id="college"
            type="text"
            class="uc-form-input"
            v-model="formData.college"
          />
        </div>

        <div class="uc-form-checkbox">
          <input
            id="userAgreement"
            v-model="formData.terms"
            type="checkbox"
            required
          />
          <label for="userAgreement">
            I have read and accept the
            <a href="/legal" target="_blank">user agreement</a>.
          </label>
        </div>

        <button class="uc-form-button" type="submit">
          Sign Up
        </button>

        <div v-if="serverErrorMsg !== ''">{{ serverErrorMsg }}</div>
      </form>
    </div>
  </form-page-template>
</template>

<script>
import validator from "validator";
import * as Sentry from "@sentry/browser";
import Autocomplete from "@trevoreyre/autocomplete-vue";

import FormPageTemplate from "@/components/FormPageTemplate";
import AuthService from "@/services/AuthService";
import NetworkService from "@/services/NetworkService";

export default {
  name: "student-partner-signup-view",
  components: {
    FormPageTemplate,
    Autocomplete
  },
  beforeRouteEnter(to, from, next) {
    const partnerId = to.params.partnerId;

    NetworkService.getStudentPartner(partnerId)
      .then(data => {
        const studentPartner = data.body.studentPartner;
        if (!studentPartner) return next("/sign-up");
        return next(_this => _this.setStudentPartner(studentPartner));
      })
      .catch(err => {
        if (err.status !== 404) {
          // we shouldn't get 422 here, since semantics of GET request are expected
          // to be correct regardless of user input
          Sentry.captureException(err);
        }
        return next("/sign-up");
      });
  },
  created() {
    this.$store.dispatch("app/hideNavigation");
  },
  data() {
    return {
      studentPartner: {
        name: "",
        highSchoolSignup: false,
        collegeSignup: false,
        schoolSignupRequired: false,
        sites: []
      },
      formStep: "step-1",
      isHighSchoolStudent: false,
      isCollegeStudent: false,
      noHighSchoolResults: false,
      formData: {
        partnerSite: undefined,
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        highSchoolUpchieveId: "",
        college: "",
        terms: false
      },
      errors: [],
      invalidInputs: [],
      serverErrorMsg: ""
    };
  },
  computed: {
    showHighSchoolCheckbox() {
      // Don't show if high school input is disabled
      if (!this.studentPartner.highSchoolSignup) return false;

      // Don't show if high school input is required
      if (this.onlyHighSchoolRequired) return false;

      // Only show if high school input is enabled but not required, i.e. optional
      return true;
    },

    showHighSchoolSelector() {
      // No high school input
      if (!this.studentPartner.highSchoolSignup) return false;

      // Require high school input
      if (this.onlyHighSchoolRequired) return true;

      // Optional high school input, so show if the checkbox is selected
      return this.isHighSchoolStudent;
    },

    showCollegeCheckbox() {
      // Don't show if high school input is disabled
      if (!this.studentPartner.collegeSignup) return false;

      // Don't show if high school input is required
      if (this.onlyCollegeRequired) return false;

      // Only show if high school input is enabled but not required, i.e. optional
      return true;
    },

    showCollegeInput() {
      // Don't show if college input is disabled
      if (!this.studentPartner.collegeSignup) return false;

      // Show if college input is required
      if (this.onlyCollegeRequired) return true;

      // Only show if high school input is enabled but not required, i.e. optional
      return this.isCollegeStudent;
    },

    requirePartnerSite() {
      return !!this.studentPartner.sites;
    },

    onlyHighSchoolRequired() {
      return (
        this.studentPartner.highSchoolSignup &&
        !this.studentPartner.collegeSignup &&
        this.studentPartner.schoolSignupRequired
      );
    },

    onlyCollegeRequired() {
      return (
        this.studentPartner.collegeSignup &&
        !this.studentPartner.highSchoolSignup &&
        this.studentPartner.schoolSignupRequired
      );
    }
  },
  methods: {
    setStudentPartner(studentPartner) {
      this.studentPartner = studentPartner;
    },

    autocompleteSchool(input) {
      this.formData.highSchoolUpchieveId = "";

      return new Promise(resolve => {
        if (input.length < 3) {
          this.noHighSchoolResults = false;
          return resolve([]);
        }

        NetworkService.searchSchool(this, { query: input })
          .then(response => response.body.results)
          .then(schools => {
            this.noHighSchoolResults = schools.length === 0;
            resolve(schools);
          });
      });
    },

    getSchoolDisplayName(school) {
      return `${school.name} (${school.city}, ${school.state})`;
    },

    handleSelectHighSchool(school) {
      this.formData.highSchoolUpchieveId = school.upchieveId;
      this.noHighSchoolResults = false;
    },

    formStepTwo() {
      // validate input
      this.errors = [];
      this.invalidInputs = [];

      if (this.requirePartnerSite && !this.formData.partnerSite) {
        this.errors.push("You must select your site");
        this.invalidInputs.push("inputSite");
      }

      if (!this.formData.email) {
        this.errors.push("An email address is required.");
        this.invalidInputs.push("inputEmail");
      } else if (!validator.isEmail(this.formData.email)) {
        // this is necessary because browsers ignore <input type="email"> until the
        // user actually tries to submit the form, which does not occur until step 2
        this.errors.push(
          this.formData.email + " is not a valid email address."
        );

        this.invalidInputs.push("inputEmail");
      }

      if (!this.formData.password) {
        this.errors.push("A password is required.");
        this.invalidInputs.push("inputPassword");
      }

      if (this.errors.length) {
        return;
      }

      // Check credentials
      AuthService.checkRegister(this, {
        email: this.formData.email,
        password: this.formData.password
      })
        .then(() => {
          this.formStep = "step-2";
          this.serverErrorMsg = "";
        })
        .catch(err => {
          this.serverErrorMsg = err.message;
          if (err.status !== 409 && err.status !== 422) {
            Sentry.captureException(err);
          }
        });
    },

    submitSignupForm() {
      this.errors = [];
      this.invalidInputs = [];

      // validate input
      if (!this.formData.firstName || !this.formData.lastName) {
        this.errors.push("You must enter your first and last name.");
      }
      if (!this.formData.firstName) {
        this.invalidInputs.push("firstName");
      }
      if (!this.formData.lastName) {
        this.invalidInputs.push("lastName");
      }
      if (this.onlyHighSchoolRequired && !this.formData.highSchoolUpchieveId) {
        this.errors.push("You must select your high school.");
        this.invalidInputs.push("inputHighschool");
      }
      if (this.onlyCollegeRequired && !this.formData.college) {
        this.errors.push("You must enter a college.");
        this.invalidInputs.push("college");
      }

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
        );

      if (this.isHighSchoolStudent && !this.formData.highSchoolUpchieveId) {
        this.errors.push("You must select your high school.");
        this.invalidInputs.push("inputHighschool");
      }

      if (this.isCollegeStudent && !this.formData.college) {
        this.errors.push("You must enter a college.");
        this.invalidInputs.push("college");
      }

      if (!this.formData.terms) {
        this.errors.push("You must read and accept the user agreement.");
      }

      if (!this.errors.length) {
        this.register();
      }
    },

    register() {
      AuthService.registerStudent(this, {
        studentPartnerOrg: this.$route.params.partnerId,
        partnerUserId: this.$route.query.uid,
        partnerSite: this.formData.partnerSite,
        email: this.formData.email,
        password: this.formData.password,
        firstName: this.formData.firstName,
        lastName: this.formData.lastName,
        highSchoolId: this.formData.highSchoolUpchieveId,
        college: this.formData.college,
        terms: this.formData.terms
      })
        .then(() => {
          this.$router.push("/dashboard");
        })
        .catch(err => {
          this.serverErrorMsg = err.message;
          if (err.status !== 422) {
            Sentry.captureException(err);
          }
        });
    }
  }
};
</script>

<style lang="scss" scoped>
.uc-form-body {
  @include child-spacing(top, 25px);
}

.step-header {
  text-align: left;

  &__title {
    font-size: 18px;
    font-weight: bold;
  }

  &__subtitle {
    font-size: 14px;
    color: $c-secondary-grey;
  }

  a {
    color: $c-information-blue;
  }
}

.step-errors {
  color: #bf0000;
  font-size: 14px;
  text-align: left;
}

.school-search {
  position: relative;
  margin-bottom: 30px;

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
</style>
