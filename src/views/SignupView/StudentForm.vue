<template>
  <form
    v-if="step === 'partner-signup-code'"
    class="uc-form-body"
    @submit.prevent="submitPartnerSignupCode()"
  >
    <div v-if="errors.length" class="step-errors">
      <h5>Please correct the following problems:</h5>
      <ul>
        <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
      </ul>
    </div>

    <template v-if="showSignupCodeDecision">
      <div class="step-title step-title--center">
        Do you have a sign-up code?
      </div>
      <div class="uc-column">
        <button class="uc-form-button" @click="signupCodeYes">
          Yes
        </button>
      </div>
      <div class="uc-column">
        <button class="uc-form-button" @click="firstPage">
          No
        </button>
      </div>
    </template>

    <template v-else>
      <div class="uc-column">
        <div class="back-button" @click="backToSignupCodeDecision">Back</div>

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

    <div v-if="msg !== ''">{{ msg }}</div>
  </form>

  <form
    v-else-if="step === 'step-1'"
    class="uc-form-body"
    @submit.prevent="secondPage()"
  >
    <div v-if="errors.length" class="step-errors">
      <h5>Please correct the following problems:</h5>
      <ul>
        <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
      </ul>
    </div>

    <div class="step-title">Step 1 of 3: Check your eligibility</div>

    <div class="uc-column">
      <label for="inputHighschool" class="uc-form-label"
        >What school do you go to?</label
      >

      <div class="school-search">
        <autocomplete
          id="inputHighschool"
          class="school-search__autocomplete"
          :search="autocompleteSchool"
          :get-result-value="getSchoolDisplayName"
          base-class="uc-autocomplete"
          auto-select
          placeholder="Search for your school"
          aria-label="Search for your school"
          @submit="handleSelectHighSchool"
        ></autocomplete>

        <div
          v-if="eligibility.noSchoolResults"
          class="school-search__no-results"
        >
          <a href="https://upchieve.org/cant-find-school" target="_blank">
            Can't find your high school?
          </a>
        </div>
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
          'uc-form-input--invalid': invalidInputs.indexOf('inputZipCode') > -1
        }"
        v-model="eligibility.zipCode"
        required
        placeholder="5 digit zip code"
        aria-label="5 digit zip code"
      />
    </div>

    <button class="uc-form-button" type="submit">
      Continue
    </button>

    <div v-if="msg !== ''">{{ msg }}</div>
  </form>

  <form
    v-else-if="step === 'step-1-waitlist'"
    class="uc-form-body"
    @submit.prevent="submitWaitlist()"
  >
    <div v-if="errors.length" class="step-errors">
      <h5>Please correct the following problems:</h5>
      <ul>
        <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
      </ul>
    </div>

    <div class="step-title">
      Sorry! You're not currently eligible for UPchieve.
    </div>

    <div class="uc-column">
      <label for="inputWaitlistEmail" class="uc-form-label"
        >If you want to be notified when we launch at your school, enter your
        email below.</label
      >

      <input
        id="inputWaitlistEmail"
        type="email"
        class="uc-form-input"
        v-bind:class="{
          'uc-form-input--invalid':
            invalidInputs.indexOf('inputWaitlistEmail') > -1
        }"
        v-model="waitlist.email"
        autofocus
      />

      <p class="uc-form-subtext">
        We will only use your email to contact you about your eligibility for
        UPchieve. See our Privacy Policy for more info.
      </p>
    </div>

    <button class="uc-form-button" type="submit">
      Submit
    </button>

    <div v-if="msg !== ''">{{ msg }}</div>
  </form>

  <form v-else-if="step === 'step-1-waitlist-success'" class="uc-form-body">
    <div class="step-title">
      Thank you! You'll be the first to know when we expand to your school.
    </div>
  </form>

  <form
    v-else-if="step === 'step-2'"
    class="uc-form-body"
    @submit.prevent="thirdPage()"
  >
    <div v-if="errors.length" class="step-errors">
      <h5>Please correct the following problems:</h5>
      <ul>
        <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
      </ul>
    </div>

    <div class="step-title">Step 2 of 3: Choose your log-in details</div>

    <div class="uc-column">
      <label for="inputEmail" class="uc-form-label">What's your email?</label>
      <input
        id="inputEmail"
        type="email"
        class="uc-form-input"
        v-bind:class="{
          'uc-form-input--invalid': invalidInputs.indexOf('inputEmail') > -1
        }"
        v-model="credentials.email"
        required
        autofocus
        autocomplete="email"
      />
      <p class="uc-form-subtext">
        We will only use your email to contact you about your account. See our
        <a href="/legal" target="_blank">Privacy Policy</a> for more info.
      </p>
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
          'uc-form-input--invalid': invalidInputs.indexOf('inputPassword') > -1
        }"
        v-model="credentials.password"
        required
        autocomplete="new-password"
      />
      <p class="uc-form-subtext">
        Keep your account safe by choosing a password with one number, one
        uppercase letter, and one lowercase letter.
      </p>
    </div>

    <button class="uc-form-button" type="submit">
      Continue
    </button>

    <div v-if="msg !== ''">{{ msg }}</div>
  </form>

  <form
    v-else-if="step === 'step-3'"
    class="uc-form-body"
    @submit.prevent="checkInputs()"
  >
    <!-- Fix for bug in Chrome where the username and password are mapped to non-login fields
     even if the HTML5 autocomplete attributes are set to the right values -->
    <input
      type="text"
      class="d-none"
      id="username"
      v-model="credentials.email"
      autocomplete="username"
    />
    <input
      type="password"
      class="d-none"
      id="password"
      v-model="credentials.password"
      autocomplete="new-password"
    />

    <div v-if="errors.length" class="step-errors">
      <h5>Please correct the following problems:</h5>
      <ul>
        <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
      </ul>
    </div>

    <div class="step-title">Step 3 of 3: Tell us about yourself!</div>

    <div class="uc-column">
      <label for="firstName" class="uc-form-label">First Name</label>
      <input
        id="firstName"
        type="text"
        class="uc-form-input"
        v-bind:class="{
          'uc-form-input--invalid': invalidInputs.indexOf('firstName') > -1
        }"
        v-model="profile.firstName"
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
        v-model="profile.lastName"
        required
        autocomplete="family-name"
      />
    </div>

    <div class="uc-form-checkbox">
      <input
        id="userAgreement"
        type="checkbox"
        v-model="credentials.terms"
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

    <div v-if="msg !== ''">{{ msg }}</div>
  </form>

  <div v-else class="uc-form-body">Unexpected Error</div>
