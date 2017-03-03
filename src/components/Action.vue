<template></template>

<script>

import OnboardingService from '../services/OnboardingService';

import {router} from '../router'

// TODO: UserService to choose starting onboarding step based on user state

export default {
  mounted(){
    let action = this.$route.params.action,
        data = this.$route.params.data;

    if (action === 'verify'){
      OnboardingService.confirmVerification(this, data);
    } else {
      router.replace('/');
    }
  }
}
</script>

<style scoped>
</style>
