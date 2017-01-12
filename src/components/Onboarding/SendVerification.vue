<template>
  <div>
    <p>Your email has not been verified. Check your email for a link to confirm your account, or click below to send another verification email:</p>
    <a class="btn btn-default" href="#" role="button" @click="sendVerification">Send verification</a>
  </div>
</template>

<script>

import OnboardingService from '../../services/OnboardingService';

export default {
  methods: {
    sendVerification(){
      OnboardingService.sendVerification(this, '/');
    }
  }

}
</script>

<style scoped>
</style>