</template>

<script>
import validator from "validator";
import Autocomplete from "@trevoreyre/autocomplete-vue";
import * as Sentry from "@sentry/browser";

import AuthService from "@/services/AuthService";
import NetworkService from "@/services/NetworkService";

export default {
  components: {
    Autocomplete
  },
  data() {
    return {
      partnerSignupCode: "",
      showSignupCodeDecision: true,
      msg: "",
      errors: [],
      invalidInputs: [],
      eligibility: {
        noSchoolResults: false,
        highSchool: {},
        zipCode: ""
      },
      waitlist: {
        email: ""
      },
      credentials: {
        email: "",
        password: "",
        terms: false
      },
      profile: {
        firstName: "",
        lastName: ""
      },
      step: "partner-signup-code"
    };
  },
  methods: {
    firstPage() {
      this.step = "step-1";
    },

    signupCodeYes() {
      this.showSignupCodeDecision = false;
    },

    backToSignupCodeDecision() {
      this.errors = [];
      this.invalidInputs = [];
      this.showSignupCodeDecision = true;
    },

    submitPartnerSignupCode() {
      this.errors = [];
      this.invalidInputs = [];

      NetworkService.checkStudentPartnerSignupCode(this.partnerSignupCode)
        .then(res => {
          const studentPartnerKey = res.body.studentPartnerKey;
          const studentPartnerRoute = `/signup/student/${studentPartnerKey}`;

          // Redirect to student partner signup page
          this.$router.push(studentPartnerRoute);
        })
        .catch(() => {
          this.errors.push("Invalid sign-up code");
        });
    },

    secondPage() {
      // reset error msg from server
      this.msg = "";

      // validate input
      this.errors = [];
      this.invalidInputs = [];

      if (!this.eligibility.highSchool.upchieveId) {
        this.errors.push("You must select your high school.");
      }

      const zipCodeRegex = /^\d{5}$/;
      const zipCode = this.eligibility.zipCode;

      if (!zipCode || !zipCodeRegex.test(zipCode)) {
        this.errors.push("You must enter a valid zip code");
        this.invalidInputs.push("inputZipCode");
      }
      if (this.errors.length) {
        return;
      }

      NetworkService.checkStudentEligbility(this, {
        schoolUpchieveId: this.eligibility.highSchool.upchieveId,
        zipCode: this.eligibility.zipCode
      })
        .then(response => {
          const isEligible = response.body.isEligible;

          if (isEligible) {
            this.step = "step-2";
          } else {
            this.step = "step-1-waitlist";
          }
        })
        .catch(err => {
          this.msg = err.message;
        });
    },
    thirdPage() {
      // reset error msg from server
      this.msg = "";

      // validate input
      this.errors = [];
      this.invalidInputs = [];
      if (!this.credentials.email) {
        this.errors.push("An email address is required.");
        this.invalidInputs.push("inputEmail");
      } else if (!validator.isEmail(this.credentials.email)) {
        // this is necessary because browsers ignore <input type="email"> until the
        // user actually tries to submit the form, which does not occur until step 3
        this.errors.push(
          this.credentials.email + " is not a valid email address."
        );
        this.invalidInputs.push("inputEmail");
      }
      if (!this.credentials.password) {
        this.errors.push("A password is required.");
        this.invalidInputs.push("inputPassword");
      }
      if (this.errors.length) {
        return;
      }

      AuthService.checkRegister(this, {
        email: this.credentials.email,
        password: this.credentials.password
      })
        .then(() => {
          this.step = "step-3";
        })
        .catch(err => {
          this.msg = err.message;
          if (err.status !== 409 && err.status !== 422) {
            Sentry.captureException(err);
          }
        });
    },
    submitWaitlist() {
      // reset error msg from server
      this.msg = "";

      // validate input
      this.errors = [];
      this.invalidInputs = [];

      if (!this.waitlist.email) {
        this.errors.push("An email address is required.");
      } else if (!validator.isEmail(this.waitlist.email)) {
        this.errors.push(
          this.waitlist.email + " is not a valid email address."
        );
      }
      if (this.errors.length) {
        return;
      }

      NetworkService.joinSchoolApprovalWaitlist(this, {
        email: this.waitlist.email,
        schoolUpchieveId: this.eligibility.highSchool.upchieveId
      })
        .then(() => {
          this.step = "step-1-waitlist-success";
        })
        .catch(err => {
          this.msg = err.message;
        });
    },
    autocompleteSchool(input) {
      this.eligibility.highSchool = {};

      return new Promise(resolve => {
        if (input.length < 3) {
          this.eligibility.noSchoolResults = false;
          return resolve([]);
        }

        NetworkService.searchSchool(this, { query: input })
          .then(response => response.body.results)
          .then(schools => {
            this.eligibility.noSchoolResults = schools.length === 0;
            resolve(schools);
          });
      });
    },
    getSchoolDisplayName(school) {
      return `${school.name} (${school.city}, ${school.state})`;
    },
    handleSelectHighSchool(school) {
      this.eligibility.highSchool = school;
    },
    checkInputs() {
      this.errors = [];
      this.invalidInputs = [];

      if (!this.profile.firstName || !this.profile.lastName) {
        this.errors.push("You must enter your first and last name.");
      }
      if (!this.profile.firstName) {
        this.invalidInputs.push("firstName");
      }
      if (!this.profile.lastName) {
        this.invalidInputs.push("lastName");
      }
      if (!this.credentials.terms) {
        // necessary because the CSS hides the browser's validation message
        this.errors.push("You must read and accept the user agreement.");
      }
      if (!this.errors.length) {
        this.submit();
      }
    },
    submit() {
      AuthService.register(this, {
        isVolunteer: false,
        email: this.credentials.email,
        password: this.credentials.password,
        terms: this.credentials.terms,
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        highSchoolId: this.eligibility.highSchool.upchieveId,
        zipCode: this.eligibility.zipCode,
        referredByCode: this.$route.query.referral
      })
        .then(() => {
          this.$router.push("/dashboard");
        })
        .catch(err => {
          this.msg = err.message;
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
    content: "←";
    padding-right: 5px;
  }
}

.enter-signup-code-button {
  margin-bottom: 25px;
}

.step-errors {
  color: #bf0000;
  font-size: 14px;
  text-align: left;
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
</style>
