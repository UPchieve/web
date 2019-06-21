<template>
  <form-page-template>
    <div class="Form">
      <div class="Form-header">
        <div class="Form-header-link--active">Log In</div>
        <router-link to="signup" class="Form-header-link">Sign Up</router-link>
      </div>

      <div class="Form-body">
        <div
          v-if="error || $route.query['401'] === 'true'"
          class="alert alert-danger"
          role="alert"
        >
          {{ error }}
        </div>

        <div class="column">
          <label for="inputEmail" class="Form-label">Email</label>
          <input
            id="inputEmail"
            v-model="credentials.email"
            type="email"
            class="Form-input"
            required
            autofocus
          />
        </div>

        <div class="column">
          <label for="inputPassword" class="Form-label">Password</label>
          <input
            id="inputPassword"
            v-model="credentials.password"
            type="password"
            class="Form-input"
            required
          />
          <router-link to="resetpassword" class="password-reset-link">
            Forgot password?
          </router-link>
        </div>

        <button
          class="Form-button"
          type="submit"
          @click.prevent="submit"
        >
          Login
        </button>
      </div>

      <form-footer />
    </div>
  </form-page-template>
</template>

<script>
import AuthService from 'src/services/AuthService'
import FormPageTemplate from './form/FormPageTemplate'
import FormFooter from './form/FormFooter'

export default {
  components: {
    FormPageTemplate,
    FormFooter
  },
  data () {
    let error
    if (this.$route.query['401'] === 'true') {
      error = 'Your session has expired. Please login again'
    }
    return {
      credentials: {
        email: '',
        password: ''
      },
      error
    }
  },
  methods: {
    submit () {
      AuthService.login(
        this,
        {
          email: this.credentials.email,
          password: this.credentials.password
        },
        this.$route.query.redirect || '/'
      )
    }
  },
  beforeRouteEnter (to, from, next) {
    if (AuthService.user.authenticated) {
      next({
        path: '/'
      })
    } else {
      next()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~src/scss/layout/form';

.alert {
  margin-bottom: 0;
}

.column {
  @include flex-container(column);
}

.password-reset-link {
  color: #73737a;
  font-size: 12px;
  text-align: left;
  margin-top: 6px;
}
</style>
