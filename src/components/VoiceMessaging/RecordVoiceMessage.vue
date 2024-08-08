<script lang="ts" setup>
import { reactive, computed, onBeforeUnmount } from 'vue'
import WaveForm from './WaveForm.vue'
import RecordIcon from '@/assets/voice_message_icons/record-message.svg'
import DeleteIcon from '@/assets/voice_message_icons/delete-message.svg'
import SendIcon from '@/assets/voice_message_icons/send-message.svg'
import StopIcon from '@/assets/voice_message_icons/stop-recording-message.svg'
import LoggerService from '@/services/LoggerService'
import { vTooltip } from 'maz-ui'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '../../consts'
import Announcement from './Announcement.vue'
import { VoiceRecognition } from './voice-recognition'

enum STATES {
  idle = 'IDLE',
  recording = 'RECORDING',
  recorded = 'RECORDED',
  sending = 'SENDING',
  error = 'ERROR',
  notSupported = 'NOT SUPPORTED',
  transcribing = 'TRANSCRIBING',
}
const emit = defineEmits(['idle', 'notIdle'])
const props = defineProps(['onRecording', 'onStopRecording', 'sendMessage'])
const recording = reactive<{
  state: STATES
  blob: Blob | null
  chunks: Array<Blob>
  voiceRecognition: VoiceRecognition | null
  transcript: string
}>({
  state: STATES.idle,
  blob: null,
  chunks: [],
  voiceRecognition: null,
  transcript: '',
})
let stream: MediaStream | null = null
let recorder: MediaRecorder | null = null

if (VoiceRecognition.notSupported()) {
  recording.state = STATES.notSupported
  AnalyticsService.captureEvent(
    EVENTS.VOICE_MESSAGE_VOICE_RECOGNITION_NOT_SUPPORTED
  )
}

const audioURL = computed(
  () => recording.blob && window.URL.createObjectURL(recording.blob)
)

AnalyticsService.captureEvent(EVENTS.VOICE_MESSAGE_RECORDING_BUTTON_SEEN)

const ondataavailable = (e) => {
  recording.chunks.push(e.data)
}

const onstop = () => {
  recording.blob = new Blob(recording.chunks, {
    type: 'audio/webm; codecs=opus',
  })
}

function stopMicAccess() {
  if (stream) {
    for (const track of stream.getAudioTracks()) {
      track.stop()
    }
  }
}

function reset() {
  recording.transcript = ''
  recording.voiceRecognition = null
  recording.chunks = []
  recording.blob = null
  stream = null
  recorder?.removeEventListener('stop', onstop)
  recorder?.removeEventListener('dataavailable', onstop)
  recorder = null
}

onBeforeUnmount(() => {
  stopMicAccess()
  reset()
})

async function setupAudio() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    })
    recorder = new MediaRecorder(stream, {
      bitsPerSecond: 30000,
    })
    recorder.ondataavailable = ondataavailable
    recorder.onstop = onstop
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
    recording.voiceRecognition = new VoiceRecognition()
    AnalyticsService.captureEvent(EVENTS.VOICE_MESSAGE_START_RECORDING)
    AnalyticsService.updateUser({ hasRecordedVoiceMessage: true })
    emit('notIdle')
    recording.state = STATES.recording
    await recording.voiceRecognition.start()
    recorder?.start()
    props.onRecording()
  }
}

async function stop() {
  AnalyticsService.captureEvent(EVENTS.VOICE_MESSAGE_STOP_RECORDING)
  recording.state = STATES.transcribing
  recording.transcript = await recording.voiceRecognition!.stop()
  recording.state = STATES.recorded
  recorder?.stop()
  props.onStopRecording()
  stopMicAccess()
}

async function send() {
  AnalyticsService.captureEvent(EVENTS.VOICE_MESSAGE_SEND_RECORDING)
  try {
    recording.state = STATES.sending
    let results
    if (recording.blob) {
      results = await props.sendMessage({
        audio: recording.blob,
        transcript: recording.transcript,
      })
    }
    if (results) {
      reset()
      recording.state = STATES.idle
      // Only emit idle if moderation passed
      emit('idle')
    } else {
      recording.state = STATES.recorded
    }
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
  <div v-if="recording.state === STATES.idle">
    <Announcement />

    <button
      v-tooltip="{
        text: 'Record audio message',
        color: 'black',
        position: 'top',
      }"
      @click="record"
      @mouseover="
        AnalyticsService.captureEvent(
          EVENTS.VOICE_MESSAGE_HOVER_RECORDING_BUTTON
        )
      "
      class="button"
    >
      <RecordIcon class="icon record-icon"></RecordIcon>
    </button>
  </div>
  <div v-else class="recorder-container">
    <div
      v-if="
        recording.state === STATES.recorded ||
        recording.state === STATES.sending ||
        recording.state === STATES.transcribing ||
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
    <div class="controls" v-if="recording.state === STATES.transcribing">
      Processing...
    </div>
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
        recording.state === STATES.transcribing ||
        recording.state === STATES.error
      "
    >
      <button
        :disabled="
          recording.state === STATES.sending ||
          recording.state === STATES.transcribing
        "
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
    left: -48px;
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
