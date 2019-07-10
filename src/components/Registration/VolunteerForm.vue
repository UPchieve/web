<template>
  <code-form v-if="!validRegistrationCode" />
  <volunteer-signup-form v-else />
</template>

<script>
import CodeForm from './CodeForm'
import VolunteerSignupForm from './VolunteerSignupForm'

import RegistrationService from '../../services/RegistrationService'

export default {
  components: {
    CodeForm,
    VolunteerSignupForm
  },
  data () {
    return RegistrationService.data
  }
}
</script>

<style lang="scss" scoped>
</style>
