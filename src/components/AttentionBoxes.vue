<template>
  <div class="notifications-container">
    <!--
      TODO: right now depth is sorted by oldest in front.
      we will need to special case exclusive and session offers
      to skip to the front
    -->
    <transition-group class="transition-group" name="list" tag="div">
      <attention-box
        v-for="(notification, index) in notifications"
        v-bind:key="notification.id"
        :notification="notification"
        :data-testid="`notification-${notification.id}`"
        :others-waiting="index ? 0 : othersWaiting"
        :style="{ '--depth': index }"
        :class="{
          'is-behind': index > 0,
          'is-hidden': index >= MAX_VISIBLE,
        }"
      />
    </transition-group>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { mapGetters } from 'vuex'
import { useNotificationsStore } from '@/stores/notifications'
import AttentionBox from './AttentionBox.vue'
export default {
  name: 'AttentionBoxes',
  components: {
    AttentionBox,
  },
  data() {
    return {
      MAX_VISIBLE: 3,
    }
  },
  computed: {
    ...mapState(useNotificationsStore, ['notifications']),
    ...mapGetters({ availableSessions: 'volunteer/availableSessions' }),
    othersWaiting() {
      const frontId = this.notifications[0]?.id
      return this.availableSessions.filter(({ id }) => id !== frontId).length
    },
  },
}
</script>

<style lang="scss" scoped>
.notifications-container {
  position: fixed;
  inset: auto 24px 24px auto;
  width: 480px;
  z-index: get-z('modal');
  pointer-events: none;
  @include breakpoint-below('small') {
    inset: auto 12px 24px;
    width: auto;
  }
}
.transition-group {
  display: grid;
  align-items: end;

  > * {
    grid-area: 1/1;
    z-index: calc(-1 * var(--depth));
    transform-origin: top;
    transform: translateY(calc(var(--depth) * -12px))
      scale(calc(1 - var(--depth) * 0.05));
    transition: 0.3s;
  }

  > .is-behind {
    pointer-events: none;
    background: $c-background-grey;
  }

  > .is-hidden {
    opacity: 0;
  }
}

.list-enter-active {
  animation:
    slide-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
    pop 0.6s;
}

.list-leave-active {
  animation: slide-out 0.3s ease-in-out forwards;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(260px);
  }
}

@keyframes pop {
  60% {
    scale: 1.05;
  }
}

@keyframes slide-out {
  from {
    opacity: 1;
    transform: translateX(0px);
  }
  to {
    opacity: 0;
    transform: translateX(400px);
  }
}
</style>
