<script lang="ts" setup>
import ScreenShareIcon from '@/assets/screen-share.svg'
import StopScreenShareIcon from '@/assets/stop-screen-share.svg'
import ErrorIcon from '@/assets/icons/exclamation.svg'
import Spinner from '@/components/Spinner.vue'
import { useStore } from 'vuex'
import { computed } from 'vue'
import { vTooltip } from 'maz-ui'

const props = defineProps<{
  hasMeetingEnded: boolean
  isViewingPartnerScreenShare: boolean
  isScreenSharing: boolean
  onClick: () => void
  tooltipPosition: 'top' | 'bottom'
  isLoading: boolean
  isLiveMediaBanned: boolean
  isError: boolean
  spinnerSizing: {
    height: number
    width: number
  }
}>()

const store = useStore()

const canShareYourScreen = computed((): boolean => {
  return (
    store.getters['user/isSessionAlive'] &&
    store.getters['user/isSessionMatched'] &&
    !props.hasMeetingEnded &&
    !props.isViewingPartnerScreenShare
  )
})

const errorTooltipText =
  'Could not load the screenshare tool. Please refresh the page and try again.'
const liveMediaBanTooltipText =
  'Screen share has been disabled due to potential policy violations.'

const screenshareUnavailableTooltipText = computed((): string => {
  if (!store.getters['user/isSessionMatched']) {
    return 'Screenshare will be available once a coach has joined your session'
  } else if (!store.getters['user/isSessionAlive']) {
    return 'Screenshare is not available once the session is over'
  } else if (props.isViewingPartnerScreenShare) {
    return 'You can screenshare once your partner stops sharing their screen'
  } else {
    return 'Screenshare is currently unavailable'
  }
})

const tooltip = {
  position: props.tooltipPosition,
}
</script>

<template>
  <Spinner
    v-if="props.isLoading"
    :containerHeight="props.spinnerSizing.height"
    :container-width="props.spinnerSizing.width"
    :width="props.spinnerSizing.width"
    :height="props.spinnerSizing.height"
  />
  <div
    v-else-if="props.isError || props.isLiveMediaBanned"
    v-tooltip="{
      ...tooltip,
      text: props.isError ? errorTooltipText : liveMediaBanTooltipText,
    }"
  >
    <ErrorIcon class="error-icon" />
  </div>
  <div v-else-if="canShareYourScreen">
    <button type="button" @click="onClick">
      <StopScreenShareIcon v-if="isScreenSharing" />
      <ScreenShareIcon v-else />
    </button>
  </div>
  <div
    v-else
    v-tooltip="{
      ...tooltip,
      text: screenshareUnavailableTooltipText,
    }"
  >
    <button type="button" :disabled="true">
      <ScreenShareIcon class="icon-disabled" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.icon-disabled {
  :deep(path) {
    stroke: $c-disabled-grey;
  }

  &:hover {
    cursor: auto;
    @supports (cursor: not-allowed) {
      cursor: not-allowed;
    }
  }
}

.error-icon {
  height: 20px;
  width: 20px;
  padding-bottom: 2px;
}
</style>
