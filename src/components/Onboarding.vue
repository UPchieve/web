<template>
  <onboarding-step></onboarding-step>
</template>

<script>

import SendVerification from './Onboarding/SendVerification';

// TODO: UserService to choose starting onboarding step based on user state

export default {
  components: {
    OnboardingStep: SendVerification // TODO: Dynamically switch components to next onboarding step
  }
}
</script>

<style scoped>
</style>
