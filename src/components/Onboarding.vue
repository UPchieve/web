<template>
  <div>
    <send-verification v-if="$route.params.step === 'verify'"></send-verification>
    <complete-profile v-else-if="$route.params.step === 'profile'"></complete-profile>
  </div>
</template>

<script>

import SendVerification from './Onboarding/SendVerification';
import CompleteProfile from './Onboarding/CompleteProfile';

import OnboardingService from '../services/OnboardingService';

// TODO: UserService to choose starting onboarding step based on user state

export default {
  components: {
    SendVerification,
    CompleteProfile
  }
}
</script>

<style scoped>
</style>
