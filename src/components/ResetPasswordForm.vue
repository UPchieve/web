<template>
  <div class="background">
    <form class="form-resetpassword">
      <div class="header">
        <div class="reset-header">Reset Your Password</div>
        <p><router-link
          to="signup"
          class="register-link">Register</router-link> /
          <router-link
            to="login"
            class="login-link">Log In</router-link></p>
      </div>
      <label for="inputEmail">Please enter your email address</label>
      <input
        id="inputEmail"
        v-model="email"
        type="text"
        class="form-control"
        required
        autofocus>
      <button
        class="btn btn-lg btn-primary btn-block"
        type="submit"
        @click.prevent="submit()">ENTER</button>
      {{ msg }}
    </form>
  </div>
</template>

<script>

import AuthService from '../services/AuthService';

export default {
  data() {
    return {
      email: '',
      msg: '',
    };
  },
  methods: {
    submit() {
      AuthService.sendReset(this, this.email);
    },
  },
};
</script>

<style scoped>

.background {
  display: flex;
  background-image: url('../assets/onboarding_background.png');
  background-size: cover;
  height: 100%;
  font-size: 16px;
  margin-left: -300px;
  position: relative;
  z-index: 2;
}

.form-resetpassword {
  display: flex;
  flex-direction: column;
  width: 500px;
  height: 500px;
  margin: auto;
  background-color: white;
  padding: 0px 75px;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 50px;
  margin-top: 75px;
}
.register-link, .login-link {
  color: #73737A;
  font-weight: 600;
}
.reset-header {
  color: #16D2AA;
  font-weight: 600;
}

.form-control {
  border: none;
  box-shadow: none;
  border-radius: 0;
}


.form-resetpassword .form-control:focus {
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

.form-control:focus {
  border-bottom: 3px solid black;
  box-shadow: none;
}

button[type="submit"] {
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
