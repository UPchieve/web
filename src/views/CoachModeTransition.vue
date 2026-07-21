<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { secondsInMs } from '@/utils/time-utils'
import NetworkService from '@/services/NetworkService'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

const router = useRouter()
const store = useStore()

const targetMode = 'volunteer'
const isSwitchModePromiseResolved = ref<boolean>(false)
const isSwitchModePromiseRejected = ref<boolean>(false)
const progress = ref<number>(0)
const TOTAL_TIME = secondsInMs(2)
const intervalId = ref<number | null>(null)
const readyToSwitch = ref<boolean>(false)

function tickProgressBar() {
  if (progress.value === 100) {
    clearInterval(intervalId)
    setInterval(() => {
      // make sure there's some buffer so that the progress bar animation finishes before we change screens
      readyToSwitch.value = true
    }, secondsInMs(0.5))
  } else {
    progress.value = progress.value + 1
  }
}

onMounted(() => {
  intervalId.value = setInterval(tickProgressBar, TOTAL_TIME / 100)
  NetworkService.switchActiveRole(targetMode)
    .then(() => {
      isSwitchModePromiseResolved.value = true
    })
    .catch(() => {
      isSwitchModePromiseRejected.value = true
    })
  // trigger confetti
  store.dispatch('celebrations/celebrate')
})

watch(
  [isSwitchModePromiseResolved, readyToSwitch],
  async ([isResolved, readyToSwitch]) => {
    if (isResolved && readyToSwitch) {
      await router.push('/dashboard')
    }
  }
)

watch(isSwitchModePromiseRejected, async (isRejected) => {
  if (isRejected) {
    setInterval(async () => {
      await router.push('/dashboard')
    }, secondsInMs(3))
  }
})
</script>

<template>
  <div v-if="!isSwitchModePromiseRejected" class="main-container">
    <div class="loader-container">
      <v-progress-linear
        class="loader"
        determinate
        :modelValue="progress"
        bgColor="#16D2AA"
        color="#16D2AA"
        :rounded="true"
        height="8"
      />
    </div>
    <h1>Building your coaching experience</h1>
  </div>
  <div class="main-container" v-else>
    <h1>There was an issue switching to Coach Mode.</h1>
    <span>Sending you back to your dashboard...</span>
  </div>
</template>

<style lang="scss" scoped>
h1 {
  font-weight: 600;
  color: $c-soft-black;
  width: 40%;
  text-align: center;

  @include breakpoint-below('medium') {
    width: 70%;
  }
}

.main-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 100%;
  justify-content: center;
  background-color: white;
  gap: 24px;
}

.loader-container {
  width: 50%;
}
</style>
