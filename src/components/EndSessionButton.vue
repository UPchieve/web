<script lang="ts" setup>
import { useStore } from 'vuex'
import SessionService from '@/services/SessionService'
import { computed } from 'vue'
import LargeButton from '@/components/LargeButton.vue'

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
const isSessionEnding = computed(() => store.state.user.sessionIsEnding)
const session = computed(() => store.state.user.session)

function finish() {
  SessionService.postSessionRedirect(session.value)
}

function end() {
  if (isSessionEnding.value) {
    return
  }
  store.commit('user/setSessionIsEnding', true)

  if (isSessionWaitingForVolunteer.value) {
    const shouldEndSession = window.confirm(
      "Are you sure you want to cancel this request? If you've been waiting less than 5 minutes, you won't be able to make another request right away."
    )

    if (!shouldEndSession) {
      store.commit('user/setSessionIsEnding', false)
      return
    }
  } else {
    // Only ask for confirmation if session hasn't been ended by other user.
    const shouldEndSession = isSessionAlive.value
      ? window.confirm('Do you really want to end the session?')
      : true

    // Early exit if user didn't confirm
    if (!shouldEndSession) {
      store.commit('user/setSessionIsEnding', false)
      return
    }
  }

  SessionService.endAndExitSession()
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
