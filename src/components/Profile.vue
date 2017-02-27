<template>
  <div>
    <p v-if="isOnboarding">Please complete your profile</p>
    Name: <input v-model="user.name" placeholder="Your name">
    Picture URL: <input v-model="user.picture" placeholder="URL">
    <a class="btn btn-default" href="#" role="button" @click.prevent="submitProfile">Finish</a>
    <br />
    {{msg}}
  </div>
</template>

<script>

import UserService from '../services/UserService'
import AuthService from '../services/AuthService'
import OnboardingService from '../services/OnboardingService'

export default {
  data() {
    return {
      isOnboarding: this.$route.path.indexOf('/onboarding') === 0,
      user: AuthService.user,
      msg: ''
    }
  },
  methods: {
    submitProfile(e){
      this.msg = ''
      if (!this.user.name || this.user.name === ''){
        this.msg = 'Please provide a first and last name';
        return;
      }
      if (!this.user.picture || this.user.picture === ''){
        this.msg = 'Please provide a picture';
        return;
      }

      this.msg = 'Sending...';
      UserService.setProfile(this, this.user, OnboardingService.isOnboarded() ? null : '/');
    }
  }
}
</script>

<style scoped>
</style>
