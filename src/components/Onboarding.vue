<template>
  <div>
    <send-verification v-if="$route.params.step === 'verify'"></send-verification>
    <complete-profile v-else-if="$route.params.step === 'profile'"></complete-profile>
  </div>
</template>

<script>

import SendVerification from './Onboarding/SendVerification';
import CompleteProfile from './Profile';

export default {
  components: {
    SendVerification,
    CompleteProfile
  }
}
</script>

<style scoped>
</style>
