<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import CrossIcon from '@/assets/cross.svg'
import PresessionSurvey from './SubjectSelection/PresessionSurvey.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { startSession } from '@/utils/session'

interface EssayHelpModalData {
  topic: string
  subject: string
  sessionArgs?: Record<string, unknown>
  svg: string | object
}

const props = defineProps<{
  modalData: EssayHelpModalData
}>()

const store = useStore()
const router = useRouter()

const showSurvey = ref(false)

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.STUDENT_VIEWED_ESSAY_HELP_MODAL, {
    subject: props.modalData.subject,
  })
})

function closeModal() {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLOSED_ESSAY_HELP_MODAL, {
    subject: props.modalData.subject,
  })

  store.dispatch('app/modal/hide')
}

function onCancel() {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLOSED_ESSAY_HELP_MODAL, {
    subject: props.modalData.subject,
  })
}

function startLiveChat() {
  AnalyticsService.captureEvent(EVENTS.STUDENT_SELECTED_LIVE_ESSAY_HELP, {
    subject: props.modalData.subject,
  })

  showSurvey.value = true
}

function startEssayReview() {
  AnalyticsService.captureEvent(EVENTS.STUDENT_SELECTED_ASYNC_ESSAY_HELP, {
    subject: props.modalData.subject,
  })

  router.push('/essay-review')
}

function onSurveyCompleted() {
  startSession(
    router,
    props.modalData.topic,
    props.modalData.subject,
    props.modalData.sessionArgs ?? {}
  )
}

defineExpose({
  onCancel,
})
</script>

<template>
  <div class="EssayHelpModal">
    <presession-survey
      v-if="showSurvey"
      :subject="modalData.subject"
      @survey-completed="onSurveyCompleted"
    />

    <template v-else>
      <button
        type="button"
        class="EssayHelpModal-close"
        aria-label="Close"
        @click="closeModal"
      >
        <cross-icon />
      </button>

      <component
        v-if="typeof modalData.svg === 'object'"
        :is="modalData.svg"
        class="EssayHelpModal-icon"
      />

      <img
        v-else
        :src="modalData.svg"
        alt=""
        class="EssayHelpModal-icon"
        aria-hidden="true"
      />

      <h1 class="EssayHelpModal-title">How would you like help?</h1>

      <div class="EssayHelpModal-options">
        <button
          type="button"
          class="EssayHelpModal-option"
          data-testid="essay-live-chat-option"
          @click="startLiveChat"
        >
          <span class="EssayHelpModal-option-title">Chat with a coach</span>

          <span class="EssayHelpModal-option-description">
            Work on your essay together in a live session.
          </span>
        </button>

        <button
          type="button"
          class="EssayHelpModal-option"
          data-testid="essay-review-option"
          @click="startEssayReview"
        >
          <span class="EssayHelpModal-option-title">
            Get written feedback
          </span>

          <span class="EssayHelpModal-option-description">
            Submit your essay and hear back within 24 hours.
          </span>
        </button>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.EssayHelpModal {
  position: relative;
  width: 100%;
  text-align: center;
}

.EssayHelpModal-close {
  position: absolute;
  top: 0;
  right: 0;
  padding: 4px;
  border: 0;
  background: transparent;
  cursor: pointer;

  svg {
    width: 15px;
    height: 15px;
    fill: $icon-grey;
  }
}

.EssayHelpModal-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
}

.EssayHelpModal-title {
  @include font-category('display-small');
  margin: 0 0 24px;
}

.EssayHelpModal-options {
  display: grid;
  gap: 16px;
  text-align: left;

  @include breakpoint-above('medium') {
    grid-template-columns: repeat(2, 1fr);
  }
}

.EssayHelpModal-option {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 24px;
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  color: $c-soft-black;
  background: white;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus {
    border-color: $c-success-green;
    background: #f2fbf9;
  }
}

.EssayHelpModal-option-title {
  @include font-category('heading');
  font-weight: 600;
}

.EssayHelpModal-option-description {
  @include font-category('helper-text');
  color: $c-secondary-grey;
}
</style>
