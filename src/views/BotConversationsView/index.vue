<script setup lang="ts">
import Gleap from 'gleap'
import LoggerService from '../../services/LoggerService'
import { computed, onBeforeMount, watch } from 'vue'
import { RouterView } from 'vue-router'
import Errors from './Errors.vue'
import { useStore } from 'vuex'

const store = useStore()
const sessionId = computed(() => store.state.user.session.id)
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

watch(sessionId, (id) => {
  if (id) {
    store.dispatch('app/header/show', { component: 'RejoinSessionHeader' })
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
  background-color: #fbfbfc;
  position: relative;
}
</style>
