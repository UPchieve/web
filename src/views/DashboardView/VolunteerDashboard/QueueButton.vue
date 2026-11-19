<script lang="ts" setup>
import QueueRing from '@/assets/dashboard_icons/volunteer/queue-button-ring.svg'
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useStore } from 'vuex'
import TimeCounter from '@/components/TimeCounter.vue'
import {
  useSessionOfferStore,
  type QueueJoiningState,
} from '@/stores/session-offer'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const store = useStore()
const sessionOfferStore = useSessionOfferStore()
const { queueJoiningState, inQueueSince } = storeToRefs(sessionOfferStore)
const prefersReducedMotion = computed(
  (): boolean => store.state.app.prefersReducedMotion
)
const RADAR_RING_COUNT = 3
const isPending = computed(
  () =>
    queueJoiningState.value === 'joining' ||
    queueJoiningState.value === 'leaving'
)
const isSessionAlive = computed(
  (): boolean => store.getters['user/isSessionAlive']
)
const isDisabled = computed(() => isPending.value || isSessionAlive.value)

type QueueState = QueueJoiningState | 'disabled'
const queueState = computed((): QueueState => {
  return isSessionAlive.value ? 'disabled' : queueJoiningState.value
})
type ButtonAction = 'join queue' | 'leave queue' | 'none'
type ButtonState = {
  // null while a join or leave request is in flight
  action: ButtonAction | null
  text: string
  // a join or leave request failed; the button offers to try it again
  isFailed: boolean
}
const BUTTON_STATES: Record<QueueState, ButtonState> = {
  'not in queue': {
    action: 'join queue',
    text: 'Join queue',
    isFailed: false,
  },
  joining: {
    action: null,
    text: 'Joining',
    isFailed: false,
  },
  joined: {
    action: 'leave queue',
    text: 'Leave queue',
    isFailed: false,
  },
  leaving: {
    action: null,
    text: 'Leaving',
    isFailed: false,
  },
  'join failed': {
    action: 'join queue',
    text: 'Try again',
    isFailed: true,
  },
  'leave failed': {
    action: 'leave queue',
    text: 'Try again',
    isFailed: true,
  },
  disabled: {
    action: null,
    text: 'Unavailable during session',
    isFailed: false,
  },
}
const buttonState = computed(() => BUTTON_STATES[queueState.value])

async function onClick() {
  if (buttonState.value.action === 'join queue') {
    AnalyticsService.captureEvent(EVENTS.CLICKED_JOINED_QUEUE)
    await sessionOfferStore.joinQueue()
  } else if (buttonState.value.action === 'leave queue') {
    AnalyticsService.captureEvent(EVENTS.CLICKED_LEAVE_QUEUE)
    await sessionOfferStore.leaveQueue()
  }
}

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.SAW_QUEUE_BUTTON)
})
</script>

<template>
  <div
    class="main-container"
    :class="{
      'main-container--pending': isPending,
      'main-container--error': buttonState.isFailed,
      'main-container--animated': !prefersReducedMotion && !isDisabled,
    }"
  >
    <!-- pulsing radar rings while the coach is waiting in the queue -->
    <div
      v-if="queueState === 'joined' && !prefersReducedMotion"
      class="radar"
      aria-hidden="true"
    >
      <span v-for="ring in RADAR_RING_COUNT" :key="ring" class="radar__ring" />
    </div>
    <QueueRing class="queue-ring" />
    <button
      :disabled="isDisabled"
      @click="onClick"
      :class="{
        joined: queueState === 'joined',
        error: buttonState.isFailed,
      }"
      type="button"
    >
      <span v-if="queueState !== 'joined'">{{ buttonState.text }}</span>
      <!--      In the queue: show the time queued, and "Leave queue" on hover-->
      <span v-else class="joined-labels">
        <span class="joined-label joined-label--queued">
          Queued
          <TimeCounter :startedAt="inQueueSince ?? undefined" />
        </span>
        <span class="joined-label joined-label--leave">{{
          buttonState.text
        }}</span>
      </span>
      <span v-if="buttonState.isFailed" class="error-badge" aria-hidden="true"
        >!</span
      >
    </button>
  </div>
</template>

<style lang="scss" scoped>
.main-container {
  display: flex;
  align-items: center;
  justify-content: center;
  // own stacking context, so the radar can sit behind the ring (z-index: -1)
  // without dropping behind the card
  isolation: isolate;
}

// joining and leaving states: the hand-drawn yellow ring spins and wobbles
// while the request is in flight
.main-container--animated.main-container--pending
  .queue-ring
  :deep(path:first-child) {
  transform-box: view-box;
  transform-origin: 50% 50%;
  animation: ring-wobble 1.2s linear infinite;
}

