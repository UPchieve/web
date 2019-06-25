<template>
  <div v-if="step == 'step-1'" class="uc-form-body">
    <div class="step-title">Step 1 of 2: Choose your log-in details</div>

    <div class="uc-column">
      <label for="inputEmail" class="uc-form-label">What's your email?</label>
      <input
        id="inputEmail"
        type="email"
        class="uc-form-input"
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
        v-model="credentials.password"
        required
      />
      <p class="uc-form-subtext">
        Keep your account safe by choosing a password with one number, one
        uppercase letter, and one lowercase letter.
      </p>
    </div>

    <button
      class="uc-form-button"
      type="submit"
      @click.prevent="nextPage()"
    >
      Continue
    </button>

    <div>{{ msg }}</div>
  </div>

  <div v-else-if="step == 'step-2'" class="uc-form-body">
    <div class="step-title">Step 2 of 2: Tell us about yourself!</div>

    <div class="uc-column">
      <label for="firstName" class="uc-form-label">First Name</label>
      <input
        id="firstName"
        type="text"
        class="uc-form-input"
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
        v-model="profile.lastName"
        required
      />
    </div>

    <div class="uc-column">
      <label for="phoneNumber" class="uc-form-label">Phone Number</label>
      <input
        id="phoneNumber"
        type="tel"
        class="uc-form-input"
        v-model="profile.phone"
        required
      />
    </div>

    <div class="uc-column">
      <label for="college" class="uc-form-label">
        What college do you go to?
      </label>
      <input
        id="college"
        type="text"
        class="uc-form-input"
        v-model="profile.college"
        required
      />
    </div>

    <div class="uc-column">
      <label for="favoriteAcademicSubject" class="uc-form-label">
        What’s your favorite academic subject?
      </label>
      <input
        id="favoriteAcademicSubject"
        type="text"
        class="uc-form-input"
        v-model="profile.favoriteAcademicSubject"
        required
      />
    </div>
    
    <div class="uc-form-checkbox">
      <input
        id="userAgreement"
        v-model="credentials.terms"
        type="checkbox"
        required
      />
      <label for="userAgreement">
        I have read and accept the
        <a href="#/legal" target="_blank">user agreement</a>.
      </label>
    </div>

    <button
      class="uc-form-button"
      type="submit"
      @click.prevent="submit()"
    >
      Sign Up
    </button>
  </div>

  <div v-else-if="step == 'success-message'" class="uc-form-body">
    You've been sent a verification email! Check your email for a link to
    confirm your account.
  </div>

  <div v-else class="uc-form-body">Unexpected Error</div>
</template>

<script>
import AuthService from 'src/services/AuthService'
import RegistrationService from 'src/services/RegistrationService'
import UserService from '../../services/UserService'

export default {
  data () {
    return {
      msg: '',
      credentials: {
        email: '',
        password: '',
        terms: false
      },
      profile: {
        firstName: '',
        lastName: '',
        college: '',
        phone: '',
        favoriteAcademicSubject: ''
      },
      step: 'step-1'
    }
  },
  methods: {
    nextPage () {
      AuthService.checkRegister(this, {
        email: this.credentials.email,
        password: this.credentials.password
      })
        .then(() => {
          this.step = 'step-2'
        })
        .catch(err => {
          this.msg = err.message
        })
    },
    submit () {
      AuthService.register(this, {
        code: RegistrationService.data.registrationCode,
        email: this.credentials.email,
        password: this.credentials.password,
        terms: this.credentials.terms
      })
        .then(() => {
          let user = UserService.getUser()
          user.firstname = this.profile.firstName
          user.lastname = this.profile.lastName
          user.college = this.profile.college
          user.phone = this.profile.phone
          user.favoriteAcademicSubject = this.profile.favoriteAcademicSubject
          UserService.setProfile(this, user)
          this.step = 'success-message'
        })
        .catch(err => {
          console.log(err)
          this.msg = err.message
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.uc-form-body {
  @include child-spacing(25px);
}

.step-title {
  font-weight: bold;
  text-align: left;
}
</style>
