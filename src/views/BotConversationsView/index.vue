<script setup lang="ts">
import Gleap from 'gleap'
import LoggerService from '../../services/LoggerService'
import { computed, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import Errors from './Errors.vue'
import { useStore } from 'vuex'

const store = useStore()
const sessionId = computed(() => store.state.user.session.id)
const cooldownMinutes = computed(
  () => store.getters['session/sessionRequestCooldownMinutes']
)
const waitingPeriodTimeoutId = ref<null | number>(null)
const latestSession = computed(() => store.state.session.latestSession)

onBeforeMount(async () => {
  if (sessionId.value) {
    store.dispatch('app/header/show', { component: 'RejoinSessionHeader' })
  }
  try {
    Gleap.showFeedbackButton(false)
  } catch {
    LoggerService.noticeError('Failed when hiding Gleap feedback button')
  }
})

onBeforeUnmount(() => {
  clearTimeout(waitingPeriodTimeoutId.value)
})

watch(sessionId, (id) => {
  if (id) {
    store.dispatch('app/header/show', { component: 'RejoinSessionHeader' })
  }
})

watch(latestSession, () => {
  if (cooldownMinutes.value && !sessionId.value) {
    const cooldownMs = cooldownMinutes.value * 1000 * 60
    const waitingHeaderData = {
      component: 'WaitingPeriodHeader',
      data: {
        timeLeft: cooldownMinutes.value,
      },
    }
    const defaultHeaderData = { component: 'DefaultHeader' }

    store.dispatch('app/header/show', waitingHeaderData)
    waitingPeriodTimeoutId.value = setTimeout(() => {
      store.dispatch('app/header/show', defaultHeaderData)
    }, cooldownMs)
  }
})
</script>

<template>
  <div class="layout">
    <Errors />
    <RouterView></RouterView>
  </div>
</template>

<style scoped lang="scss">
.layout {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fbfbfc;
  position: relative;
}
</style>
