<template>
  <form-page-template>
    <div class="uc-form">
      <h1 class="uc-form-header">Reset Your Password</h1>
      <p v-if="!error && !msg" class="uc-form-text">
        Enter the email associated with your account and we'll email
        instructions to reset your password.
      </p>

      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <div v-if="msg" class="uc-form-text message">{{ msg }}</div>

      <form v-else>
        <div class="uc-form-element">
          <label for="inputEmail" class="uc-form-label">Email</label>
          <input
            id="inputEmail"
            class="uc-form-text-input"
            type="email"
            placeholder="Enter your email address"
            v-model="email"
            required
            autofocus
          />
        </div>

        <button
          class="uc-form-button"
          type="submit"
          @click.prevent="submit()"
          :disabled="isSendingEmail"
        >
          Send
        </button>
      </form>

      <loader v-if="isSendingEmail" overlay />
      <p v-if="!error && !msg" class="uc-form-text">
        Remember your password?
        <router-link to="/login" class="uc-link">Log In</router-link>
      </p>
    </div>
  </form-page-template>
</template>

<script>
import AuthService from '@/services/AuthService'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import Loader from '@/components/Loader.vue'
import LoggerService from '@/services/LoggerService'

export default {
  components: {
    FormPageTemplate,
    Loader,
  },
  created() {
    this.$store.dispatch('app/hideNavigation')
  },
  data() {
    return {
      email: '',
      msg: '',
      error: '',
      isSendingEmail: false,
    }
  },
  methods: {
    submit() {
      this.isSendingEmail = true
      this.error = ''
      AuthService.sendReset(this, this.email)
        .then(() => (this.isSendingEmail = false))
        .catch(err => {
          this.error = err?.response?.data?.err ?? 'Failed: Please try again.'
          this.isSendingEmail = false
          if (err?.response?.status !== 422) {
            LoggerService.noticeError(err)
          }
        })
    },
  },
}
</script>

<style lang="scss" scoped>
.uc-form-text {
  text-align: center;

  &.message {
    margin-top: 40%;
  }
}
</style>
