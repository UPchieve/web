<script setup lang="ts">
import Loader from '@/components/Loader.vue'
import ArrowIcon from '@/assets/arrow.svg'
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import NetworkService from '@/services/NetworkService'
import type {
  QuizQuestion as QuizQuestionType,
  QuizResults,
} from '@/views/TrainingCourseView/types'
import TrainingPage from '@/views/TrainingCourseView/Quizzes/TrainingPage.vue'
import LargeButton from '@/components/LargeButton.vue'
import QuizQuestionView from '@/views/TrainingCourseView/Quizzes/QuizQuestion.vue'
import { useStore } from 'vuex'
import CrossMark from '@/assets/cross.svg'
import CheckMark from '@/assets/check.svg'
import TrainingService from '@/services/TrainingService'
import type { LetterChoice, AnswerMap } from '@/services/TrainingService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const store = useStore()
const isMobile = store.getters['app/mobileMode']

const props = defineProps<{
  quizCategory: string
}>()

const emit = defineEmits<{
  (e: 'exitQuiz'): void
  (e: 'resetQuiz'): void
  (e: 'finishedQuiz'): void
  (e: 'passedQuizAndExit'): void
  (e: 'error', error: any, message: string): void
  (e: 'clickedNextOrPrevious'): void
}>()

type StepType = 'takingQuiz' | 'viewingResults'
const currentStep = ref<StepType>('takingQuiz')
const showLoader = ref<boolean>(false)
const quizQuestions = ref<QuizQuestionType[]>([])
const questionIdToAnswerMap = ref<AnswerMap>({})
const quizResults = ref<QuizResults | null>(null)

const currentQuestionIndex = ref<number>(0)
const currentQuestion = computed(
  () => quizQuestions.value[currentQuestionIndex.value]
)
function isQuestionCorrect(questionId: number): boolean {
  return (
    questionIdToAnswerMap.value[questionId] ===
    quizResults.value?.answerKey[questionId]
  )
}

onBeforeMount(async () => {
  try {
    showLoader.value = true
    const questionsResponse = await NetworkService.getQuestions({
      category: props.quizCategory,
    })
    quizQuestions.value = questionsResponse.data.questions
  } catch (err) {
    emit(
      'error',
      err,
      `Failed to fetch quiz questions for quiz ${props.quizCategory}`
    )
  } finally {
    showLoader.value = false
  }
})

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.TRAINING_VIEWED_MINI_QUIZ, {
    quiz: props.quizCategory,
  })
})

function setAnswerChoice(questionId: number, answerChoice: LetterChoice) {
  const newAnswerMap = { ...questionIdToAnswerMap.value }
  newAnswerMap[questionId] = answerChoice
  questionIdToAnswerMap.value = newAnswerMap
}

const allQuestionsAnswered = computed(() => {
  const answeredQuestionIds = new Set<string>(
    Object.keys(questionIdToAnswerMap.value)
  )
  const allQuestionIds = quizQuestions.value.map((q) => q.id.toString())
  return (
    allQuestionIds.filter((qId) => !answeredQuestionIds.has(qId)).length === 0
  )
})

const currentSelectedAnswer = computed((): LetterChoice | null => {
  if (currentQuestion.value?.id in questionIdToAnswerMap.value) {
    return questionIdToAnswerMap.value[currentQuestion.value.id] as LetterChoice
  }
  return null
})

type PreviousButtonAction = 'reviewTraining' | 'previousQuestion'
type NextButtonAction =
  | 'getQuizScore'
  | 'nextQuestion'
  | 'exitQuizOnPass'
  | 'retakeQuiz'
const previousButtonAction = computed((): PreviousButtonAction => {
  if (currentStep.value === 'takingQuiz') {
    return currentQuestionIndex.value === 0
      ? 'reviewTraining'
      : 'previousQuestion'
  }
  return 'reviewTraining'
})
const previousButtonLabel = computed(() => {
  switch (previousButtonAction.value) {
    case 'previousQuestion':
      return isMobile ? ' ' : 'Previous'
    case 'reviewTraining':
      return 'Review Training'
    default:
      return 'Previous'
  }
})
const nextButtonAction = computed((): NextButtonAction => {
  const isLastQuestion =
    currentQuestionIndex.value === quizQuestions.value.length - 1
  if (currentStep.value === 'takingQuiz') {
    if (isLastQuestion && allQuestionsAnswered.value) {
      return 'getQuizScore'
    }
    return 'nextQuestion'
  } else {
    if (quizResults.value?.didPass) {
      return 'exitQuizOnPass'
    }
    return 'retakeQuiz'
  }
})
const nextButtonLabel = computed(() => {
  switch (nextButtonAction.value) {
    case 'getQuizScore':
      return 'Submit Quiz'
    case 'retakeQuiz':
      return 'Retake Quiz'
    case 'exitQuizOnPass':
    case 'nextQuestion':
    default:
      return 'Next'
  }
})

function previous() {
  emit('clickedNextOrPrevious')
  if (previousButtonAction.value === 'reviewTraining') {
    AnalyticsService.captureEvent(
      EVENTS.TRAINING_MINI_QUIZ_CLICKED_REVIEW_MATERIALS,
      {
        quiz: props.quizCategory,
        score: quizResults.value?.numCorrect,
      }
    )
    emit('exitQuiz')
  } else if (previousButtonAction.value === 'previousQuestion') {
    currentQuestionIndex.value = currentQuestionIndex.value - 1
  }
}

function goToNextQuestion() {
  currentQuestionIndex.value = currentQuestionIndex.value + 1
}