@keyframes ring-wobble {
  0% {
    transform: rotate(0deg) scale(1.03, 0.97);
  }
  25% {
    transform: rotate(90deg) scale(0.97, 1.03);
  }
  50% {
    transform: rotate(180deg) scale(1.03, 0.97);
  }
  75% {
    transform: rotate(270deg) scale(0.97, 1.03);
  }
  100% {
    transform: rotate(360deg) scale(1.03, 0.97);
  }
}

// joined state: rings pulse out from the yellow ring and fade, like radar
.radar {
  --radar-color: #{$c-success-green};
  // the ring is 138 of the SVG's 168 viewBox units across
  --ring-size: calc(100% * 138 / 168);

  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.radar__ring {
  $duration: 2.4s;

  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--ring-size);
  height: var(--ring-size);
  border: 2px solid var(--radar-color);
  border-radius: 50%;
  box-shadow: 0 0 12px var(--radar-color);
  opacity: 0;
  transform: translate(-50%, -50%) scale(1);
  animation: radar-pulse $duration ease-out infinite;

  // spread the rings evenly across one pulse (3 = RADAR_RING_COUNT)
  @for $i from 2 through 3 {
    &:nth-child(#{$i}) {
      animation-delay: calc($duration * ($i - 1) / 3);
    }
  }
}

@keyframes radar-pulse {
  0% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.45);
  }
}
button {
  --width: 77px;
  --half-width: calc(var(--width) / 2);
  --margin: calc(-1 * var(--half-width));
  --box-shadow-color: #16173a;

  // Button shape and size
  width: var(--width);
  height: var(--width);
  margin: var(--margin) 0 0 var(--margin);
  border-width: 2px;
  box-shadow: 0 4px var(--box-shadow-color);
  padding: 0 4px;
  border-radius: 50%;

  // Font
  color: white;
  font-size: 18px;
  font-weight: $font-weight-medium;

  // Colors
  background-color: $c-information-blue;
  border-color: var(--box-shadow-color);
  // fade between the state colors (blue, green, red)
  transition: background-color 0.2s;
  &:hover {
    background: darken($c-information-blue, 15%);
    transition:
      background 0.3s,
      transform 0.1s,
      box-shadow 0.1s;
  }

  // Layout
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: absolute;
  left: 50%;
  top: 50%;
}

.joined {
  background-color: $c-success-green;
  color: $c-soft-black;
  &:hover {
    background-color: darken($c-success-green, 5%);
  }
}

// both joined labels sit in the same spot, so swapping them doesn't resize the button
.joined-labels {
  display: grid;
}

.joined-label {
  grid-area: 1 / 1;
  transition: opacity 0.15s;
}

.joined-label--leave {
  opacity: 0;
}

button:not(:disabled):is(:hover, :focus-visible) {
  .joined-label--queued {
    opacity: 0;
  }

  .joined-label--leave {
    opacity: 1;
  }
}

.error {
  background-color: $c-error-red;
  &:hover {
    background-color: darken($c-error-red, 10%);
  }
}

button:disabled,
button:disabled:hover {
  --box-shadow-color: #{$c-soft-black};
  background-color: $c-secondary-grey;
  border-color: var(--box-shadow-color);
  color: $c-disabled-grey;
  cursor: not-allowed;
}

// Smaller text for the long "Unavailable during session" label. "Joining" and
// "Leaving" (pending) are disabled too, but keep the normal size.
.main-container:not(.main-container--pending) button:disabled {
  font-size: 12px;
}

// the "!" badge on the button's top-right edge in the error state
.error-badge {
  --badge-size: 24px;
  --badge-offset: 29px;

  position: absolute;
  left: calc(50% + var(--badge-offset) - var(--badge-size) / 2);
  top: calc(50% - var(--badge-offset) - var(--badge-size) / 2);
  width: var(--badge-size);
  height: var(--badge-size);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--box-shadow-color);
  border-radius: 50%;
  background-color: white;
  color: $c-error-red;
  font-size: 16px;
  font-weight: $font-weight-bold;
  line-height: 1;
}

.main-container--animated.main-container--error {
  $shake-duration: 0.5s;

  button {
    --shake-distance: 4px;
    animation: shake $shake-duration ease-out;
  }

  .queue-ring :deep(path:first-child) {
    --shake-distance: calc(4px * 168 / 118);
    animation: shake $shake-duration ease-out;
  }
}

@keyframes shake {
  15% {
    translate: var(--shake-distance) 0;
  }
  35% {
    translate: calc(var(--shake-distance) * -0.75) 0;
  }
  55% {
    translate: calc(var(--shake-distance) * 0.75) 0;
  }
  75% {
    translate: calc(var(--shake-distance) * -0.35) 0;
  }
}
</style>
