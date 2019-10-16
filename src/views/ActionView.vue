<template>
  <div class="action" />
</template>

<script>
import OnboardingService from "@/services/OnboardingService";
import router from "@/router";

/**
 * @todo UserService to choose starting onboarding step based on user state
 */
export default {
  mounted() {
    const { action } = this.$route.params;
    const { data } = this.$route.params;

    if (action === "verify") {
      OnboardingService.confirmVerification(this, data);
    } else {
      router.replace("/");
    }
  }
};
</script>

<style lang="scss" scoped></style>
