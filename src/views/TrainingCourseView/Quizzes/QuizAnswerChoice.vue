<script lang="ts" setup>
import type { AnswerChoice } from '@/views/TrainingCourseView/types'
import type { LetterChoice } from '@/services/TrainingService'

const {
  answerChoice,
  isSelected,
  showCorrectAnswers = false,
  correctAnswer,
} = defineProps<{
  answerChoice: AnswerChoice
  isSelected: boolean
  showCorrectAnswers?: boolean
  correctAnswer?: LetterChoice
}>()
const emit = defineEmits<{
  (e: 'selectedAnswer', answerChoice: LetterChoice): void
}>()

function selectAnswer() {
  emit('selectedAnswer', answerChoice.val)
}

function isCorrect(answerChoice: LetterChoice): boolean {
  return answerChoice === correctAnswer
}
</script>

<template>
  <div
    class="answer-choice-container"
    :class="{
      selected: !showCorrectAnswers && isSelected,
      'selected--incorrect':
        showCorrectAnswers && isSelected && !isCorrect(answerChoice.val),
      'answer-choice-container--correct-answer':
        showCorrectAnswers && isCorrect(answerChoice.val),
      'answer-choice-container--taking-quiz': !showCorrectAnswers,
    }"
    @click="selectAnswer"
  >
    <span
      class="letter-choice"
      :class="{
        'letter-choice--correct':
          showCorrectAnswers && isCorrect(answerChoice.val),
        'letter-choice--incorrect':
          showCorrectAnswers && !isCorrect(answerChoice.val),
      }"
    >
      {{ answerChoice.val.toUpperCase() }}
    </span>
    <div
      class="answer-text"
      :class="{
        'answer-text--correct-answer':
          showCorrectAnswers && answerChoice.val === correctAnswer,
      }"
    >
      <span
        class="correct-answer-label"
        v-if="showCorrectAnswers && isCorrect(answerChoice.val)"
      >
        Correct answer
      </span>
      <span
        class="incorrect-answer-label"
        v-if="showCorrectAnswers && isSelected && !isCorrect(answerChoice.val)"
      >
        Your answer
      </span>
      {{ answerChoice.txt }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.answer-choice-container {
  border: 1px solid $c-border-grey;
  display: flex;
  flex-direction: row;
  padding: 18px 16px;
  border-radius: 4px;

  &:hover {
    &--correct-answer {
      background-color: $c-hover-green;
    }
  }

  &--correct-answer {
    background-color: lighten($c-success-green, $amount: 50%);
    border-color: $c-success-green;
  }

  &--taking-quiz {
    &:hover {
      background-color: lighten($c-information-blue, $amount: 50%);
      cursor: pointer;
    }
  }
}

.selected {
  background-color: $c-background-blue;
  border: 1px solid $c-information-blue;

  &--incorrect {
    background-color: lighten($c-warning-orange, $amount: 29%);
    border-color: $c-warning-orange;
  }
}

.letter-choice {
  color: $c-information-blue;
  font-weight: 500;

  &--correct {
    color: $c-hover-green;
  }

  &--incorrect {
    color: $c-soft-black;
  }
}

.answer-text {
  display: flex;
  flex-direction: column;
  padding-left: 5%;
  color: $c-soft-black;

  &--correct-answer {
    font-weight: 500;
  }

  .correct-answer-label {
    color: $c-hover-green;
    font-weight: 500;
  }

  .incorrect-answer-label {
    color: $c-warning-orange;
    font-weight: 500;
  }
}
</style>
