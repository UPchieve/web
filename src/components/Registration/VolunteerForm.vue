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
.form-register {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 500px;
  height: 500px;
  margin: auto;
  background-color: white;
  padding: 0px 75px;
}


@media screen and (max-width: 488px) {
  .form-signup {
    margin: 0% auto !important;
  }
}
</style>
