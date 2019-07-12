<template>
  <form-page-template>
    <form class="uc-form">
      <div class="uc-form-header">
        <div class="uc-form-header-link--active">Reset Your Password</div>
        <div class="link-container">
          <router-link to="login" class="uc-form-header-link">Log In</router-link>
          <div>/</div>
          <router-link to="signup" class="uc-form-header-link">Sign Up</router-link>
        </div>
      </div>
      <div v-if="this.loggedIn === false">
        <div class="uc-form-body">
          <div class="uc-column">
            <label for="inputEmail" class="uc-form-label">Please enter your email address</label>
            <input
              id="inputEmail"
              v-model="email"
              type="email"
              class="uc-form-input"
              required
              autofocus
            />
          </div>
        </div>
        </div>
        <div v-else>
          Send password reset email to {{this.email}}?
        </div>
        <button
          class="uc-form-button"
          type="submit"
          @click.prevent="submit()"
        >
          SEND
        </button>
        
       <div class = "errors">
       <div v-if="msg !== ''">{{ msg }}</div>
       </div>
    </form>
  </form-page-template>
</template>

<script>
import AuthService from '@/services/AuthService'
import UserService from '@/services/UserService'
import FormPageTemplate from '@/components/FormPageTemplate'

export default {
  components: {
    FormPageTemplate
  },
  data () {
    return {
      /* allows differentiation between resetting password
      when logged in vs. forgetting password before logged in*/
      loggedIn: null,  
      email: '',
      msg: ''
    }
  },
  mounted () {
    let auth = UserService.getAuth()
    if (auth.authenticated) {
      let user = UserService.getUser()
      this.email = user.email
      this.loggedIn = true
    }
    else{
      this.loggedIn = false
    }
  },
  methods: {
    submit () {
      AuthService.sendReset(this, this.email).catch(err => {
          this.msg = err.message
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.link-container {
  @include flex-container(row, space-evenly);
  min-width: 150px;
}

@include breakpoint-below("tiny") {
  .uc-form-header {
    @include flex-container(column, center, center);
  }
}

.errors {
  padding: 20px;
  font-size: 16px;
  text-align: center;
}
</style>
