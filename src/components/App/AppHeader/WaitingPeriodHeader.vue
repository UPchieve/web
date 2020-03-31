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
      // Display countdown as counting down from 5 to 1
      let countdown = Math.floor(this.convertMsToMinutes(timeLeft) + 1);
      const minuteTextFormat = countdown === 1 ? "minute" : "minutes";

      if (countdown > 5) {
        countdown = 5;
      }

      return `You must wait at least ${countdown.toFixed(
        0
      )} ${minuteTextFormat} before requesting a new session.`;
    }
  },
  methods: {
    convertMsToMinutes(time) {
      return time / 60000;
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
