<template>
  <div class="attention-box">
    <component v-if="notification.icon" :is="notification.icon" class="icon" />
    <div class="title">{{ notification.title }}</div>
    <div v-if="othersWaiting" class="chip">
      {{ othersWaiting }} more waiting
    </div>
    <div v-if="notification.description" class="description">
      {{ notification.description }}
    </div>
    <div v-if="notification.cta || notification.secondaryCta" class="footer">
      <large-button
        v-if="notification.secondaryCta"
        class="cta-secondary-action"
        variant="secondary"
        @click="clickSecondaryCta"
        :showArrow="false"
        >{{ notification.secondaryCta.text }}</large-button
      >
      <large-button
        v-if="notification.cta"
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
import { mapActions } from 'pinia'
import { useNotificationsStore } from '@/stores/notifications'
import LargeButton from '@/components/LargeButton.vue'
import AnalyticsService from '@/services/AnalyticsService'

export default {
  components: { LargeButton },
  props: {
    notification: {
      type: Object,
      required: true,
    },
    othersWaiting: Number,
  },
  data() {
    return {
      timeoutId: null,
    }
  },
  methods: {
    ...mapActions(useNotificationsStore, ['remove']),
    clickCta() {
      AnalyticsService.captureEvent(
        EVENTS.VOLUNTEER_JOINED_SESSION_FROM_NOTIFICATION
      )
      this.notification.cta.action()
      this.close()
    },
    clickSecondaryCta() {
      this.notification.secondaryCta.action?.()
      this.dismiss()
    },
    dismiss() {
      AnalyticsService.captureEvent(EVENTS.VOLUNTEER_DISMISSED_NOTIFICATION)
      this.close()
    },
    close() {
      clearTimeout(this.timeoutId)
      this.remove(this.notification.id)
    },
  },
  mounted() {
    this.timeoutId = setTimeout(() => {
      AnalyticsService.captureEvent(
        EVENTS.NOTIFICATION_AUTO_CLOSED_AFTER_DURATION_REACHED
      )
      this.remove(this.notification.id)
    }, this.notification.duration || 3000)
  },
  beforeUnmount() {
    clearTimeout(this.timeoutId)
  },
}
</script>

<style lang="scss" scoped>
.attention-box {
  background: white;
  border: 2px solid $c-soft-black;
  border-radius: 16px;
  box-shadow: -6px 6px 0 $c-soft-black;
  pointer-events: auto;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 4px 16px;
  padding: 20px;
}

.icon {
  grid-row: span 2;
  width: 52px;
  height: 52px;
}

.title {
  @include font-category('display-small');
  grid-column: 2;
}

.chip {
  @include font-category('caption');
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  align-self: start;
  padding: 4px 12px;
  border-radius: 999px;
  background: $c-background-grey;
}

.description {
  @include font-category('body');
  color: $c-default-grey;
  grid-column: 2/-1;
}

.footer {
  grid-column: 1/-1;
  display: flex;
  justify-content: end;
  gap: 12px;
  margin-top: 36px;
}
.cta-action {
  background-color: $button-primary-bg;
  &:hover,
  &:active {
    background-color: $button-primary-bg-hover;
  }
}
</style>
