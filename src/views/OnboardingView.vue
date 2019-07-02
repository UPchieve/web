<template>
  <div>
    <send-verification v-if="$route.params.step === 'verify'" />
    <complete-profile v-else-if="$route.params.step === 'profile'" />
    <academic-survey v-else-if="$route.params.step === 'academic'" />
  </div>
</template>

<script>
import SendVerification from '../components/SendVerification'
import CompleteProfile from '../components/Onboarding/Profile'
import AcademicSurvey from '../components/Onboarding/Academic'

export default {
  components: {
    SendVerification,
    CompleteProfile,
    AcademicSurvey
  }
}
</script>

<style lang="scss" scoped></style>
