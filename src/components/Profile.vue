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
      // if (!this.user.picture || this.user.picture === ''){
      //   this.msg = 'Please provide a picture';
      //   return;
      // }

      this.msg = 'Sending...';
      UserService.setProfile(this, this.user, OnboardingService.isOnboarded() ? null : '/');
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

  .form-signin {
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


  .form-signin .form-control:focus {
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

  button[type="submit"] {
    width: 190px;
    background-color: #16D2AA;
    border: none;
    font-weight: 600;
  }

  .help-text {
    margin-top: 58px;
    font-weight: 300;
    text-align: left;
  }

  .help-text a {
    color: #16D2AA;
    font-weight: 700;
  }
</style>
