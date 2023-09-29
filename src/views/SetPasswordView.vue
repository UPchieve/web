<template>
  <form-page-template>
    <div class="uc-form">
      <h1 class="uc-form-header">Reset Your Password</h1>
      <div v-if="msg" class="alert alert-danger" role="alert">
        {{ msg }}
      </div>

      <form v-if="!showSuccess">
        <div class="uc-form-element">
          <label for="email">Email</label>
          <input
            id="email"
            class="uc-form-text-input"
            type="email"
            placeholder="Enter your email address"
            v-model="credentials.email"
            required
            autofocus
          />
        </div>

        <div class="uc-form-element">
          <label for="password">
            Password
          </label>
          <input
            id="password"
            class="uc-form-text-input"
            type="password"
            placeholder="Create a new password"
            v-model="credentials.password"
            required
          />
          <div class="metadata">
            Must have at least one number, one uppercase letter, one lowercase
            letter, and be at least 8 characters long.
          </div>
        </div>

        <div class="uc-form-element">
          <label for="re-enter-password">
            Re-enter Password
          </label>
          <input
            id="re-enter-password"
            class="uc-form-text-input"
            type="password"
            placeholder="Re-enter your new password"
            v-model="credentials.newpassword"
            required
          />
        </div>

        <button class="uc-form-button" type="submit" @click.prevent="submit()">
          Reset Password
        </button>

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
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import LargeButton from '@/components/LargeButton.vue'
import Loader from '@/components/Loader.vue'
import LoggerService from '@/services/LoggerService'

export default {
  components: {
    FormPageTemplate,
    LargeButton,
    Loader,
  },
  props: {
    token: String,
  },
  created() {
    this.$store.dispatch('app/hideNavigation')
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
      user: state => state.user.user,
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
        .catch(err => {
          this.isResettingPassword = false
          this.msg = err.message || err
          if (err.status !== 422) {
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
