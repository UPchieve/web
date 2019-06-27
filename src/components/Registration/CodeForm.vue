<template>
  <form class="form-signup">
    <label for="inputRegistrationCode"
      >Please enter your registration code</label
    >
    <input
      id="inputRegistrationCode"
      v-model="registrationCode"
      type="text"
      class="form-control"
      required
      autofocus
    />
    <p class="no-code-link">
      <a href="https://upchieve.org/volunteer/">Don't have a code?</a>
    </p>
    <button
      class="btn btn-lg btn-primary btn-block"
      type="submit"
      @click.prevent="submit()"
    >
      ENTER
    </button>
    {{ msg }}
  </form>
</template>

<script>
import RegistrationService from 'src/services/RegistrationService'

export default {
  data () {
    return {
      registrationCode: '',
      msg: ''
    }
  },
  methods: {
    submit () {
      RegistrationService.checkCode(this, this.registrationCode).then(
        isValid => {
          if (!isValid) {
            this.msg = 'Sorry, that code is invalid'
          }
        }
      )
    }
  }
}
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 50px;
  margin-top: 50px;
}
.login-link {
  color: #73737a;
  font-weight: 600;
}
.registration-header {
  color: #16d2aa;
  font-weight: 600;
  padding-left: 140px;
}

.no-code-link {
  font-size: 12px;
  text-align: left;
  margin-bottom: 50px;
}

.no-code-link a {
  color: #73737a;
}

.form-signup {
  height: 100%;
  display: flex;
  flex-direction: column;
  max-width: 400px;
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
  border-bottom: 3px solid #16d2aa;
  margin-bottom: 50px;
}

.form-control:focus {
  border-bottom: 3px solid black;
  box-shadow: none;
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

#inputRegistrationCode {
  margin-bottom: 6px;
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
</style>
