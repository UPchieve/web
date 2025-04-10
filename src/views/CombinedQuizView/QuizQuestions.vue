<template>
  <div>
    <div class="question-container">
      <div class="question-number">
        Question {{ props.overallQuestionIndex + 1 }}
      </div>
      <div id="question-text">{{ props.currentQuestion?.questionText }}</div>
      <div class="image-container" v-if="props.currentQuestion?.imageSrc">
        <image-expand-icon
          class="image-sizer-icon"
          @click="handleImageExpansion"
        />
        <div :style="questionImageStyle" class="question-image" />
      </div>
      <div
        v-if="isImageExpanded && props.currentQuestion?.imageSrc"
        @click="handleImageExpansion"
        class="upc-modal question-image-modal"
      >
        <div class="question-image-expanded-container">
          <image-collapse-icon
            class="image-sizer-icon"
            @click="handleImageExpansion"
          />
          <img
            v-if="props.currentQuestion?.imageSrc"
            :src="props.currentQuestion?.imageSrc"
            class="question-image--expanded"
          />
        </div>
      </div>
    </div>

    <IonRadioGroup class="answer-choices-container" v-model="answerChoice">
      <IonRadio
        v-for="choice in props.currentQuestion?.possibleAnswers"
        :key="choice.val"
        :value="choice.val"
        label-placement="end"
        justify="start"
        :disabled="props.answerResult === 'incorrect'"
        class="answer-choice"
      >
        {{ choice.val }}. {{ choice.txt }}
      </IonRadio>
    </IonRadioGroup>

    <div v-if="props.answerResult === 'incorrect'" class="incorrect-answer">
      The correct answer is ({{ props.currentQuestion?.correctAnswer }}).
    </div>
    <LargeButton
      class="uc-form-button-secondary submit-answer-btn"
      v-if="props.answerResult !== 'incorrect'"
      variant="primary"
      :showArrow="false"
      @click="submitAnswer"
      :disabled="!answerChoice"
      >Submit</LargeButton
    >
    <div v-else class="incorrect-answer-buttons">
      <LargeButton
        class="uc-form-button-secondary study-btn"
        variant="secondary"
        @click="() => emit('clickedOpenReviewMaterials')"
        >Study</LargeButton
      >
      <LargeButton
        class="uc-form-button-secondary next-btn"
        variant="primary"
        :showArrow="false"
        @click="continueToNextQuestion"
        >Continue</LargeButton
      >
    </div>
  </div>
</template>

<script lang="ts" setup>
import { IonRadio, IonRadioGroup } from '@ionic/vue'
import LargeButton from '@/components/LargeButton.vue'
import type { QuizQuestion } from '@/services/TrainingService'
import { ref, computed, onUpdated, onMounted } from 'vue'
import ImageExpandIcon from '@/assets/image-expand.svg'
import ImageCollapseIcon from '@/assets/image-collapse.svg'
import LoggerService from '@/services/LoggerService'

const emit = defineEmits<{
  (e: 'submittedAnswer', answerChoice: string): void
  (e: 'clickedOpenReviewMaterials'): void
  (e: 'clickedGoToNextQuestion'): void
}>()

const props = defineProps<{
  currentQuestion: QuizQuestion | undefined
  overallQuestionIndex: number
  answerResult: 'correct' | 'incorrect' | null
}>()
const answerChoice = ref<string | null>(null)

const questionImageStyle = computed(() => {
  if (!props.currentQuestion?.imageSrc) return {}
  return {
    backgroundImage: `url(${props.currentQuestion?.imageSrc})`,
    display: 'flex',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  }
})

const submitAnswer = () => {
  emit('submittedAnswer', answerChoice.value as string)
  answerChoice.value = null
}

const continueToNextQuestion = () => {
  emit('clickedGoToNextQuestion')
  answerChoice.value = null
}

const isImageExpanded = ref<boolean>(false)

const handleImageExpansion = (event: any) => {
  event.stopImmediatePropagation()
  const { target } = event
  if (
    isImageExpanded.value &&
    target &&
    target.classList.contains('question-image--expanded')
  ) {
    return
  } else isImageExpanded.value = !isImageExpanded.value
}

onUpdated(() => {
  rerenderMathJaxElements()
})

onMounted(() => {
  rerenderMathJaxElements()
})

const rerenderMathJaxElements = () => {
  const questionContainer = document.querySelector('.question-container')
  if (!questionContainer) {
    LoggerService.noticeError('Could not find question container for MathJax')
    return
  }

  const questionText = questionContainer.querySelector('#question-text')
  const answerChoices = document.querySelectorAll(
    '.answer-choices-container .answer-choice'
  )
  ;(window as any).MathJax.Hub.Queue([
    'Typeset',
    (window as any).MathJax.Hub,
    [questionText, ...answerChoices],
  ])
}
</script>

<style lang="scss" scoped>
.question-container {
  margin: 0 auto 2em;

  .question-number {
    font-weight: 600;
    margin-bottom: 1.4em;
  }
}

.image-container {
  display: flex;
  padding-top: 16px;
}

.question-image {
  width: 300px;
  height: 300px;

  &-modal {
    background: rgba(0, 0, 0, 0.4);
    @include breakpoint-below('medium') {
      @include flex-container(row, initial, center);
    }
  }

  &--expanded {
    height: 100%;
    width: 100%;
  }

  &-expanded-container {
    position: relative;
    height: 100%;
    margin: 0 auto;

    @include breakpoint-below('medium') {
      width: 80%;
      height: 80%;
    }

    @include breakpoint-below('tiny') {
      width: 90%;
      height: 90%;
    }
  }
}

.image-sizer-icon {
  width: 20px;
  height: 20px;
  top: 0;
  right: 0;
  &:hover {
    transform: scale(1.1);
    transition: scale 0.5s ease;
  }
}

.answer-choices-container {
  display: flex;
  flex-direction: column;
  margin: 2em;
  gap: 8px;
}

.incorrect-answer {
  padding: 16px;
  color: $c-error-red;
}

.submit-answer-btn {
  display: flex;
  margin-left: auto;
}

.incorrect-answer-buttons {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;

  .next-btn {
    width: 200px;
  }

  .study-btn {
    width: 200px;
  }
}
</style>
