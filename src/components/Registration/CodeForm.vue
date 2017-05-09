<template>
  <form class="form-signup">
    <h2 class="form-signup-heading">Registration</h2>
    <label for="inputRegistrationCode">Please enter your registration code</label>
    <input type="text" id="inputRegistrationCode" class="form-control" required autofocus v-model="registrationCode">
    <button class="btn btn-lg btn-primary btn-block" type="submit" @click.prevent="submit()">Next</button>
    {{msg}}
    <div class="help-text">
      <p><a href="https://upchieve.org/students">Don't have a code?</a></p>
      <p>Have an account? <router-link to="login">Sign in!</router-link></p>
    </div>
  </form>
</template>

<script>
import RegistrationService from 'src/services/RegistrationService'

export default {
  data() {
    return {
      registrationCode: '',
      msg: ''
    }
  },
  methods: {
    submit() {
      RegistrationService.checkCode(this, this.registrationCode)
        .then((isValid) => {
          if (!isValid){
            this.msg = 'Sorry, that code is invalid';
          }
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
  max-width: 400px;
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

.form-control:focus {
  border-bottom: 3px solid black;
  box-shadow: none;
}

button[type="submit"] {
  width: 190px;
  background-color: #16D2AA;
  border: none;
  font-weight: 600;
}

.help-text {
  text-align: left;
  margin-top: 58px;
}

.help-text p {
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 300;
}

.help-text a {
  color: #16D2AA;
  font-weight: 700;
}
</style>
