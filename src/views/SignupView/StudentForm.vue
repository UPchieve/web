<template>
  <form
    v-if="step === 'step-1'"
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
      <label for="inputHighschool" class="uc-form-label">High School</label>

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

        <div
          v-if="eligibility.noSchoolResults"
          class="school-search__no-results"
        >
          <a
            href="https://upchieve.org/invite-your-school"
            target="_blank"
          >
            Can't find your high school?
          </a>
        </div>
      </div>

      <p class="uc-form-subtext">
        We will never share your high school with third parties.
      </p>
    </div>

    <button class="uc-form-button" type="submit" @click.prevent="secondPage()">
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

    <div class="step-title">This school is not currently supported</div>

    <div class="uc-column">
      <label for="inputWaitlistEmail" class="uc-form-label"
        >Enter your email to be notified when UPchieve launches at your
        school</label
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
        We won't spam you, pinky promise
      </p>
    </div>

    <button
      class="uc-form-button"
      type="submit"
      @click.prevent="submitWaitlist()"
    >
      Submit
    </button>

    <div v-if="msg !== ''">{{ msg }}</div>
  </form>

  <form v-else-if="step === 'step-1-waitlist-success'" class="uc-form-body">
    <div class="step-title">
      Thank you. We hope to provide access to your school soon!
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
      />
      <p class="uc-form-subtext">
        We will only use your email to contact you about your account. See our
        Privacy Policy for more info.
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
      />
      <p class="uc-form-subtext">
        Keep your account safe by choosing a password with one number, one
        uppercase letter, and one lowercase letter.
      </p>
    </div>

    <button class="uc-form-button" type="submit" @click.prevent="thirdPage()">
      Continue
    </button>

    <div v-if="msg !== ''">{{ msg }}</div>
  </form>

  <form
    v-else-if="step === 'step-3'"
    class="uc-form-body"
    @submit.prevent="submit()"
  >
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
      />
    </div>

    <div class="uc-column">
      <label for="heardFrom" class="uc-form-label">
        How did you hear about us?
      </label>
      <select v-model="profile.heardFrom" class="uc-form-select">
        <option value="" disabled>Select an option</option>
        <option
          v-for="option in heardFromOptions"
          v-bind:key="option"
          v-bind:value="option"
        >
          {{ option }}
        </option>
      </select>
    </div>

    <div class="uc-column">
      <label for="referred" class="uc-form-label">
        Do you get help from any of these organizations?
      </label>
      <select v-model="profile.referred" class="uc-form-select">
        <option value="" disabled>Select an option</option>
        <option
          v-for="option in referredOptions"
          v-bind:key="option"
          v-bind:value="option"
        >
          {{ option }}
        </option>
      </select>
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

    <button class="uc-form-button" type="submit" @click="checkInputs($event)">
      Sign Up
    </button>

    <div v-if="msg !== ''">{{ msg }}</div>
  </form>

  <div v-else class="uc-form-body">Unexpected Error</div>
</template>

<script>
import validator from "validator";
import Autocomplete from "@trevoreyre/autocomplete-vue";

import AuthService from "@/services/AuthService";
import UserService from "@/services/UserService";
import AnalyticsService from "@/services/AnalyticsService";
import NetworkService from "@/services/NetworkService";

export default {
  components: {
    Autocomplete
  },
  data() {
    const heardFromOptions = [
      "Flyer",
      "Email",
      "Internet search",
      "Friend",
      "Family member",
      "Teacher",
      "School",
      "Social media",
      "Other"
    ];

    const referredOptions = [
      "Big Brothers Big Sisters of NYC",
      "Breakthrough New York",
      "East Harlem Tutorial Program",
      "First Graduate",
      "Oasis - A Heaven for Women and Children",
      "NYC Mission Society",
      "None of the above"
    ];

    return {
      heardFromOptions,
      referredOptions,
      msg: "",
      errors: [],
      invalidInputs: [],
      eligibility: {
        noSchoolResults: false,
        highSchool: {}
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
        lastName: "",
        heardFrom: "",
        referred: ""
      },
      step: "step-1"
    };
  },
  methods: {
    secondPage() {
      // reset error msg from server
      this.msg = "";

      // validate input
      this.errors = [];
      this.invalidInputs = [];

      if (!this.eligibility.highSchool.upchieveId) {
        this.errors.push("You must select a high school.");
      }
      if (this.errors.length) {
        return;
      }

      NetworkService.checkSchoolApproval(this, {
        schoolUpchieveId: this.eligibility.highSchool.upchieveId
      })
        .then(response => {
          const isSchoolApproved = response.body.approved;

          if (isSchoolApproved) {
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
      return `${school.name} (${school.districtName}, ${school.state})`;
    },
    handleSelectHighSchool(school) {
      this.eligibility.highSchool = school;
    },
    checkInputs(e) {
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
      if (this.errors.length) {
        e.preventDefault();
      }
    },
    submit() {
      AuthService.register(this, {
        code: undefined,
        email: this.credentials.email,
        password: this.credentials.password,
        terms: this.credentials.terms,
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        highSchoolId: this.eligibility.highSchool.upchieveId
      })
        .then(() => {
          let user = UserService.getUser();
          user.heardFrom = this.profile.heardFrom;
          user.referred = this.profile.referred;
          UserService.setProfile(this, user, "/");

          // analytics: tracking when a user has signed up
          AnalyticsService.identify(user, user.isFakeUser);
          AnalyticsService.trackNoProperties("signed up", user.isFakeUser);
        })
        .catch(err => {
          this.msg = err.message;
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
</style>
