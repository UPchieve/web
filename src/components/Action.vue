<template/>

<script>

import OnboardingService from '../services/OnboardingService';

import { router } from '../router';

// TODO: UserService to choose starting onboarding step based on user state

export default {
  mounted() {
    const action = this.$route.params.action;


    const data = this.$route.params.data;

    if (action === 'verify') {
      OnboardingService.confirmVerification(this, data);
    } else {
      router.replace('/onboarding/profile');
    }
  },
};
</script>

<style scoped>
</style>
