<script lang="ts" setup>
import config from '../../config'
import { ref } from 'vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '../../consts'

const props = defineProps<{
  message: { contents: string }
  isSender?: boolean
}>()
const playbackRateOptions = ref([0.5, 1, 1.25, 1.5, 2])
const playbackRate = ref(1)

function trackPlay() {
  if (typeof props.isSender === 'boolean') {
    const event = props.isSender
      ? EVENTS.VOICE_MESSAGE_PLAYED_OWN_MESSAGE_IN_CHAT
      : EVENTS.VOICE_MESSAGE_PLAYED_PARTNER_MESSAGE_IN_CHAT
    AnalyticsService.captureEvent(event)
  }
}
</script>
<template>
  <div :class="{ self: isSender }">
    <audio
      controls
      preload="auto"
      class="controls"
      :onplay="trackPlay"
      :playbackRate="playbackRate"
      controlsList="noplaybackrate nodownload"
    >
      <source
        type="audio/webm; codecs=opus"
        :src="`${config.serverRoot}/api/voice-messages/${props.message.contents}`"
      />
      <source
        type="audio/mp4;"
        :src="`${config.serverRoot}/api/voice-messages/${props.message.contents}`"
      />
    </audio>
    <div class="speed">
      speed
      <div class="wrapper">
        <select v-model="playbackRate">
          <option
            v-for="option in playbackRateOptions"
            :value="option"
            :key="option"
          >
            x{{ option }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.controls {
  max-width: 100%;
}

.speed {
  font-size: 12px;
  display: flex;
  justify-content: end;
  gap: 4px;
  align-items: center;
}

.wrapper {
  position: relative;
  select {
    -webkit-appearance: none;
    padding: 4px;
    border-radius: 4px;
    border: 1px solid #bcbcc8;
  }
  &::before {
    content: '▾';
    position: absolute;
    right: 4px;
    top: 2px;
    pointer-events: none;
  }
}

audio::-webkit-media-controls-panel {
  background-color: #f1f3f6;
}
.self {
  audio::-webkit-media-controls-panel {
    background-color: #e3f2fd;
  }
}
</style>
