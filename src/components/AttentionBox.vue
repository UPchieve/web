<template>
  <div class="attention-box">
    <template v-if="mobileMode">
      <div class="header">
        <div class="title">
          <component v-if="notification.icon" :is="notification.icon" />
          {{ notification.title }}
        </div>
        <cross-icon @click="dismiss" class="close-button" />
      </div>
    </template>

    <template v-else>
      <div class="header">
        <cross-icon @click="dismiss" class="close-button" />
      </div>
      <div class="title">
        <component v-if="notification.icon" :is="notification.icon" />
        {{ notification.title }}
      </div>
    </template>

    <div v-if="notification.description" class="description">
      {{ notification.description }}
    </div>
    <div v-if="notification.cta" class="footer">
      <large-button
        class="cta-action"
        @click="clickCta"
        primary
        :showArrow="false"
        >{{ notification.cta.text }}</large-button
      >
    </div>
  </div>
</template>

<script>
import { EVENTS } from '@/consts'
import { mapGetters } from 'vuex'
import CrossIcon from '@/assets/cross.svg'
import LargeButton from '@/components/LargeButton.vue'
import AnalyticsService from '@/services/AnalyticsService'

export default {
  components: { CrossIcon, LargeButton },
  props: {
    notification: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      timeoutId: null,
    }
  },

  computed: {
    ...mapGetters({ mobileMode: 'app/mobileMode' }),
  },
  methods: {
    clickCta() {
      AnalyticsService.captureEvent(
        EVENTS.VOLUNTEER_JOINED_SESSION_FROM_NOTIFICATION
      )
      this.notification.cta.action()
      this.close()
    },
    dismiss() {
      AnalyticsService.captureEvent(EVENTS.VOLUNTEER_DISMISSED_NOTIFICATION)
      this.close()
    },
    close() {
      clearTimeout(this.timeoutId)
      this.$store.dispatch('notifications/remove', this.notification.id)
    },
  },
  mounted() {
    this.timeoutId = setTimeout(() => {
      AnalyticsService.captureEvent(
        EVENTS.NOTIFICATION_AUTO_CLOSED_AFTER_DURATION_REACHED
      )
      this.$store.dispatch('notifications/remove', this.notification.id)
    }, this.notification.duration || 3000)
  },
  beforeUnmount() {
    clearTimeout(this.timeoutId)
  },
}
</script>

<style lang="scss" scoped>
.attention-box {
  width: fit-content;
  background-color: $c-backdrop-translucent;
  margin-bottom: 12px;
  margin-right: 12px;
  border-radius: 8px;
  box-shadow: 3px 3px 3px $c-shadow-header;
  pointer-events: auto;

  @include breakpoint-below('small') {
    margin-right: 0;
    width: 100%;
  }
}

.header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 8px;
  @include breakpoint-below('small') {
    // padding: 0px;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
}
.title {
  @include font-category('subheading');
  font-size: 20px;
  line-height: 125%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-left: 24px;
  padding-right: 24px;
  padding-bottom: 12px;
  gap: 20px;
  @include breakpoint-below('small') {
    padding-bottom: 0;
    padding-left: 0;
    padding-right: 0;
    gap: 12px;
    font-size: 16px;
  }
}

.description {
  @include font-category('helper-text');
}

.close-button {
  transform: scale(0.625);
  fill: $c-secondary-grey;
}
.footer {
  display: flex;
  justify-content: flex-end;
  padding-left: 24px;
  padding-right: 24px;
  padding-bottom: 24px;
  @include breakpoint-below('small') {
    padding-left: 12px;
    padding-right: 12px;
    padding-bottom: 8px;
  }
}
.cta-action {
  background-color: $button-primary-bg;
  &:hover,
  &:active {
    background-color: $button-primary-bg-hover;
  }
}
</style>