function next() {
  emit('clickedNextOrPrevious')
  switch (nextButtonAction.value) {
    case 'nextQuestion':
      return goToNextQuestion()
    case 'getQuizScore':
      return submitQuiz()
    case 'retakeQuiz':
      AnalyticsService.captureEvent(
        EVENTS.TRAINING_MINI_QUIZ_CLICKED_RETAKE_QUIZ,
        {
          quiz: props.quizCategory,
          score: quizResults.value?.numCorrect,
        }
      )
      return emit('resetQuiz')
    case 'exitQuizOnPass':
      return emit('passedQuizAndExit')
  }
}

async function submitQuiz() {
  try {
    showLoader.value = true
    const results = await TrainingService.getQuizScore(
      props.quizCategory,
      questionIdToAnswerMap.value
    )
    quizResults.value = {
      didPass: results.didPass,
      numCorrect: results.score,
      answerKey: results.answerKey,
      tries: results.tries,
    }
    currentStep.value = 'viewingResults'
    emit('finishedQuiz')
    const quizEvent = results.didPass
      ? EVENTS.TRAINING_MINI_QUIZ_PASSED
      : EVENTS.TRAINING_MINI_QUIZ_FAILED
    AnalyticsService.captureEvent(quizEvent, {
      quiz: props.quizCategory,
      score: results.score,
      tries: results.tries,
    })
  } catch (err) {
    emit(
      'error',
      err,
      `Failed to get quiz score for quiz ${props.quizCategory}`
    )
  } finally {
    showLoader.value = false
  }
}
</script>

<template>
  <TrainingPage>
    <template v-slot:main-content>
      <Loader v-if="showLoader" />
      <div
        v-else-if="currentStep === 'takingQuiz'"
        class="training-quiz-content"
      >
        <span class="question-counter">
          Question {{ currentQuestionIndex + 1 }} of {{ quizQuestions.length }}
        </span>
        <QuizQuestionView
          v-if="currentQuestion"
          :questionWithAnswers="currentQuestion"
          :selectedAnswer="currentSelectedAnswer ?? null"
          @selectedAnswer="setAnswerChoice"
        />
      </div>
      <div
        v-else-if="currentStep === 'viewingResults'"
        class="training-quiz-content"
      >
        <div class="quiz-results-summary">
          <div
            class="quiz-results-callout"
            :class="{
              'quiz-results-callout--passed': quizResults?.didPass,
              'quiz-results-callout--failed': !quizResults?.didPass,
            }"
          >
            <div
              v-if="quizResults?.didPass"
              class="quiz-results-callout--passed"
            >
              Great job! You passed the quiz and completed the module!
              <button type="button" class="quick-next-button" @click="next">
                {{ nextButtonLabel }}
                <ArrowIcon class="arrow-icon" />
              </button>
            </div>
            <div v-else>
              Good try! You got
              <strong
                >{{ quizResults?.numCorrect ?? 0 }} out of
                {{ quizQuestions.length }}</strong
              >
              questions correct. Review your answers below and give it another
              try!
            </div>
          </div>
        </div>
        <hr class="separator" />
        <div
          v-for="(question, index) in quizQuestions"
          :key="question.id"
          class="question-with-answers"
        >
          <div class="question-counter">
            Question {{ index + 1 }}
            <CheckMark
              v-if="isQuestionCorrect(question.id)"
              class="correct-answer-icon"
            />
            <CrossMark v-else class="incorrect-answer-icon" />
          </div>
          <QuizQuestionView
            :selectedAnswer="questionIdToAnswerMap[question.id]"
            :questionWithAnswers="quizQuestions[index]"
            :showAnswers="true"
          />
        </div>
      </div>
    </template>
    <template v-slot:previous-button>
      <LargeButton
        class="previous-button"
        variant="secondary"
        :showArrow="true"
        arrowDirection="left"
        @click="previous"
        >{{ previousButtonLabel }}</LargeButton
      >
    </template>
    <template v-slot:next-button>
      <LargeButton
        variant="primary-blue"
        :showArrow="false"
        class="next-button"
        @click="next"
        :disabled="!currentSelectedAnswer"
        >{{ nextButtonLabel }}</LargeButton
      >
    </template>
  </TrainingPage>
</template>

<style scoped lang="scss">
.separator {
  width: 100%;
  color: $c-border-grey;
}
.training-quiz-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.quiz-results-summary {
  display: flex;
  flex-direction: column;
  align-self: center;
  padding-bottom: 16px;
  padding-top: 16px;
}
.quiz-results-callout {
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid $c-border-grey;
  width: 80%;
  align-self: center;

  .quick-next-button {
    padding-right: 16px;
    color: $c-hover-green;
    display: flex;
    flex-direction: row;
    align-items: center;
    @include font-category('button');
    margin-left: auto;

    .arrow-icon {
      fill: $c-hover-green;
      height: 16px;
      width: 16px;
      margin-top: 2px;
      margin-left: 8px;
    }
  }

  &--passed {
    border-color: $c-success-green;
    background-color: lighten($c-success-green, $amount: 50%);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &--failed {
    border-color: $c-error-red;
    background-color: lighten($c-error-red, 30%);
  }
}
.question-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: beige;
}
.question-counter {
  @include font-category('subheading');
  color: $c-hover-green;
  padding-bottom: 16px;
}
.incorrect-answer-icon {
  height: 10px;
  width: 10px;

  :deep(path) {
    fill: $c-error-red;
  }
}

.correct-answer-icon {
  height: 10px;
  width: 10px;
}
</style>
