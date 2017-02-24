<template>
  <div class="form-signin">
    <div class="alert alert-danger" role="alert" v-if="error">{{error}}</div>
    <h2 class="form-signin-heading">Log in</h2>
    <label for="inputEmail">Email</label>
    <input type="email" id="inputEmail" class="form-control" required autofocus v-model="credentials.email">
    <label for="inputPassword">Password</label>
    <input type="password" id="inputPassword" class="form-control" required v-model="credentials.password">
    <button class="btn btn-lg btn-primary btn-block" type="submit" @click.prevent="submit">Log in</button>
    <div class="help-text">
      <p>Don't have an account? <router-link to="signup">Register for one!</router-link></p>
    </div>
  </div>
</template>

<script>
import AuthService from 'src/services/AuthService'

export default {
  data() {
    return {
      credentials: {
        email: '',
        password: ''
      },
      error: ''
    }
  },
  methods: {
    submit() {
      AuthService.login(this, {
        email: this.credentials.email,
        password: this.credentials.password
      }, this.$route.query.redirect || '/')
    }
  },
  beforeRouteEnter(to, from, next) {
    if (AuthService.user.authenticated){
      next({
        path: '/'
      });
    } else {
      next();
    }
  }
}
</script>

<style scoped>
  h2 {
    font-size: 24px;
    text-align: left;
    font-weight: 700;
    margin-bottom: 50px;
  }

  .form-signin {
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


  .form-signin .form-control:focus {
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
    font-weight: 700;
  }

  .help-text {
    margin-top: 58px;
  }

  .help-text a {
    color: #16D2AA;
    font-weight: 900;
  }
</style>
