<template>
  <div>
    <send-verification v-if="$route.params.step === 'verify'" />
  </div>
</template>

<script>
import SendVerification from "./SendVerification";

export default {
  name: "onboarding-view",
  components: {
    SendVerification
  }
};
</script>

<style lang="scss" scoped></style>
