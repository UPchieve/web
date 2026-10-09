<template>
  <form-page-template>
    <div class="uc-form">
      <h1 class="uc-form-header">Reset Your Password</h1>
      <div v-if="msg" class="alert alert-danger" role="alert">
        {{ msg }}
      </div>

      <form v-if="!showSuccess" autocomplete="off">
        <FormEmail
          v-model="credentials.email"
          placeholder="Enter your email address"
          is-autofocused
        />

        <FormPassword
          v-model="credentials.password"
          placeholder="Create a new password"
          show-password-requirements
        />

        <FormPassword
          v-model="credentials.newpassword"
          name="re-enter-password"
          label="Re-enter Password"
          placeholder="Re-enter your new password"
          :show-password-requirements="false"
        />

        <button class="uc-form-button" type="submit" @click.prevent="submit()">
          Reset Password
        </button>
        <RecaptchaCaption />

        <loader v-if="isResettingPassword" overlay />
      </form>

      <div v-else-if="showSuccess" class="success-message">
        <p>Your password has been successfully reset!</p>
        <large-button primary routeTo="/">{{ redirectText }}</large-button>
      </div>
    </div>
  </form-page-template>
</template>

<script>
import { mapState } from 'vuex'

import AuthService from '@/services/AuthService'
import FormEmail from '@/components/FormEmail.vue'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import FormPassword from '@/components/FormPassword.vue'
import LargeButton from '@/components/LargeButton.vue'
import Loader from '@/components/Loader.vue'
import LoggerService from '@/services/LoggerService'
import RecaptchaCaption from '@/components/recaptcha/RecaptchaCaption.vue'

export default {
  components: {
    RecaptchaCaption,
    FormEmail,
    FormPageTemplate,
    FormPassword,
    LargeButton,
    Loader,
  },
  props: {
    token: String,
  },
  data() {
    return {
      msg: '',
      credentials: {
        token: '',
        email: '',
        password: '',
        newpassword: '',
      },
      isResettingPassword: false,
      showSuccess: false,
    }
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
    redirectText() {
      return this.user ? 'Home' : 'Log in'
    },
  },
  methods: {
    submit() {
      this.isResettingPassword = true

      AuthService.confirmReset(this, {
        token: this.token,
        email: this.credentials.email,
        password: this.credentials.password,
        newpassword: this.credentials.newpassword,
      })
        .then(() => {
          this.isResettingPassword = false
          this.showSuccess = true
        })
        .catch((err) => {
          this.isResettingPassword = false
          this.msg = err?.response?.data?.err ?? 'Failed: Please try again.'
          if (err?.response?.status !== 422) {
            LoggerService.noticeError(err)
          }
        })
    },
  },
}
</script>

<style lang="scss" scoped>
.success-message {
  @include flex-container(column, center, center);
  margin: auto 0;
  padding: 50px;
}
</style>
