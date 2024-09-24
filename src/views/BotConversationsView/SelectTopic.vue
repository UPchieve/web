<script setup lang="ts">
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import type { Subject } from './NewBotChat.vue'
const props = defineProps<{
  firstName: string
  subject: Subject | undefined
  selectSubject: (subject: Subject) => void
  subjects: Subject[]
}>()
</script>

<template>
  <div class="row">
    <div class="row greeting">
      <ChatBotIcon class="avatar" />
      <div>
        <div class="title">Hey, {{ firstName }}!</div>
        <div class="sub-title">I'm UPbot, your AI Math Tutor</div>
      </div>
    </div>
    <div class="row subjects">
      <p>Select the topic you want help with today</p>
      <button
        class="subject-button"
        :class="subject.id === props.subject?.id ? 'selected' : ''"
        v-for="subject in props.subjects"
        v-bind:key="subject.id"
        @click="() => selectSubject(subject)"
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
