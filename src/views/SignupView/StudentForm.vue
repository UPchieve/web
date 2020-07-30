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
        <button class="uc-form-button" @click="eligibilityPage">
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
    v-else-if="step === 'eligibility'"
    class="uc-form-body uc-form-body--center"
    @submit.prevent="submitEligibility()"
  >
    <div v-if="errors.length" class="step-errors">
      <h5>Please correct the following problems:</h5>
      <ul>
        <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
      </ul>
    </div>

    <div class="uc-column title-wrapper">
      <h3>Great! Let's get started</h3>
      <p>
        First, we need to ask you a few quick questions to make sure you're
        eligible for our services.
      </p>
    </div>

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
            invalidInputs.indexOf('inputEligibilityEmail') > -1
        }"
        v-model="eligibility.email"
        required
        placeholder="Email"
        aria-label="Email"
      />
      <p class="uc-form-subtext">
        We will only use this email to notify you if your eligibility status
        changes in the future.
      </p>
    </div>

    <button class="uc-form-button-big" type="submit">
      Check my eligibility
    </button>

    <div v-if="msg !== ''">{{ msg }}</div>
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
      <button class="uc-form-button-big" @click="accountPage">
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
    <h3>Sorry, we can't verify your eligibility yet.</h3>

    <p class="small-paragraph">
      We weren’t able to verify your eligibility based on the information you’ve
      entered so far.
      <strong>Don’t worry: you may still be eligible!</strong> We just need your
      parent/guardian to answer some more questions first!
    </p>

    <button class="uc-form-button-big" @click="ineligibleContinue">
      Continue
    </button>
  </div>

  <form
    v-else-if="step === 'account'"
    class="uc-form-body uc-form-body--center"
    @submit.prevent="submitAccountForm()"
  >
    <div v-if="errors.length" class="step-errors">
      <h5>Please correct the following problems:</h5>
      <ul>
        <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
      </ul>
    </div>

    <div class="step-title">Finish creating your account</div>

    <div class="uc-column">
      <label for="firstName" class="uc-form-label">What's your name?</label>
      <div class="uc-row name-fields">
        <div class="uc-column">
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
          <p class="uc-form-subtext">First Name</p>
        </div>
        <div class="uc-column">
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
          'uc-form-input--invalid': invalidInputs.indexOf('inputPassword') > -1
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

    <div v-if="msg !== ''">{{ msg }}</div>
  </form>
  <div v-else class="uc-form-body">Unexpected Error</div>
</template>

<script>
import { mapState } from "vuex";
import validator from "validator";
import Autocomplete from "@trevoreyre/autocomplete-vue";
import * as Sentry from "@sentry/browser";
import AuthService from "@/services/AuthService";
import NetworkService from "@/services/NetworkService";
import VerificationBadge from "@/assets/verification.svg";
import ErrorBadge from "@/assets/error_badge.svg";

export default {
  components: {
    Autocomplete,
    VerificationBadge,
    ErrorBadge
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
      credentials: {
        email: "",
        password: "",
        terms: false
      },
      profile: {
        firstName: "",
        lastName: ""
      },
      step: ""
    };
  },
  mounted() {
    if (this.isMobileApp) {
      this.partnerCodePage();
    } else {
      this.eligibilityPage();
    }
  },
  computed: {
    ...mapState({
      isMobileApp: state => state.app.isMobileApp
    })
  },
  methods: {
    partnerCodePage() {
      this.step = "partner-signup-code";
      this.$router.push("/sign-up/student/partner-code");
    },

    eligibilityPage() {
      this.step = "eligibility";
      this.$router.push("/sign-up/student/eligibility");
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

    submitEligibility() {
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

      if (!this.eligibility.email) {
        this.errors.push("An email address is required.");
        this.invalidInputs.push("inputEligibilityEmail");
      } else if (!validator.isEmail(this.eligibility.email)) {
        this.errors.push(
          this.eligibility.email + " is not a valid email address."
        );
        this.invalidInputs.push("inputEligibilityEmail");
      }

      if (this.errors.length) {
        return;
      }

      NetworkService.checkStudentEligibility(this, {
        schoolUpchieveId: this.eligibility.highSchool.upchieveId,
        zipCode: this.eligibility.zipCode,
        email: this.eligibility.email,
        referredByCode: window.localStorage.getItem("upcReferredByCode")
      })
        .then(response => {
          const isEligible = response.body.isEligible;

          if (isEligible) {
            this.step = "eligible";
            this.$router.push("/sign-up/student/eligible");
            // autofill the user's email
            this.credentials.email = this.eligibility.email;
          } else {
            this.step = "ineligible";
            this.$router.push("/sign-up/student/ineligible");
          }
        })
        .catch(res => {
          this.errors.push(res.body.message);
        });
    },
    accountPage() {
      this.step = "account";
      this.$router.push("/sign-up/student/account");
    },
    ineligibleContinue() {
      window.location = "https://upchieve.org/request-access";
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
    submitAccountForm() {
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
      if (!this.credentials.password) {
        this.errors.push("A password is required.");
        this.invalidInputs.push("inputPassword");
      }

      if (!this.errors.length) this.submit();
    },
    submit() {
      AuthService.registerStudent(this, {
        email: this.credentials.email,
        password: this.credentials.password,
        terms: this.credentials.terms,
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        highSchoolId: this.eligibility.highSchool.upchieveId,
        zipCode: this.eligibility.zipCode,
        referredByCode: window.localStorage.getItem("upcReferredByCode")
      })
        .then(() => {
          window.localStorage.removeItem("upcReferredByCode");
          this.$store.dispatch("user/firstDashboardVisit", true);
          this.$router.push("/dashboard");
        })
        .catch(err => {
          this.errors.push(err.message);
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

.title-wrapper {
  h3 {
    margin: 0 0 5px 0;
  }

  p {
    font-size: 14px;
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
