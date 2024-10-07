<script setup lang="ts">
import Gleap from 'gleap'
import LoggerService from '../../services/LoggerService'
import { computed, onBeforeMount, ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import Errors from './Errors.vue'
import { useStore } from 'vuex'
import Banner from './Banner.vue'
import moment from 'moment'

const store = useStore()
const sessionId = computed(() => store.state.user.session.id)
const showHoursBanner = ref(true)

const UTChours = {
  start: 17,
  end: 3,
}

const localHours = computed(() => {
  return {
    start: moment(moment.utc().hour(UTChours.start)).local().format('hA'),
    end: moment(moment.utc().hour(UTChours.end)).local().format('hA'),
  }
})

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
    <Banner
      v-if="showHoursBanner"
      :dismiss="() => (showHoursBanner = false)"
      :message="`UPbot is only available to use from ${localHours.start} - ${localHours.end}`"
    />
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
