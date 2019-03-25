<template>
  <div>
    <send-verification v-if="$route.params.step === 'verify'" />
    <complete-profile v-else-if="$route.params.step === 'profile'" />
    <academic-survey v-else-if="$route.params.step === 'academic'" />
  </div>
</template>

<script>
import SendVerification from './SendVerification'
import CompleteProfile from './Onboarding/Profile'
import AcademicSurvey from './Onboarding/Academic'

export default {
  components: {
    SendVerification,
    CompleteProfile,
    AcademicSurvey
  }
}
</script>

<style scoped></style>
