<template>
  <form
    v-if="step === 'step-1'"
    class="uc-form-body"
    @submit.prevent="submit()"
  >
    <div v-if="errors.length" class="step-errors">
      <h5>Please correct the following problems:</h5>
      <ul>
        <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
      </ul>
    </div>

    <div class="step-title">Step 1 of 2: Choose your log-in details</div>

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

    <button class="uc-form-button" type="submit" @click.prevent="nextPage()">
      Continue
    </button>

    <div v-if="msg !== ''">{{ msg }}</div>
  </form>

  <form
    v-else-if="step === 'step-2'"
    class="uc-form-body"
    @submit.prevent="submit()"
  >
    <div v-if="errors.length" class="step-errors">
      <h5>Please correct the following problems:</h5>
      <ul>
        <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
      </ul>
    </div>

    <div class="step-title">Step 2 of 2: Tell us about yourself!</div>

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
      <label for="highSchool" class="uc-form-label">
        What high school do you go to?
      </label>
      <input
        id="highSchool"
        type="text"
        class="uc-form-input"
        v-bind:class="{
          'uc-form-input--invalid': invalidInputs.indexOf('highSchool') > -1
        }"
        v-model="profile.highSchool"
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

import AuthService from "@/services/AuthService";
import UserService from "@/services/UserService";
import AnalyticsService from "@/services/AnalyticsService";

export default {
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
      credentials: {
        email: "",
        password: "",
        terms: false
      },
      profile: {
        firstName: "",
        lastName: "",
        highSchool: "",
        heardFrom: "",
        referred: ""
      },
      step: "step-1"
    };
  },
  methods: {
    nextPage() {
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
        // user actually tries to submit the form, which does not occur until step 2
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
          this.step = "step-2";
        })
        .catch(err => {
          this.msg = err.message;
        });
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
      if (!this.profile.highSchool) {
        this.errors.push("Please enter the name of the high school you go to.");
        this.invalidInputs.push("highSchool");
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
        highSchool: this.profile.highSchool
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
</style>
