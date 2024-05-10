<template>
  <div class="notifications-container">
    <transition-group class="transition-group" name="list" tag="div">
      <attention-box
        v-for="notification in notifications"
        v-bind:key="notification.id"
        :notification="notification"
        :data-testid="`notification-${notification.id}`"
      />
    </transition-group>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import AttentionBox from './AttentionBox.vue'
export default {
  name: 'AttentionBoxes',
  components: {
    AttentionBox,
  },
  computed: {
    ...mapState({
      notifications: (state) => state.notifications.notifications,
    }),
  },
}
</script>

<style lang="scss" scoped>
.notifications-container {
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: get-z('modal');
  pointer-events: none;
  @include breakpoint-below('small') {
    left: 0;
  }
}
.transition-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.list-enter {
  opacity: 0;
}

.list-enter-active {
  animation: slide-in 0.3s ease-in-out forwards;
}

.list-leave-active {
  animation: slide-out 0.3s ease-in-out forwards;
}

.list-move {
  transition: transform 0.3s;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(200px);
  }
  to {
    opacity: 1;
    transform: translateY(0px);
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
