<script lang="ts" setup>
import type { QuizQuestion } from '@/views/TrainingCourseView/types'
import type { LetterChoice } from '@/services/TrainingService'
import QuizAnswerChoice from '@/views/TrainingCourseView/Quizzes/QuizAnswerChoice.vue'

const {
  questionWithAnswers,
  selectedAnswer,
  showAnswers = false,
} = defineProps<{
  questionWithAnswers: QuizQuestion
  selectedAnswer: LetterChoice | null
  showAnswers?: boolean
}>()

const emit = defineEmits<{
  (e: 'selectedAnswer', questionId: number, answerChoice: LetterChoice): void
}>()

function onSelectAnswer(value: LetterChoice) {
  emit('selectedAnswer', questionWithAnswers.id, value)
}
</script>

<template>
  <div class="quiz-question-container">
    <span
      class="question-text"
      :class="{
        'question-text--results': showAnswers,
      }"
    >
      {{ questionWithAnswers.questionText }}
    </span>
    <div class="answer-choices-container">
      <div
        v-for="choice in questionWithAnswers.possibleAnswers"
        :key="choice.val"
      >
        <QuizAnswerChoice
          :answerChoice="choice"
          @selectedAnswer="onSelectAnswer"
          :isSelected="selectedAnswer === choice.val"
          :showCorrectAnswers="showAnswers"
          :correctAnswer="questionWithAnswers.correctAnswer"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.quiz-question-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-text {
  @include font-category('heading');
  font-weight: 500;

  &--results {
    @include font-category('heading');
  }
}

.answer-choices-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
