<template>
  <form class="form-signup">
    <div class="header">
      <router-link to="login" class="login-link">Log In</router-link>
      <div class="registration-header">Registration</div>
    </div>
    <div v-if="!showingSuccess">
      <label for="inputEmail">Please enter your email</label>
      <input
        id="inputEmail"
        v-model="credentials.email"
        type="email"
        class="form-control"
        required
        autofocus
      />
      <div class="description">You will be sent a verification email</div>
      <label for="inputPassword">Create a password</label>
      <input
        id="inputPassword"
        v-model="credentials.password"
        type="password"
        class="form-control"
        required
      />
      <p class="password-guidelines">
        It must contain lowercase and uppercase letters, numbers, and at least 8
        characters.
      </p>
      <div class="agreement-box">
        <input
          id="userAgreement"
          v-model="credentials.terms"
          type="checkbox"
          required
        />
        <label id="agreement" for="userAgreement" />
        <div class="agreement-label">
          I have read and accept the
          <a href="#/legal" target="_blank">user agreement</a>.
        </div>
      </div>
      <button
        class="btn btn-lg btn-primary btn-block"
        type="submit"
        @click.prevent="submit()"
      >
        SIGN UP
      </button>
      {{ msg }}
    </div>
    <div v-else class="successMessage">
      <p>
        You’ve been sent a verification email! Use the link in the email to get
        started.
      </p>
    </div>
  </form>
</template>

<script>
import AuthService from 'src/services/AuthService'
import RegistrationService from 'src/services/RegistrationService'

export default {
  data () {
    return {
      msg: '',
      credentials: {
        email: '',
        password: '',
        terms: false
      },
      showingSuccess: false
    }
  },
  methods: {
    submit () {
      AuthService.register(this, {
        code: RegistrationService.data.registrationCode,
        email: this.credentials.email,
        password: this.credentials.password,
        terms: this.credentials.terms
      })
        .then(() => {
          this.showingSuccess = true
        })
        .catch(err => {
          console.log(err)
          this.msg = err.message
        })
    }
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 50px;
  margin-top: 50px;
}
.login-link {
  color: #73737a;
  font-weight: 600;
}
.registration-header {
  color: #16d2aa;
  font-weight: 600;
  padding-left: 140px;
}
.description {
  font-size: 12px;
  text-align: left;
  margin-bottom: 10px;
  color: #73737a;
}

#inputEmail {
  margin-bottom: 6px;
}

.form-signup {
  height: 100%;
  display: flex;
  flex-direction: column;
  max-width: 500px;
}
.form-control {
  border: none;
  box-shadow: none;
  border-radius: 0;
}

.form-signup .form-control:focus {
  z-index: 2;
}

label {
  display: block;
  text-align: left;
  font-size: 16px;
  font-weight: 400;
  color: #343440;
}
.form-control {
  border-bottom: 3px solid #16d2aa;
  margin-bottom: 50px;
}
.form-control:last-of-type {
  margin-bottom: 0;
}

.password-guidelines {
  font-size: 12px;
  font-weight: 300;
  text-align: left;
  color: #73737a;
  margin: 10px auto;
}

.form-control:focus {
  border-bottom: 3px solid black;
  box-shadow: none;
}

#userAgreement {
  margin-right: 12px;
  border: 3px solid #000;
  display: inline-block;
}

#agreement {
  display: inline-block;
  margin-bottom: 0;
}

input[type='checkbox'] {
  visibility: hidden;
  position: absolute;
  top: -9999px;
}

.agreement-box {
  margin: 25px 0 10px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.agreement-box label {
  cursor: pointer;
  margin-right: 12px;
  width: 18px;
  height: 18px;
  background: #fff;
  border: 2px solid #343440;
  border-radius: 2px;
}

.agreement-box label:after {
  opacity: 0;
  content: '';
  position: absolute;
  margin: 4px 0 0 3px;
  width: 8px;
  height: 5px;
  background: transparent;
  border: 3px solid #343440;
  border-top: none;
  border-right: none;
  transform: rotate(-45deg);
}

.agreement-box input[type='checkbox']:checked + label:after {
  opacity: 1;
}

.agreement-label {
  font-size: 12px;
  color: #343440;
  position: absolute;
  margin-left: 35px;
}

.agreement-label a {
  color: #16d2aa;
}

button[type='submit'] {
  background-color: #f6f6f6;
  border: none;
  font-weight: 600;
  color: #16d2aa;
  height: 40px;
  border-radius: 20px;
  font-size: 12px;
  margin-bottom: 10px;
}

button[type='submit']:hover,
button[type='submit']:active {
  color: white;
  background-color: #16d2aa;
}

.successMessage {
  text-align: left;
  margin-top: 50px;
  padding-bottom: 20px;
  border-bottom: 3px solid black;
}
</style>
