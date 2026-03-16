<script lang="ts" setup>
import ThumbsUpDownButtons from '@/components/ThumbsUpDownButtons.vue'
import config from '@/config'
import { LangfuseWeb } from 'langfuse'
import { computed, ref } from 'vue'
import LargeButton from '@/components/LargeButton.vue'
import Modal from '@/components/Modal.vue'
import AnalyticsService from '@/services/AnalyticsService'

enum MODAL_STATE {
  'can-open',
  'negative-follow-up',
  'positive-follow-up',
}

export type FeedbackOptions = {
  title: string
  options?: string[]
  moreFeedbackTitle?: string
}

type AnalyticsServiceType = {
  eventName: string
  eventData?: object
}

const props = defineProps<{
  traceId?: string
  observationId?: string
  name: string
  analyticsServiceThumbsUp: AnalyticsServiceType
  analyticsServiceThumbsDown: AnalyticsServiceType
  analyticsServiceFollowup?: AnalyticsServiceType
}>()
const modalState = ref(MODAL_STATE['can-open'])

// TODO move this to a service
const langfuse = new LangfuseWeb({
  baseUrl: config.langfuseBaseUrl,
  publicKey: config.langfusePublicKey ?? '',
})

const selectedOption = ref()
const additionalFeedback = ref('')

const feedbackArgs = computed(() =>
  modalState.value === MODAL_STATE['negative-follow-up']
    ? negativeArgs(props.name)
    : positiveArgs(props.name)
)

const reset = () => {
  selectedOption.value = undefined
  additionalFeedback.value = ''
  modalState.value = MODAL_STATE['can-open']
}

const positiveArgs = (type: string): FeedbackOptions | undefined => {
  switch (type) {
    case 'session-review-feedback':
      return undefined
    case 'tutor-bot-feedback':
      return {
        title: 'What was helpful?',
        options: [
          'Message was clear and easy to understand',
          'Asked a helpful question',
          'Provided a helpful explanation',
          'Fast and efficient response',
          'Other',
        ],
        moreFeedbackTitle:
          'Tell us more about the issue or how we can improve.',
      }
    default:
      return undefined
  }
}

const negativeArgs = (type: string): FeedbackOptions | undefined => {
  switch (type) {
    case 'session-review-feedback':
      return {
        title: 'What can we improve?',
        moreFeedbackTitle: 'Tell us how we can make this summary better.',
      }
    case 'tutor-bot-feedback':
      return {
        title: 'What was the problem?',
        options: [
          'Needs whiteboard or visual support',
          'Message was confusing or too long',
          'Asked too many questions',
          'Technical issue',
          'Message was incorrect or inaccurate',
          'Other',
        ],
        moreFeedbackTitle:
          'Tell us more about the issue or how we can improve.',
      }
    default:
      return undefined
  }
}

const thumbsUp = () => {
  const { eventName, eventData } = props.analyticsServiceThumbsUp
  AnalyticsService.captureEvent(eventName, eventData)
  if (props.traceId) {
    langfuse.score({
      name: props.name,
      traceId: props.traceId,
      observationId: props.observationId,
      value: 1,
    })
  }
  if (
    positiveArgs(props.name) &&
    modalState.value === MODAL_STATE['can-open']
  ) {
    modalState.value = MODAL_STATE['positive-follow-up']
  }
}
const closeModal = () => {
  modalState.value = MODAL_STATE['can-open']
  reset()
}

const thumbsDown = () => {
  const { eventName, eventData } = props.analyticsServiceThumbsDown
  AnalyticsService.captureEvent(eventName, eventData)
  if (props.traceId) {
    langfuse.score({
      name: props.name,
      traceId: props.traceId,
      observationId: props.observationId,
      value: 0,
    })
  }
  if (
    negativeArgs(props.name) &&
    modalState.value === MODAL_STATE['can-open']
  ) {
    modalState.value = MODAL_STATE['negative-follow-up']
  }
}

const giveFeedback = (event: Event) => {
  event.preventDefault()
  if (props.analyticsServiceFollowup) {
    const { eventName, eventData } = props.analyticsServiceFollowup
    AnalyticsService.captureEvent(eventName, {
      ...eventData,
      comment: additionalFeedback.value,
    })
  }
  if (props.traceId) {
    langfuse.score({
      name: props.name + ':followup',
      traceId: props.traceId,
      observationId: props.observationId,
      dataType: 'CATEGORICAL',
      value: selectedOption.value ?? '', //empty string in case we don't have multiple choice options for feedback
      comment: additionalFeedback.value,
    })
  }
  closeModal()
}
</script>

<template>
  <div class="rating-container">
    <ThumbsUpDownButtons
      class="rating"
      :onClickThumbsUp="thumbsUp"
      :onClickThumbsDown="thumbsDown"
    />
    <Modal
      :closeModal="closeModal"
      v-if="modalState !== MODAL_STATE['can-open'] && feedbackArgs"
    >
      <div class="title">{{ feedbackArgs.title }}</div>
      <form autocomplete="off" class="options" @submit="giveFeedback">
        <LargeButton
          :class="selectedOption === option ? 'active' : ''"
          v-bind:key="option"
          v-for="option in feedbackArgs.options"
          @click="() => (selectedOption = option)"
          >{{ option }}</LargeButton
        >
        <div class="footer">
          <label v-if="feedbackArgs.moreFeedbackTitle">{{
            feedbackArgs.moreFeedbackTitle
          }}</label>
          <textarea
            v-if="feedbackArgs.moreFeedbackTitle"
            autocomplete="off"
            class="more-feedback"
            v-model="additionalFeedback"
            @keydown="
              (event) => {
                // Hold meta (Command osx/Windows key) + Enter to submit
                if (event.key === 'Enter' && event.metaKey) {
                  giveFeedback(event)
                }
              }
            "
          ></textarea>
          <LargeButton
            class="submit-button"
            type="submit"
            primary
            :disabled="
              feedbackArgs.options ? !selectedOption : !additionalFeedback
            "
            >Submit</LargeButton
          >
        </div>
      </form>
    </Modal>
  </div>
</template>

<style lang="scss" scoped>
.more-feedback {
  border: 1px solid $c-border-grey;
  border-radius: 5px;
  height: 8em;
  padding: 18px;
}

.footer {
  padding-top: 12px;
  width: 100%;
  display: flex;
  flex-direction: column;
  row-gap: 14px;
  label {
    text-align: left;
    margin: 0;
  }
}

.submit-button {
  justify-content: center;
  display: block;
  margin: auto;
}

.title {
  text-align: left;
  font-weight: 600;
  font-size: 20px;
}
.options {
  display: flex;
  flex-wrap: wrap;
  column-gap: 13px;
  row-gap: 13px;
}
.active {
  background-color: lighten($color: $c-success-green, $amount: 40%);
  border-color: $c-success-green;
}
.rating-container {
  max-height: 44px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: start;
}
</style>
<style lang="scss">
.thumbs-btn {
  width: 28px;
  height: 28px;
  margin-right: 13px;
}
.thumbs-btn svg {
  width: 28px;
  height: 28px;
  & path {
    fill: #949ba5;
  }
}

.thumbs-btn.down.selected,
.thumbs-btn.up.selected {
  background: none;
}
</style>
