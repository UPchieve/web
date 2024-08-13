<script lang="ts" setup>
import config from '../../config'
import { ref } from 'vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '../../consts'

const props = defineProps<{
  message: { contents: string; transcript?: string }
  isSender?: boolean
}>()
const playbackRateOptions = ref([0.5, 1, 1.25, 1.5, 2])
const playbackRate = ref(1)
const shouldShowTranscript = ref(true)
const toggleShowTranscript = () =>
  (shouldShowTranscript.value = !shouldShowTranscript.value)

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
  <div class="audio-container" :class="{ self: isSender }">
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
    <div class="transcript-container">
      <button
        v-if="props.message.transcript && !shouldShowTranscript"
        :onClick="toggleShowTranscript"
      >
        View Transcript
      </button>
      <div class="transcript" v-if="shouldShowTranscript">
        {{ props.message.transcript }}
      </div>
      <button v-if="shouldShowTranscript" :onClick="toggleShowTranscript">
        See Less
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.audio-container {
  display: grid;
  max-width: 100%;
  grid-template-columns: 1fr auto;
  grid-template-rows: 1fr auto;
  gap: 4px;
  align-items: center;
}

.controls {
  max-width: 100%;
}

.speed {
  position: relative;
  font-size: 12px;
  select {
    -webkit-appearance: none;
    appearance: none;
    padding: 4px;
    border-radius: 4px;
    border: 1px solid #bcbcc8;
    background-color: transparent;
    border: none;
    option {
      text-align: end;
    }
  }
  &::before {
    display: none;
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

.transcript-container {
  grid-column-start: span 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: end;
  font-size: 14px;
}

.transcript {
  align-self: start;
}
</style>
