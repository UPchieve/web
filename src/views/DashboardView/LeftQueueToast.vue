<script lang="ts" setup>
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Toast from '@/components/Toast.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import {
  useSessionOfferStore,
  type LeaveQueueReason,
} from '@/stores/session-offer'

const sessionOfferStore = useSessionOfferStore()
const { leftQueueReason } = storeToRefs(sessionOfferStore)

const AUTO_DISMISS_MS = 5000
const COACH_CHOSE_TO_LEAVE = new Set<LeaveQueueReason>([
  'manually exited queue',
  'switched role',
])

if (leftQueueReason.value !== 'switched role') {
  sessionOfferStore.clearLeftQueueReason()
}

watch(leftQueueReason, (reason) => {
  if (reason !== 'inactive') return
  AnalyticsService.captureEvent(EVENTS.OFFERS_SAW_INACTIVE_LEFT_QUEUE_TOAST)
})

const message = computed(() => {
  if (leftQueueReason.value === 'inactive') {
    return "We took you out of the queue due to inactivity. Join again whenever you're ready."
  }
  return 'You have left the queue.'
})

const durationMs = computed(() => {
  if (!leftQueueReason.value) return undefined
  if (!COACH_CHOSE_TO_LEAVE.has(leftQueueReason.value)) return undefined
  return AUTO_DISMISS_MS
})

const isOpen = computed({
  get: () => leftQueueReason.value != null,
  set: (open: boolean) => {
    if (open) return
    sessionOfferStore.clearLeftQueueReason()
  },
})
</script>

<template>
  <Toast v-model:isOpen="isOpen" :message="message" :durationMs="durationMs" />
</template>
