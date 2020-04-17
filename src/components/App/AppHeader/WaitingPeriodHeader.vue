<template>
  <div class="WaitingPeriod">
    <div v-if="mobileMode" class="WaitingPeriod-message--mobile">
      {{ message }}
    </div>
    <div v-else class="WaitingPeriod-message">{{ message }}</div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import calculateWaitingPeriodCountdown from "@/utils/calculate-waiting-period-countdown";

export default {
  name: "waiting-period-header",
  props: {
    headerData: Object
  },
  computed: {
    ...mapGetters({
      mobileMode: "app/mobileMode"
    }),
    message() {
      const { timeLeft } = this.headerData;
      const countdown = calculateWaitingPeriodCountdown(timeLeft);
      const minuteTextFormat = countdown === 1 ? "minute" : "minutes";

      return `You must wait at least ${countdown} ${minuteTextFormat} before requesting a new session.`;
    }
  }
};
</script>

<style lang="scss" scoped>
.WaitingPeriod {
  color: white;
  margin: 0 auto;
}

.WaitingPeriod-message {
  @include font-category("display-small");

  &--mobile {
    @include font-category("body");
  }
}
</style>
