<template>
  <form class="form-signup">
    <div class="header">
      <router-link to="login" class="login-link">Log In</router-link>
      <div class="registration-header">Register an Account</div>
    </div>
    <div v-if="!showingSuccess">
      <div v-if="step==1">
        <div class="step-1-text" colspan="2"><b>Step 1 of 2: Choose your log-in details </b></div>
        <label for="inputEmail">What's your email?</label>
        <input type="email" id="inputEmail" class="form-control" required autofocus v-model="credentials.email">
        <div class="description">We will only use your email to contact you about your account. See our Privacy Policy for more info.</div>
        <label for="inputPassword">Create a password.</label>
        <input type="password" id="inputPassword" class="form-control" required v-model="credentials.password">
        <p class="password-guidelines">Keep your account safe by choosing a password with one number, one uppercase letter, and one lowercase letter.</p>
        <button class="btn btn-lg btn-primary btn-block" type="submit" @click.prevent="nextPage()">CONTINUE</button>
        {{msg}}
      </div>
      <div v-else>
        <table class="step-2-table">
          <tr>
            <td class="table-entry" colspan="2"><b>Step 2 of 2: Tell us about yourself! </b></td>
          </tr>
          <tr class="question-row">
            <td class="table-entry" colspan="2">What's your name?</td>
          </tr>
          <tr>
            <td style="padding-right: 15px;"><input class="form-control" required autofocus v-model="profile.firstName"></td>
            <td style="padding-left: 15px;"><input class="form-control" required autofocus v-model="profile.lastName"></td>
          </tr>
          <tr>
            <td class="table-entry"><div class="description">First Name</div></td>
            <td class="table-entry"><div class="description">Last Name</div></td>
          </tr>
          <tr class="question-row">
            <td class="table-entry" colspan="2">What college did you go to?</td>
          </tr>
          <tr>
            <td colspan="2"><input class="form-control" required autofocus v-model="profile.college"></td>
          </tr>
          <tr class="question-row">
            <td class="table-entry" colspan="2">What’s your favorite academic subject?</td>
          </tr>
          <tr>
            <td colspan="2"><input class="form-control" required autofocus v-model="profile.favoriteAcademicSubject"></td>
          </tr>
          <tr>
            <div class="agreement-box">
              <input type="checkbox" id="userAgreement" v-model="credentials.terms" required>
              <label id='agreement' for="userAgreement"></label>
              <div class="agreement-label">I have read and accept the <a href="#/legal" target="_blank">user agreement</a>.</div>
            </div>
          </tr>
        </table>
        <button class="btn btn-lg btn-primary btn-block" type="submit" @click.prevent="submit()">SIGN UP</button>
      </div>
    </div>
    <div class="successMessage" v-else>
      <p>You’ve been sent a verification email! Use the link in the email to get started.</p>
    </div>
  </form>
</template>

<script>
  import AuthService from 'src/services/AuthService'
  import RegistrationService from 'src/services/RegistrationService'
  import UserService from "../../services/UserService";

  export default {
    data() {
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
          favoriteAcademicSubject: ''
        },
        step: 1,
        showingSuccess: false
      }
    },
    methods: {
      nextPage() {
        AuthService.checkRegister(this, {
          email: this.credentials.email,
          password: this.credentials.password
        }).then(() => {
          this.step = 2;
        }).catch((err) => {
          this.msg = err.message;
        })
      },
      submit() {
        AuthService.register(this, {
          code: RegistrationService.data.registrationCode,
          email: this.credentials.email,
          password: this.credentials.password,
          terms: this.credentials.terms
        }).then(() => {
          let user = UserService.getUser();
          user.firstname = this.profile.firstName;
          user.lastname = this.profile.lastName;
          user.college = this.profile.college;
          user.favoriteAcademicSubject = this.profile.favoriteAcademicSubject;
          UserService.setProfile(this, user);
          this.showingSuccess = true;
        }).catch((err) => {
          console.log(err);
          this.msg = err.message;
        })
      }
    }
  }
</script>

<style scoped>

  .header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 25px;
    margin-top: 25px;
  }

  .step-1-text {
    text-align: left;
    padding-bottom: 25px;
  }
  .login-link {
    color: #73737A;
    font-weight: 600;
  }
  .registration-header {
    color: #16D2AA;
    font-weight: 600;
  }
  .description {
    font-size: 12px;
    text-align: left;
    color: #73737A;
  }

  #inputEmail {
    margin-bottom: 6px;
  }

  .form-signup {
    height: 100%;
    display: flex;
    flex-direction: column;
    max-width: 500px;
    padding: 15px;
    margin: auto;
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
    border-bottom: 3px solid #16D2AA;
    margin-bottom: 50px;
  }
  .form-control:last-of-type {
    margin-bottom: 0;
  }

  .password-guidelines {
    font-size: 12px;
    font-weight: 300;
    text-align: left;
    color: #73737A;
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

  input[type="checkbox"] {
    visibility: hidden;
    position: absolute;
    top: -9999px;
  }

  .agreement-box {
    margin: 25px 0 10px 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .agreement-box label {
    cursor: pointer;
    margin-right: 12px;
    width: 18px;
    height: 18px;
    background: #fff;
    border:2px solid #343440;
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

  .agreement-box input[type="checkbox"]:checked + label:after {
    opacity: 1;
  }

  .agreement-label {
    font-size: 12px;
    color: #343440;
    position: absolute;
    margin-left: 35px;
  }

  .agreement-label a {
    color: #16D2AA;
  }

  button[type="submit"] {
    margin-top: 20px;
    background-color: #F6F6F6;
    border: none;
    font-weight: 600;
    color: #16D2AA;
    height: 40px;
    border-radius: 20px;
    font-size: 12px;
    margin-bottom: 10px;
  }

  button[type="submit"]:hover, button[type="submit"]:active {
    color: white;
    background-color: #16D2AA;
  }

  .successMessage {
    text-align: left;
    margin-top: 50px;
    padding-bottom: 20px;
    border-bottom: 3px solid black;
  }

  .step-2-table {
    width: 100%;
  }

  .table-entry {
    text-align: left;
  }

  .question-row {
    height: 45px;
    vertical-align: bottom;
  }

</style>
