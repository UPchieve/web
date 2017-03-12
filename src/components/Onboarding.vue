<template>
  <div>
    <send-verification v-if="$route.params.step === 'verify'"></send-verification>
    <complete-profile v-else-if="$route.params.step === 'profile'"></complete-profile>
    <academic-survey v-else-if="$route.params.step === 'academic'"></academic-survey>
    <college-survey v-else-if="$route.params.step === 'college'"></college-survey>
  </div>
</template>

<script>

import SendVerification from './SendVerification';
import CompleteProfile from './Onboarding/Profile';
import AcademicSurvey from './Onboarding/Academic';
import CollegeSurvey from './Onboarding/College';

export default {
  components: {
    SendVerification,
    CompleteProfile,
    AcademicSurvey,
    CollegeSurvey
  }
}
</script>

<style scoped>
</style>
