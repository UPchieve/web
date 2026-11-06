<script setup lang="ts">
import { computed, ref } from 'vue'
import LargeButton from './LargeButton.vue'
import Stepper from './Stepper.vue'
import CrossIcon from '@/assets/cross.svg'
import { useAppModalStore } from '@/stores/app/modal'
import {
  mdiPencilOutline,
  mdiFileDocumentOutline,
  mdiCurrencyUsd,
  mdiClockOutline,
} from '@mdi/js'
import type { Subject, TopicSubjects } from '@/types/subjects'

const props = withDefaults(
  defineProps<{
    subjects: Subject[]
    totalSteps?: number
    isLoading?: boolean
    selectedSubject?: string
    volunteerName: string
    isVolunteerOffline?: boolean
    onSelect: (name: string) => void
  }>(),
  { totalSteps: 0, isLoading: false, isVolunteerOffline: false }
)

const modal = useAppModalStore()
const selected = ref(props.selectedSubject || '')
const subjectIcons: Record<string, string> = {
  applicationEssays: mdiPencilOutline,
  financialAid: mdiCurrencyUsd,
}

const subjectsByTopic = computed(() => {
  const topics: TopicSubjects[] = []

  for (const subject of props.subjects) {
    let topic = topics.find((topic) => topic.name === subject.topicName)
    if (!topic) {
      topic = {
        name: subject.topicName,
        displayName: subject.topicDisplayName,
        subjects: [],
      }
      topics.push(topic)
    }
    topic.subjects.push(subject)
  }

  for (const topic of topics) {
    topic.subjects.sort((firstSubject, secondSubject) => {
      const firstOrder = firstSubject.displayOrder ?? 0
      const secondOrder = secondSubject.displayOrder ?? 0
      return firstOrder - secondOrder
    })
  }

  return topics
})

function onAccept() {
  if (props.subjects.some((subject) => subject.name === selected.value)) {
    props.onSelect(selected.value)
  }
}

defineExpose({ onAccept })
</script>

<template>
  <section class="request-coach-subject">
    <button
      type="button"
      class="close-button"
      aria-label="Close"
      @click="modal.hide()"
    >
      <cross-icon />
    </button>
    <h1>Choose a subject</h1>
    <p>Request a session with {{ volunteerName }}.</p>
    <div
      v-if="isVolunteerOffline"
      class="offline-memo"
      role="status"
      data-testid="volunteer-offline-memo"
    >
      <svg class="offline-memo__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path :d="mdiClockOutline" />
      </svg>
      <span>
        {{ volunteerName }} is offline, so your request may take longer. Want
        help sooner? You can ask any available tutor.
      </span>
    </div>
    <stepper
      v-if="totalSteps"
      :totalSteps="totalSteps"
      :currentStep="1"
      class="subject-stepper"
    />
    <h2>Which subject do you want help with?</h2>
    <div
      v-for="topic in subjectsByTopic"
      :key="topic.name"
      class="topic-section"
    >
      <h3 class="topic-title">
        {{ topic.displayName }}
      </h3>
      <div class="subject-options">
        <button
          v-for="subject in topic.subjects"
          :key="subject.name"
          type="button"
          class="subject-option"
          :class="{
            selected: selected === subject.name,
          }"
          :aria-pressed="selected === subject.name"
          @click="selected = subject.name"
        >
          <svg class="subject-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="subjectIcons[subject.name] || mdiFileDocumentOutline" />
          </svg>
          {{ subject.displayName }}
        </button>
      </div>
    </div>
    <div class="actions">
      <large-button
        variant="primary"
        :showArrow="false"
        :disabled="!selected || isLoading"
        @click="onAccept"
        >Next</large-button
      >
    </div>
  </section>
</template>

<style lang="scss" scoped>
.request-coach-subject {
  width: 100%;
  text-align: left;

  h1 {
    @include font-category('display-small');
    text-align: left;
    margin: 0 0 12px;
  }
  p {
    text-align: left;
    color: $c-secondary-grey;
  }
  h2 {
    text-align: left;
    font-size: 20px;
    margin: 30px 0;
  }

  .offline-memo {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 24px;
    padding: 16px 20px;
    border-radius: 10px;
    background: $c-volunteer;
    color: $c-soft-black;
  }
  .offline-memo__icon {
    width: 22px;
    height: 22px;
    margin-top: 2px;
    fill: currentColor;
    flex-shrink: 0;
  }

  .subject-stepper {
    max-width: 240px;
    margin: 24px 0 32px;
  }
  .close-button {
    position: absolute;
    top: 20px;
    right: 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    width: 24px;
    height: 24px;
    padding: 2px;
  }
  .close-button svg {
    width: 100%;
    height: 100%;
  }
  .topic-section {
    margin: 24px 0;
  }
  .topic-title {
    text-align: left;
    margin: 0;
    color: $c-secondary-grey;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .subject-options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;
  }
  .subject-option {
    text-align: left;
    max-width: 100%;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid $c-border-grey;
    border-radius: 28px;
    background: white;
    padding: 12px 20px;
    color: $c-soft-black;
    cursor: pointer;
  }
  .subject-icon {
    width: 22px;
    height: 22px;
    fill: currentColor;
    flex-shrink: 0;
  }
  .subject-option:hover,
  .subject-option.selected {
    border-color: $c-success-green;
    background: $selected-green;
  }
  .subject-option:focus-visible {
    outline: 2px solid $c-success-green;
    outline-offset: 3px;
  }
  .actions {
    border-top: 1px solid $c-border-grey;
    padding-top: 24px;
    margin-top: 32px;
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 12px;
  }
}
</style>
