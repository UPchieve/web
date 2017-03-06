<template>
  <form class="form-signup">
    <div v-if="!showingSuccess">
      <h2 class="form-signup-heading">Registration</h2>
      <label for="inputEmail">Your email</label>
      <input type="email" id="inputEmail" class="form-control" required autofocus v-model="credentials.email">
      <label for="inputPassword">Create a password</label>
      <input type="password" id="inputPassword" class="form-control" required v-model="credentials.password">
      <p class="password-guidelines">It must contain lowercase and uppercase letters, numbers, and at least 8 characters.</p>
      <button class="btn btn-lg btn-primary btn-block" type="submit" @click.prevent="submit()">Next</button>
      {{msg}}
    </div>
    <div class="successMessage" v-else>
      <h2>Your account has been created!</h2>
      <p>A verification email has been sent to confirm your account. Follow the link to get started! (Check your spam folder if you do not see the email)</p>
    </div>
  </form>
</template>

<script>
import AuthService from 'src/services/AuthService'
import RegistrationService from 'src/services/RegistrationService'

export default {
  data() {
    return {
      msg: '',
      credentials: {
        email: '',
        password: ''
      },
      showingSuccess: false
    }
  },
  methods: {
    submit() {
      AuthService.register(this, {
        code: RegistrationService.data.registrationCode,
        email: this.credentials.email,
        password: this.credentials.password
      }).then(() => {
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
h2 {
  font-size: 24px;
  text-align: left;
  font-weight: 600;
  margin-bottom: 50px;
}

.form-signup {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  border-bottom: 3px solid black;
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
  margin: 10px auto 50px;
}

.form-control:focus {
  border-bottom: 3px solid black;
  box-shadow: none;
}

button[type="submit"] {
  width: 190px;
  background-color: #16D2AA;
  border: none;
  font-weight: 700;
}

.successMessage {
  text-align: left;
}

.successMessage h2 {
  color: #16D2AA;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
}
</style>
