<template>
  <form class="form-signin">
        <h2 class="form-signin-heading">Register</h2>
        <label for="inputEmail" class="sr-only">Email address</label>
        <input type="email" id="inputEmail" class="form-control" placeholder="Email address" required autofocus v-model="credentials.email">
        <label for="inputPassword" class="sr-only">Password</label>
        <input type="password" id="inputPassword" class="form-control" placeholder="Password" required v-model="credentials.password">
        <button class="btn btn-lg btn-primary btn-block" type="submit" @click="submit()">Sign up</button>
      </form>
</template>

<script>
import AuthService from 'src/services/AuthService'

export default {
  data() {
    return {
      credentials: {
        email: '',
        password: ''
      }
    }
  },
  methods: {
    submit() {
      AuthService.register(this, {
        email: this.credentials.email,
        password: this.credentials.password
      })
    }
  }
}
</script>

<style scoped>
  .form-signin {
    max-width: 330px;
    padding: 15px;
    margin: 0 auto;
  }
  .form-signin .form-signin-heading,
  .form-signin .checkbox {
    margin-bottom: 10px;
  }
  .form-signin .checkbox {
    font-weight: normal;
  }
  .form-signin .form-control {
    position: relative;
    height: auto;
    -webkit-box-sizing: border-box;
       -moz-box-sizing: border-box;
            box-sizing: border-box;
    padding: 10px;
    font-size: 16px;
  }
  .form-signin .form-control:focus {
    z-index: 2;
  }
  .form-signin input[type="email"] {
    margin-bottom: -1px;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
  }
  .form-signin input[type="password"] {
    margin-bottom: 10px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
</style>
