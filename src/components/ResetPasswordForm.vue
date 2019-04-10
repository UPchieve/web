<template>
  <div class="background">
    <form class="form-resetpassword">
      <div class="header">
        <div class="reset-header">Reset Your Password</div>
        <p>
          <router-link to="signup" class="register-link">Register</router-link>
          / <router-link to="login" class="login-link">Log In</router-link>
        </p>
      </div>
      <label for="inputEmail">Please enter your email address</label>
      <input
        id="inputEmail"
        v-model="email"
        type="text"
        class="form-control"
        required
        autofocus
      />
      <button
        class="btn btn-lg btn-primary btn-block"
        type="submit"
        @click.prevent="submit()"
      >
        ENTER
      </button>
      {{ msg }}
    </form>
  </div>
</template>

<script>
import AuthService from '../services/AuthService'

export default {
  data () {
    return {
      email: '',
      msg: ''
    }
  },
  methods: {
    submit () {
      AuthService.sendReset(this, this.email)
    }
  }
}
</script>

<style scoped>
/**
 * @todo {1} Consider refactoring (https://github.com/UPchieve/web/pull/84#discussion_r216185371)
 */
.background {
  display: flex;
  background-image: url('../assets/onboarding_background.png');
  background-size: cover;
  height: 100%;
  font-size: 16px;
  margin-left: -300px; /* {1} */
  position: relative;
  z-index: 2; /* {1} */
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
.register-link,
.login-link {
  color: #73737a;
  font-weight: 600;
}
.reset-header {
  color: #16d2aa;
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
  border-bottom: 3px solid #16d2aa;
  margin-bottom: 50px;
}

.form-control:focus {
  border-bottom: 3px solid black;
  box-shadow: none;
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
  color: #16d2aa;
  font-weight: 700;
}


@media screen and (max-width: 488px) {
  .form-resetpassword {
    width: 88% !important;
    height: auto !important;
    padding: 0em 1.5em !important;
  }

  .header {
    font-size: 1em !important;
    margin: 1.5em 0em 3em !important;
    padding: 0em !important;
  }

  .btn-block {
    margin-bottom: 4em !important;
  }
}
</style>
