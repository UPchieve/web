<script lang="ts" setup>
import { onBeforeMount, reactive, computed } from 'vue'
import WaveForm from './WaveForm.vue'
import RecordIcon from '@/assets/voice_message_icons/record-message.svg'
import DeleteIcon from '@/assets/voice_message_icons/delete-message.svg'
import SendIcon from '@/assets/voice_message_icons/send-message.svg'
import StopIcon from '@/assets/voice_message_icons/stop-recording-message.svg'
import LoggerService from '@/services/LoggerService'
import { vTooltip } from 'maz-ui'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '../../consts'

enum STATES {
  idle = 'IDLE',
  recording = 'RECORDING',
  recorded = 'RECORDED',
  sending = 'SENDING',
  error = 'ERROR',
  notSupported = 'NOT SUPPORTED',
}

const emit = defineEmits(['idle', 'notIdle'])
const props = defineProps(['onRecording', 'onStopRecording', 'sendMessage'])
const recording = reactive<{
  state: STATES
  blob: Blob | null
  chunks: Array<Blob>
}>({
  state: STATES.idle,
  blob: null,
  chunks: [],
})
let stream: MediaStream
let recorder: MediaRecorder

const audioURL = computed(
  () => recording.blob && window.URL.createObjectURL(recording.blob)
)

AnalyticsService.captureEvent(EVENTS.VOICE_MESSAGE_RECORDING_BUTTON_SEEN)

function reset() {
  recording.chunks = []
  recording.blob = null
}

async function setupAudio() {
  if (stream) return

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    })
    recorder = new MediaRecorder(stream, {
      bitsPerSecond: 30000,
    })
    recorder.ondataavailable = (e) => {
      recording.chunks.push(e.data)
    }
    recorder.onstop = () => {
      recording.blob = new Blob(recording.chunks, {
        type: 'audio/webm; codecs=opus',
      })
    }
    return true
  } catch (e) {
    recording.state = STATES.notSupported
    AnalyticsService.captureEvent(EVENTS.VOICE_MESSAGE_MIC_ACCESS_DENIED)
    LoggerService.noticeError(e)
  }
}

async function record() {
  const allowed = await setupAudio()
  if (allowed) {
    AnalyticsService.captureEvent(EVENTS.VOICE_MESSAGE_START_RECORDING)
    emit('notIdle')
    recording.state = STATES.recording
    reset()
    recorder?.start()
    props.onRecording()
  }
}

function stop() {
  AnalyticsService.captureEvent(EVENTS.VOICE_MESSAGE_STOP_RECORDING)
  recording.state = STATES.recorded
  recorder?.stop()
  props.onStopRecording()
}

async function send() {
  AnalyticsService.captureEvent(EVENTS.VOICE_MESSAGE_SEND_RECORDING)
  try {
    recording.state = STATES.sending
    if (recording.blob) {
      await props.sendMessage(recording.blob)
    }
    reset()
    recording.state = STATES.idle
    emit('idle')
  } catch (e) {
    AnalyticsService.captureEvent(EVENTS.VOICE_MESSAGE_SEND_RECORDING_ERRORED)
    recording.state = STATES.error
    LoggerService.noticeError(`Problem saving voice message - ${e}`)
  }
}

function destroy() {
  AnalyticsService.captureEvent(EVENTS.VOICE_MESSAGE_DELETE_RECORDING)
  recording.state = STATES.idle
  reset()
  emit('idle')
}
</script>

<template v-if="recorder.state !== STATES.notSupported">
  <button
    v-tooltip="{ text: 'Record audio', color: 'black', position: 'top' }"
    @click="record"
    @mouseover="
      AnalyticsService.captureEvent(EVENTS.VOICE_MESSAGE_HOVER_RECORDING_BUTTON)
    "
    class="button"
    v-if="recording.state === STATES.idle"
  >
    <RecordIcon class="icon record-icon"></RecordIcon>
  </button>
  <div v-else class="recorder-container">
    <div
      v-if="
        recording.state === STATES.recorded ||
        recording.state === STATES.sending ||
        recording.state === STATES.error
      "
    >
      <button
        class="button"
        @click="destroy"
        :disabled="recording.state === STATES.sending"
      >
        <DeleteIcon class="icon delete"></DeleteIcon>
      </button>
    </div>
    <audio
      controls
      class="controls"
      v-if="
        audioURL &&
        (recording.state === STATES.recorded ||
          recording.state === STATES.sending ||
          recording.state === STATES.error)
      "
    >
      <source type="audio/webm; codecs=opus" :src="audioURL" />
      <source type="audio/mp4;" :src="audioURL" />
    </audio>
    <div
      class="recording-container"
      v-if="recording.state === STATES.recording"
    >
      <WaveForm :stream="stream"></WaveForm>
      <button class="button" @click="stop">
        <StopIcon class="icon"></StopIcon>
      </button>
    </div>
    <div
      v-if="
        recording.state === STATES.recorded ||
        recording.state === STATES.sending ||
        recording.state === STATES.error
      "
    >
      <button
        :disabled="recording.state === STATES.sending"
        v-tooltip="{
          text: 'Error!',
          color: 'danger',
          position: 'top',
          open: recording.state === STATES.error,
        }"
        class="button send-button"
        @click="send"
      >
        <SendIcon class="icon"></SendIcon>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 0;
  flex-grow: 0;
  &:disabled {
    filter: brightness(0.75) opacity(0.5);
  }
  &::before {
    border-radius: 3px;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    padding-left: 8px;
    padding-right: 8px;
    left: -24px;
    bottom: calc(100%);
    transition-property: none;
  }
}
.send-button:hover {
  &::before {
    display: none;
  }
}
.icon {
  width: 24px;
  height: 24px;
}

.record-icon {
  width: 30px;
  height: 30px;
}

.recorder-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-top: 12px;
  padding-bottom: 12px;
  flex-grow: 1;
  min-width: 0;

  @include breakpoint-below('medium') {
    max-height: 44px;
  }
}
.recording-container {
  display: flex;
  flex-grow: 1;
  align-items: center;
  max-height: 44px;
  justify-content: end;
}
.controls {
  min-width: 0;
  max-height: 44px;
  flex-grow: 1;
}
</style>
