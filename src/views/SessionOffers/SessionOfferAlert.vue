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
import type { SessionOffer } from '@/types/sessions'
const store = useStore()

const offer = computed<SessionOffer | null>(
  () => store.state.volunteer.sessionOffer
)
const studentFirstName = computed(
  () => offer.value?.studentFirstName ?? 'Student'
)
const subjectDisplayName = computed(() => offer.value?.subjectDisplayName)
const article = computed(() => {
  const firstLetter = Array.from<string>(
    subjectDisplayName.value ?? ''
  )[0]?.toLowerCase()
  return ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? 'an' : 'a'
})
const sessionId = computed(() => offer.value?.sessionId)

function captureEvent(event: string) {
  AnalyticsService.captureEvent(event, {
    sessionId: sessionId.value,
    countOfAvailableSessionsInList:
      store.getters['volunteer/availableSessions'].length,
    countOfExclusiveSessionsInList:
      store.getters['volunteer/exclusiveSessions'].length,
  })
}

function clearOffer() {
  store.commit('volunteer/clearSessionOffer', sessionId.value)
}

function onAcceptSession() {
  captureEvent(EVENTS.OFFERS_ACCEPTED_SESSION)
  const { sessionId: id, subject: subTopic, topic: type } = offer.value!
  clearOffer()
  SessionService.goToSession({ id, subTopic, type })
}

function onPassSession() {
  captureEvent(EVENTS.OFFERS_DECLINED_OFFER)
  socket.emit('session-offer:decline', { sessionId: sessionId.value })
  clearOffer()
}

function onTimeout() {
  captureEvent(EVENTS.OFFERS_OFFER_TIMED_OUT)
  clearOffer()
}

const totalSeconds = Math.floor(
  (new Date(offer.value!.expiresAt).getTime() - new Date().getTime()) / 1000
)

onMounted(async () => {
  store.dispatch('volunteer/playAudio')
  captureEvent(EVENTS.OFFERS_SAW_SESSION_OFFER_ALERT)
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
