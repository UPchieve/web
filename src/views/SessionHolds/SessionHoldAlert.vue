<script lang="ts" setup>
import Modal from '@/components/Modal.vue'
import SessionService from '@/services/SessionService'
import { socket } from '@/socket'
import Countdown from '@/components/Countdown.vue'
import { useStore } from 'vuex'
import { computed, onMounted } from 'vue'
import LargeButton from '@/components/LargeButton.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import * as PresenceService from '@/services/PresenceService'
const store = useStore()

const sessionHold = computed(
  () => store.getters['volunteer/currentSessionHold']
)
const studentFirstName = computed(
  () => sessionHold.value?.studentFirstName ?? 'Student'
)
const subjectDisplayName = computed(() => sessionHold.value?.subjectDisplayName)
const article = computed(() => {
  const firstLetter = Array.from(subjectDisplayName.value)[0]?.toLowerCase()
  return ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? 'an' : 'a'
})
const sessionId = computed(() => sessionHold.value?.id)
function onAcceptSession() {
  AnalyticsService.captureEvent(EVENTS.HOLDS_ACCEPTED_SESSION, {
    sessionId: sessionId.value,
  })
  store.commit('volunteer/setHideSessionHoldAlert', true) // prevents this alert from flickering
  SessionService.goToSession({
    id: sessionHold.value?.id,
    subTopic: sessionHold.value?.subTopic,
    type: sessionHold.value?.type,
  })
}

function onPassSession() {
  AnalyticsService.captureEvent(EVENTS.HOLDS_DISMISSED_HOLD, {
    sessionId: sessionId.value,
  })
  socket.emit('dismissSessionHold', { sessionId: sessionId.value })
  store.commit('volunteer/addDismissedSessionHold', sessionId.value)
  store.dispatch('app/modal/hide')
}

function onTimeout() {
  AnalyticsService.captureEvent(EVENTS.HOLDS_HOLD_TIMED_OUT, {
    sessionId: sessionId.value,
  })
}

const hold = computed(() => store.getters['volunteer/currentSessionHold'].hold)
const totalSeconds = Math.floor(
  (new Date(hold.value.endsAt).getTime() - new Date().getTime()) / 1000
)

onMounted(async () => {
  store.dispatch('volunteer/playAudio')
  AnalyticsService.captureEvent(EVENTS.HOLDS_SAW_SESSION_HOLD_ALERT, {
    sessionId: sessionId.value,
  })
  PresenceService.checkForInactivity()
})
</script>

<template>
  <Modal :closeModal="onPassSession" class="modal-container">
    <div class="content-container">
      <Countdown :size="70" :totalTicks="totalSeconds" @end="onTimeout" />
      <h1>
        {{ studentFirstName }} has requested {{ article }}
        {{ subjectDisplayName }} tutor
      </h1>
      <span
        >We're holding this session just for you! You have a limited time to
        accept this session before we pass it to another coach.</span
      >
    </div>
    <div class="buttons-container">
      <LargeButton variant="secondary" :showArrow="false" @click="onPassSession"
        >Pass to another coach</LargeButton
      >
      <LargeButton variant="primary" :showArrow="false" @click="onAcceptSession"
        >Accept and start</LargeButton
      >
    </div>
  </Modal>
</template>

<style lang="scss" scoped>
.content-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px;
}

.buttons-container {
  display: flex;
  flex-direction: row;
  align-self: center;
  gap: 16px;
  padding-bottom: 16px;
}
</style>
