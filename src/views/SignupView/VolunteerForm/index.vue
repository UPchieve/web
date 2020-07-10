<template>
  <code-form v-if="!isValidRegistrationCode" />
  <volunteer-signup-form v-else />
</template>

<script>
import CodeForm from "./CodeForm";
import VolunteerSignupForm from "./VolunteerSignupForm";

import RegistrationService from "@/services/RegistrationService";

export default {
  components: {
    CodeForm,
    VolunteerSignupForm
  },
  data() {
    return RegistrationService.data;
  },
  created() {
    if (this.isValidRegistrationCode)
      this.$router.push("/sign-up/volunteer/account");
    else this.$router.push("/sign-up/volunteer/registration-code");
  }
};
</script>

<style lang="scss" scoped></style>
