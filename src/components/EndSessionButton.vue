<script lang="ts" setup>
import { useStore } from 'vuex'
import SessionService from '@/services/SessionService'
import ModalService from '@/services/ModalService'
import { computed } from 'vue'
import LargeButton from '@/components/LargeButton.vue'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'

const props = defineProps({
  variant: {
    type: String,
    default: 'tertiary',
  },
  endText: {
    type: String,
    default: 'End Session',
  },
  icon: {
    type: String,
    required: false,
  },
})

const store = useStore()
const isSessionWaitingForVolunteer = computed(
  () => store.getters['user/isSessionWaitingForVolunteer']
)
const isSessionOver = computed(() => store.getters['user/isSessionOver'])
const isSessionAlive = computed(() => store.getters['user/isSessionAlive'])
const session = computed(() => store.state.user.session)

function finish() {
  SessionService.postSessionRedirect(session.value)
}

function emitEndSessionConfirmationEvent() {
  AnalyticsService.captureEvent(EVENTS.CLICKED_CONFIRM_END_SESSION, {
    sessionId: store.state.user.session?.id,
    userType: store.getters['user/userType'],
  })
}
async function end() {
  if (isSessionWaitingForVolunteer.value) {
    const shouldEndSession = await ModalService.showConfirm(
      'Cancel Request',
      "Are you sure you want to cancel this request? If you've been waiting less than 5 minutes, you won't be able to make another request right away.",
      {
        acceptText: 'Yes, Cancel Session',
        acceptButtonVariant: 'danger',
        backText: 'No, Go Back',
      }
    )

    if (!shouldEndSession) return
  } else {
    // Only ask for confirmation if session hasn't been ended by other user.
    const shouldEndSession = isSessionAlive.value
      ? await ModalService.showConfirm(
          'End Session',
          'Do you really want to end the session?',
          {
            acceptText: 'Yes, End Session',
            acceptButtonVariant: 'danger',
            backText: 'No, Go Back',
          }
        )
      : true

    // Early exit if user didn't confirm
    if (!shouldEndSession) return

    emitEndSessionConfirmationEvent()
  }

  await SessionService.endAndExitSession()
}
</script>
<template>
  <large-button
    v-if="isSessionWaitingForVolunteer"
    @click="end"
    type="button"
    :variant="props.variant"
    data-testid="cancel-session-button"
    >Cancel</large-button
  >
  <large-button v-else-if="isSessionOver" @click="finish" type="button"
    >Finish</large-button
  >
  <large-button class="end-session-button" v-else @click="end" type="button">
    <component v-if="props.icon" :is="props.icon" />
    {{ props.endText }}
  </large-button>
</template>

<style lang="scss" scoped>
.end-session-button {
  border-color: $c-error-red;
  color: $c-error-red;
}
</style>
