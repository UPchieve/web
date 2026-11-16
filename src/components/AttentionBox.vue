<template>
  <div
    class="attention-box"
    :class="[notification.type, { 'is-urgent': isUrgent }]"
  >
    <component v-if="notification.icon" :is="notification.icon" class="icon" />
    <div v-if="notification.label" class="chip label">
      {{ notification.label }}
    </div>
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
        >{{ notification.secondaryCta.text }}
        <span v-if="notification.countdown" class="countdown"
          >{{ secondsLeft }}s</span
        ></large-button
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

const URGENT_SECONDS = 7

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
      intervalId: null,
      secondsLeft: Math.ceil(this.duration() / 1000),
    }
  },
  computed: {
    isUrgent() {
      return this.notification.countdown && this.secondsLeft < URGENT_SECONDS
    },
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
    duration() {
      return this.notification.duration || 3000
    },
  },
  mounted() {
    const endsAt = Date.now() + this.duration()
    this.timeoutId = setTimeout(() => {
      AnalyticsService.captureEvent(
        EVENTS.NOTIFICATION_AUTO_CLOSED_AFTER_DURATION_REACHED
      )
      this.notification.onExpire?.()
      this.remove(this.notification.id)
    }, this.duration())
    if (this.notification.countdown) {
      this.intervalId = setInterval(() => {
        this.secondsLeft = Math.ceil((endsAt - Date.now()) / 1000)
      }, 1000)
    }
  },
  beforeUnmount() {
    clearTimeout(this.timeoutId)
    clearInterval(this.intervalId)
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
  grid-row: span 3;
  align-self: center;
  width: 52px;
  height: 52px;
}

.label {
  grid-column: 2/-1;
  justify-self: start;
  text-transform: uppercase;
}

.countdown {
  margin-left: 8px;
  font-weight: normal;
  opacity: 0.7;
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
  background: rgb(0 0 0 / 8%);
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

.session-offer {
  --bg: #{$button-primary-bg};
  --fg: white;
  position: relative;
  background: var(--bg);
  color: var(--fg);

  &.is-urgent {
    --bg: #{$c-college};
    --fg: #{$c-soft-black};
  }

  .description {
    color: inherit;
  }

  .cta-secondary-action {
    background: rgb(0 0 0 / 10%);
    border-color: transparent;
    color: inherit;
  }

  .cta-action {
    background: var(--fg);
    color: var(--bg);
  }

  &.is-urgent .cta-action {
    color: white;
  }

  &::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    pointer-events: none;
    animation: flash 1.5s ease-out 2;
  }
}

@keyframes flash {
  from {
    box-shadow: 0 0 0 0 white;
  }
  to {
    box-shadow: 0 0 0 24px rgb(255 255 255 / 0);
  }
}
</style>
