<script lang="ts" setup>
import { nextTick, ref, reactive, computed, onBeforeUnmount } from 'vue'
import WaveForm from './WaveForm.vue'
import RecordIcon from '@/assets/voice_message_icons/record-message.svg'
import DeleteIcon from '@/assets/voice_message_icons/delete-message.svg'
import StopIcon from '@/assets/voice_message_icons/stop-recording-message.svg'
import LoggerService from '@/services/LoggerService'
import { vTooltip } from 'maz-ui'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '../../consts'
import Announcement from './Announcement.vue'
import { VoiceRecognition } from './voice-recognition'
import Spinner from '../../components/Spinner.vue'
import LargeButton from '../../components/LargeButton.vue'

enum STATES {
  idle = 'IDLE',
  recording = 'RECORDING',
  recorded = 'RECORDED',
  sending = 'SENDING',
  error = 'ERROR',
  notSupported = 'NOT SUPPORTED',
  transcribing = 'TRANSCRIBING',
}
const textarea = ref()
const emit = defineEmits(['idle', 'notIdle'])
const props = defineProps<{
  onRecording: () => void
  onStopRecording: () => void
  sendTextMessage: (transcript: string) => boolean
  sendAudioMessage: ({
    audio,
    transcript,
  }: {
    audio: Blob
    transcript: string
  }) => boolean
}>()
const recording = reactive<{
  state: STATES
  blob: Blob | null
  chunks: Array<Blob>
  voiceRecognition: VoiceRecognition | null
  transcript: string
  userEditedTranscript: string
}>({
  state: STATES.idle,
  blob: null,
  chunks: [],
  voiceRecognition: null,
  transcript: '',
  userEditedTranscript: '',
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
  recording.userEditedTranscript = ''
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
  recording.transcript = (await recording.voiceRecognition?.stop()) ?? ''
  recording.userEditedTranscript = recording.transcript
  recording.state = STATES.recorded
  recorder?.stop()
  props.onStopRecording()
  stopMicAccess()
  nextTick(() => textarea.value.focus())
}

async function sendAudio() {
  try {
    recording.state = STATES.sending
    let results
    if (recording.blob) {
      results = await props.sendAudioMessage({
        audio: recording.blob,
        transcript: recording.transcript,
      })
    }
    if (results) {
      AnalyticsService.captureEvent(EVENTS.VOICE_MESSAGE_SEND_RECORDING)
      reset()
      recording.state = STATES.idle
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

async function sendText() {
  try {
    recording.state = STATES.sending
    const results = await props.sendTextMessage(recording.userEditedTranscript)
    if (results) {
      AnalyticsService.captureEvent(EVENTS.VOICE_MESSAGE_TRANSCRIPT_SENT, {
        isUserEdited: recording.transcript !== recording.userEditedTranscript,
      })
      reset()
      recording.state = STATES.idle
      emit('idle')
    } else {
      recording.state = STATES.recorded
    }
  } catch (e) {
    AnalyticsService.captureEvent(EVENTS.VOICE_MESSAGE_SEND_TRANSCRIPT_ERRORED)
    recording.state = STATES.error
    LoggerService.noticeError(`Problem saving transcript message - ${e}`)
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
        text: 'Record audio message or speech-to-text',
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
    <div class="audio">
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
        <spinner
          :container-height="44"
          :container-width="44"
          :width="24"
          :height="24"
          :thickness="4"
        />
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
    </div>

    <textarea
      ref="textarea"
      spellcheck="true"
      class="transcript"
      :disabled="
        recording.state === STATES.sending ||
        recording.state === STATES.transcribing ||
        recording.state === STATES.recording
      "
      v-model="recording.userEditedTranscript"
    />

    <div class="buttons">
      <div>
        <button
          class="button"
          @click="destroy"
          :disabled="
            recording.state === STATES.sending ||
            recording.state === STATES.transcribing ||
            recording.state === STATES.recording
          "
        >
          <DeleteIcon class="icon delete"></DeleteIcon>
        </button>
      </div>
      <div class="send-buttons">
        <div>
          <LargeButton
            :disabled="
              recording.state === STATES.sending ||
              recording.state === STATES.transcribing ||
              recording.state === STATES.recording ||
              recording.userEditedTranscript.length === 0
            "
            v-tooltip="{
              text: 'Error!',
              color: 'danger',
              position: 'top',
              open: recording.state === STATES.error,
            }"
            class="button send-button"
            @click="sendText"
          >
            Send text
          </LargeButton>
        </div>
        <div>
          <LargeButton
            :disabled="
              recording.state === STATES.sending ||
              recording.state === STATES.transcribing ||
              recording.state === STATES.recording
            "
            v-tooltip="{
              text: 'Error!',
              color: 'danger',
              position: 'top',
              open: recording.state === STATES.error,
            }"
            class="button send-button"
            @click="sendAudio"
          >
            Send audio
          </LargeButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.button {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 44px;
  flex-grow: 0;
  &:disabled {
    filter: brightness(0.75) opacity(0.5);
  }
  /* extra styling for v-tooltip */
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

.transcript {
  flex-grow: 1;
  width: 100%;
  border-top: 1px solid $c-border-grey;
  border-bottom: 1px solid $c-border-grey;
  padding: 1em 0.5em;
  resize: none;
  place-content: center;

  @include breakpoint-below('medium') {
    padding: 0.6em 1em;
    line-height: 18px;
    border: 1px solid $c-border-grey;
    border-radius: 20px;
  }

  &--recap {
    @include breakpoint-below('medium') {
      width: 100%;
    }
  }
}

.start {
  justify-self: start;
}
.end {
  justify-self: end;
}
.send-button {
  font-size: 14px;
  padding-left: 12px;
  padding-right: 12px;
}
/* do not display v-tooltip error on hover */
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
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
  padding-bottom: 12px;
  flex-grow: 1;
  min-width: 0;
  gap: 8px;

  @include breakpoint-below('medium') {
    padding-top: 0;
    padding-bottom: 0;
  }
}
.recording-container {
  display: flex;
  flex-grow: 1;
  align-items: center;
  max-height: 44px;
  justify-content: end;
}
.buttons {
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
  padding-right: 0.5em;
  padding-left: 0.5em;
}
.send-buttons {
  display: flex;
  flex-direction: row;
  gap: 8px;
  justify-content: end;
  align-items: center;
}

.audio {
  width: 100%;
  display: flex;
  flex-direction: row;
  padding-right: 0.5em;
}
.controls {
  min-width: 0;
  height: 44px;
  flex-grow: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 0.5em;
}
</style>
