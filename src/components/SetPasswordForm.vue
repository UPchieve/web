<template>
<div class="background">
  <div class="reset-page">
    <form class="form-resetpassword">
      <h2 class="form-resetpassword-heading">Reset Your Password</h2>
      <label for="inputPassword">Create a new password</label>
      <input
        id="inputPassword"
        v-model="credentials.password"
        type="password"
        class="form-control"
        required
      />
      <label for="inputPassword">Re-enter your new password</label>
      <input
        id="inputPassword"
        v-model="credentials.newpassword"
        type="password"
        class="form-control"
        required
      />
      <p class="password-guidelines">
        It must contain lowercase and uppercase letters, numbers, and at least 8
        characters.
      </p>
      <button
        class="btn btn-lg btn-primary btn-block"
        type="submit"
        @click.prevent="submit()"
      >
        Reset Password
      </button>
      {{ msg }}
    </form>
  </div>
</div>  
</template>

<script>
import AuthService from '../services/AuthService'

export default {
  data () {
    return {
      msg: '',
      credentials: {
        token: '',
        password: '',
        newpassword: ''
      }
    }
  },
  methods: {
    submit () {
      AuthService.confirmReset(this, {
        token: this.$route.params.token,
        password: this.credentials.password,
        newpassword: this.credentials.newpassword
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

<style lang="scss" scoped>

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

h2 {
  font-size: 24px;
  text-align: left;
  font-weight: 600;
  margin-bottom: 50px;
}

.form-resetpassword {
  display: flex;
  flex-direction: column;
  width: 500px;
  height: 540px;
  margin: auto;
  background-color: white;
  padding: 0px 75px;
}

.form-resetpassword-heading {
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
  background-color:#16d2aa;
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

.reset-page {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100%;
}

</style>
