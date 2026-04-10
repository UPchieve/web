<script setup lang="ts">
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import type { Subject, Topic } from '@/store/modules/bot-conversations'
import { ref, computed } from 'vue'

type PartialTopic = Pick<Topic, 'id' | 'displayName' | 'subjects'>
type PartialSubject = Pick<Subject, 'id' | 'displayName'>
const props = defineProps<{
  firstName: string
  topics: PartialTopic[]
  onSelectSubject: (subject: PartialSubject) => void
}>()

const alphabeticalSort = (
  a: PartialSubject | PartialTopic,
  b: PartialSubject | PartialTopic
): number => a.displayName.localeCompare(b.displayName)
const sortedTopics = computed(() =>
  Array.from(props.topics).sort(alphabeticalSort)
)
const sortedSubjects = computed(() =>
  Array.from(selectedTopic?.value?.subjects ?? []).sort(alphabeticalSort)
)

enum STEPS {
  selectTopic = 'selectTopic', // i.e. math
  selectSubject = 'selectSubject', // i.e. precalculus
}
const step = ref(STEPS.selectTopic)

const selectedTopic = ref<PartialTopic | undefined>(undefined)
const selectedSubject = ref<PartialSubject | undefined>(undefined)

const selectTopic = (topic: PartialTopic) => {
  if (topic) {
    selectedTopic.value = topic
    step.value = STEPS.selectSubject
  }
}
const selectSubject = (subject: PartialSubject) => {
  if (subject) {
    selectedSubject.value = subject
  }
  if (props.onSelectSubject) props.onSelectSubject(subject)
}
</script>

<template>
  <div class="row">
    <div class="row greeting">
      <ChatBotIcon class="avatar" />
      <div>
        <div class="title">Hey, {{ firstName }}!</div>
        <div class="sub-title">I'm UPbot, your AI Tutor</div>
      </div>
    </div>
    <div class="row subjects">
      <p>Select the subject you want help with today</p>
      <button
        type="button"
        class="subject-button"
        :class="{
          'subject-button': true,
          selected: topic.id === selectedTopic?.id,
        }"
        v-for="topic in sortedTopics"
        v-bind:key="topic.id"
        @click="selectTopic(topic)"
      >
        {{ topic.displayName }}
      </button>
    </div>
    <div v-if="step === STEPS.selectSubject" class="row subjects">
      <p>
        What <u>{{ selectedTopic?.displayName ?? '' }}</u> topic are you working
        on?
      </p>
      <button
        type="button"
        :class="{ 'subject-button': true }"
        v-for="subject in sortedSubjects"
        v-bind:key="subject.id"
        @click="selectSubject(subject)"
      >
        {{ subject.displayName }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.avatar {
  width: 80px;
  height: 80px;
}

.title {
  font-size: 32px;
  font-weight: 500;
}

.sub-title {
  font-size: 24px;
  font-weight: 400;
}

.row {
  width: 100%;
  margin: 0 auto;
}

.greeting {
  display: flex;
  align-items: center;
  justify-content: start;
  grid-gap: 24px;
}

.subjects {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  row-gap: 16px;
  column-gap: 16px;
  @include breakpoint-below('medium') {
    grid-template-columns: repeat(1, 1fr);
  }
}

.subjects p {
  margin: 0;
  grid-column: -1/1;
  padding-top: 16px;
}

.subject-button {
  padding: 13px 18px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid $border-grey;

  &.selected {
    border-color: $c-success-green;
    background-color: $selected-green;
  }
}
</style>
