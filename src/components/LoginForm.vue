<template>
  <div class="background">
    <form class="form-signin">
      <div class="header">
        <div class="login-header">Log In</div>
        <router-link
          to="signup"
          class="register-link">Register an Account</router-link>
      </div>
      <div class="body">
        <div
          v-if="error || $route.query['401'] === 'true'"
          class="alert alert-danger"
          role="alert">{{ error }}</div>
        <label for="inputEmail">Email</label>
        <input
          id="inputEmail"
          v-model="credentials.email"
          type="email"
          class="form-control"
          required
          autofocus>
        <label for="inputPassword">Password</label>
        <input
          id="inputPassword"
          v-model="credentials.password"
          type="password"
          class="form-control password"
          required>
        <router-link
          to="resetpassword"
          class="password-reset-link">Forgot password?</router-link>
        <button
          class="btn btn-lg btn-primary btn-block login-btn"
          type="submit"
          @click.prevent="submit">LOGIN</button>
      </div>
      <div class="footer">
        <router-link
          to="/contact"
          tag="div"><a
            class="contact icon"
            target="_blank">CONTACT US</a></router-link>
        <router-link
          to="/legal"
          tag="div"><a
            class="privacy icon"
            target="_blank">LEGAL POLICY</a></router-link>
        <div><a
          href="https://upchieve.org/"
          target="_blank">OUR WEBSITE</a></div>
      </div>
    </form>
  </div>
</template>

<script>
import AuthService from 'src/services/AuthService';

export default {
  data() {
    let error;
    if (this.$route.query['401'] === 'true') {
      error = 'Your session has expired. Please login again';
    }
    return {
      credentials: {
        email: '',
        password: '',
      },
      error,
    };
  },
  methods: {
    submit() {
      AuthService.login(this, {
        email: this.credentials.email,
        password: this.credentials.password,
      }, this.$route.query.redirect || '/');
    },
  },
  beforeRouteEnter(to, from, next) {
    if (AuthService.user.authenticated) {
      next({
        path: '/',
      });
    }
    else {
      next();
    }
  },
};
</script>

<style scoped>
  .header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    margin-top: 50px;
  }
  .register-link {
    padding-left: 140px;
    color: #73737A;
    font-weight: 600;
  }
  .login-header {
    color: #16D2AA;
    font-weight: 600;
  }
  .password-reset-link {
    font-size: 12px;
    text-align: left;
    margin-bottom: 50px;
    color: #73737A;
  }
  .form-signin {
    display: flex;
    flex-direction: column;
    width: 500px;
    height: 500px;
    margin: auto;
    background-color: white;
    padding: 0px 75px;
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
    margin: 0px;
  }
  .form-control {
    border-bottom: 3px solid black;
    margin-bottom: 50px;
  }
  .form-control.password {
    margin-bottom: 6px;
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
    margin: 30px 0;
  }

  button[type="submit"]:hover, button[type="submit"]:active {
    color: white;
    background-color: #16D2AA;
  }

  .help-text {
    margin-top: 58px;
    font-weight: 300;
    text-align: left;
  }

  .help-text a {
    color: #16D2AA;
    font-weight: 700;
  }

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

  .footer {
    display: flex;
    font-weight: 600;
    font-size: 12px;
    justify-content: space-around;
    width: 500px;
    height: 40px;
    align-items: center;
    align-self: center;
    padding: 0 50px;
    background-color: #F6F6F6;
    border-top: 0.5px solid #CCCCCF;
  }

  .footer a {
    color: #73737A;
  }

</style>
