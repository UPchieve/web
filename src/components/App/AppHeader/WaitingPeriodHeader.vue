<template>
  <div class="WaitingPeriod">
    <div class="WaitingPeriod-message" :class="{ mobile: mobileMode }">
      {{ message }}
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'waiting-period-header',
  computed: {
    ...mapGetters({
      mobileMode: 'app/mobileMode',
    }),
    ...mapState({
      cooldownMinutes: (state) => state.session.cooldownMinutes,
    }),
    message() {
      const minuteTextFormat = this.cooldownMinutes === 1 ? 'minute' : 'minutes'
      return `You must wait at least ${this.cooldownMinutes} ${minuteTextFormat} before requesting a new session.`
    },
  },
}
</script>

<style lang="scss" scoped>
.WaitingPeriod {
  @include header-child;
  @include flex-container(row, center, center);
  text-align: center;

  background-color: $c-warning-orange;
}

.WaitingPeriod-message {
  @include font-category('display-small');
  color: white;

  &.mobile {
    @include font-category('body');
  }
}
</style>
