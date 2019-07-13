<template>
  <div class="uc-form-body">
    <div class="uc-column">
      <label for="inputRegistrationCode" class="uc-form-label">
        Please enter your registration code
      </label>
      <input
        id="inputRegistrationCode"
        type="text"
        class="uc-form-input"
        v-model="registrationCode"
        required
        autofocus
      />
      <p class="uc-form-subtext">
        <a href="https://upchieve.org/volunteer/">Don't have a code?</a>
      </p>
    </div>

    <button
      class="uc-form-button"
      type="submit"
      @click.prevent="submit()"
    >
      Enter
    </button>

    <div v-if="msg !== ''">{{ msg }}</div>
  </div>
</template>

<script>
import RegistrationService from '@/services/RegistrationService'

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
</style>
