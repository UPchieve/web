<template>
  <form class="form-resetpassword">
    <h2 class="form-resetpassword-heading">Reset Your Password</h2>
    <label for="inputEmail">Please enter your email address</label>
    <input
      id="inputEmail"
      v-model="credentials.email"
      type="text"
      class="form-control"
      required
      autofocus
    />
    <label for="inputPassword">Create a new password</label>
    <input
      id="inputPassword"
      v-model="credentials.password"
      type="password"
      class="form-control"
      required
    />
    <label for="inputPassword">Reenter your new password</label>
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
</template>

<script>
import AuthService from '../services/AuthService'

export default {
  data () {
    return {
      msg: '',
      credentials: {
        token: '',
        email: '',
        password: '',
        newpassword: ''
      }
    }
  },
  methods: {
    submit () {
      AuthService.confirmReset(this, {
        token: this.$route.params.token,
        email: this.credentials.email,
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

<style scoped>
h2 {
  font-size: 24px;
  text-align: left;
  font-weight: 600;
  margin-bottom: 50px;
}

.form-resetpassword {
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
  border-bottom: 3px solid black;
  margin-bottom: 50px;
}

.form-control:focus {
  border-bottom: 3px solid black;
  box-shadow: none;
}

button[type='submit'] {
  width: 190px;
  background-color: #16d2aa;
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
  color: #16d2aa;
  font-weight: 700;
}
</style>
