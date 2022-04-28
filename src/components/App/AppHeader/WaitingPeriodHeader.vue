<template>
  <div class="WaitingPeriod">
    <div v-if="mobileMode" class="WaitingPeriod-message--mobile">
      {{ message }}
    </div>
    <div v-else class="WaitingPeriod-message">{{ message }}</div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import calculateWaitingPeriodCountdown from '@/utils/calculate-waiting-period-countdown'

export default {
  name: 'waiting-period-header',
  props: {
    headerData: Object
  },
  computed: {
    ...mapGetters({
      mobileMode: 'app/mobileMode'
    }),
    message() {
      // TODO: implement a better timer and transition to the default header from this timer
      // instead of from within the dashboard
      const { timeLeft } = this.headerData
      const countdown = calculateWaitingPeriodCountdown(timeLeft)
      const minuteTextFormat = countdown === 1 ? 'minute' : 'minutes'

      return `You must wait at least ${countdown} ${minuteTextFormat} before requesting a new session.`
    }
  }
}
</script>

<style lang="scss" scoped>
.WaitingPeriod {
  margin: 0 auto;

  @include header-child;
  background-color: $c-warning-orange;
}

.WaitingPeriod-message {
  @include font-category('display-small');
  color: white;

  &--mobile {
    @include font-category('body');
  }
}
</style>
