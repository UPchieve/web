<template>
  <div class="main-container">
    <div v-if="isAutoFlowUser" class="subjects-link" @click="goToSubjectsPage">
      <arrow-icon class="subjects-link--arrow-icon" />
      <span class="subjects-link--text">Back to subjects page</span>
    </div>
    <div class="quiz-overall-container">
      <h1 class="title">
        {{ props.subjectDisplayName }} Tutoring Certification Quiz
      </h1>

      <!--      Quiz instructions-->
      <div v-if="!startedQuiz">
        <h2 class="subtitle">Get ready, set...</h2>
        <div class="instructions">
          <p>
            You're about to start a quiz that will test your
            <span class="light-emphasis"
              >{{ props.subjectDisplayName }} knowledge</span
            >
            as well as your understanding of
            <span class="light-emphasis">UPchieve best practices</span
            >.<br /><br />
            You will pass once you get 10 questions correct in each category.<br /><br />
            Once you feel ready, press
            <span class="light-emphasis">"Start Quiz"</span> below! You can also
            review concepts before taking the quiz.
          </p>
        </div>
        <div class="start-quiz-buttons-container">
          <LargeButton
            class="uc-form-button"
            variant="secondary"
            @click="() => openReviewMaterialsAtStart('upchieve101')"
            >Study UPchieve 101</LargeButton
          >
          <LargeButton
            class="uc-form-button"
            variant="secondary"
            @click="() => openReviewMaterialsAtStart('subject')"
            >Study {{ subjectDisplayName }}</LargeButton
          >
          <LargeButton
            variant="primary"
            class="uc-form-button"
            :showArrow="false"
            @click="startQuiz"
            >Start Quiz</LargeButton
          >
        </div>
      </div>

      <!--    Quiz questions-->
      <div v-else-if="currentQuestion" class="quiz-container">
        <div class="progress-container">
          <div class="progress-category">
            UPchieve 101
            <ProgressBar
              v-if="!completedQuizCategory('upchieve101')"
              :questionNumber="numCorrectUpchieve101 + 1"
              :barWidth="progress('upchieve101')"
              :quizLength="numRequiredToPass('upchieve101')"
            />
            <CheckCircledIcon v-else />
          </div>
          <div class="progress-category">
            {{ props.subjectDisplayName }}
            <ProgressBar
              v-if="!completedQuizCategory('subject')"
              :questionNumber="numCorrectSubject + 1"
              :barWidth="progress('subject')"
              :quizLength="numRequiredToPass('subject')"
            />
            <CheckCircledIcon v-else />
          </div>
        </div>
        <QuizQuestions
          :currentQuestion="currentQuestion"
          :overallQuestionIndex="overallQuestionIndex"
          :answerResult="answerResult"
          @clicked-go-to-next-question="goToNextQuestion"
          @clicked-open-review-materials="
            () =>
              openReviewMaterials(
                currentQuestion?.category === UPCHIEVE_101_CATEGORY
                  ? 'upchieve101'
                  : 'subject'
              )
          "
          @submitted-answer="submitAnswer"
        />
      </div>
      <QuizResults
        v-else
        :passedUPchieve101="
          !isEmpty(upchieve101AnswerMap) && quizResults?.passedUpchieve101
        "
        :passedSubject="
          !isEmpty(subjectAnswerMap) && quizResults?.passedSubject
        "
        :hadUpchieve101Questions="upchieve101Questions.length > 0"
        :hadSubjectQuestions="subjectQuestions.length > 0"
        :numCorrectUPchieve101="numCorrectUpchieve101"
        :numCorrectSubject="numCorrectSubject"
        :subjectDisplayName="props.subjectDisplayName"
        :subjectCategory="subjectCategory as string"
        :upchieveAnswerMap="upchieve101AnswerMap"
        :subjectAnswerMap="subjectAnswerMap"
        @clicked-retake-quiz="() => router.go(0)"
        @clicked-review-subject="() => openReviewMaterials('subject')"
        @clicked-review-u-pchieve101="() => openReviewMaterials('upchieve101')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import QuizResults from './QuizResults.vue'
import CheckCircledIcon from '@/assets/check-circled.svg'
import QuizQuestions from './QuizQuestions.vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import LoggerService from '@/services/LoggerService'
import type { AnswerMap, QuizQuestion } from '@/services/TrainingService'
import { useStore } from 'vuex'
import ArrowIcon from '@/assets/arrow.svg'
import NetworkService from '@/services/NetworkService'
import { interleave } from '@/utils/array-utils'
import LargeButton from '@/components/LargeButton.vue'
import Case from 'case'
import { camelCase } from 'lodash-es'
import { isEmpty } from 'lodash'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import ProgressBar from '@/views/QuizView/ProgressBar.vue'

const router = useRouter()
const store = useStore()

const props = defineProps<{
  subjectDisplayName: string
}>()

const UPCHIEVE_101_CATEGORY = 'upchieve101'
const subjectCategory = computed(() =>
  camelCase(router.currentRoute.value.params?.category)
)
const isAutoFlowUser = computed(() => store.getters['user/isAutoFlowUser'])
const goToSubjectsPage = () => {
  isAutoFlowUser.value ? router.push('/welcome') : router.push('/training')
}

const upchieve101Questions = ref<QuizQuestion[]>([])
const subjectQuestions = ref<QuizQuestion[]>([])
const quizQuestions = ref<QuizQuestion[]>([])
const overallQuestionIndex = ref<number>(0)
const numCorrectUpchieve101 = ref<number>(0)
const numCorrectSubject = ref<number>(0)
const answerResult = ref<'correct' | 'incorrect' | null>(null)
const startedQuiz = ref<boolean>(false)
const upchieve101AnswerMap = ref<AnswerMap>({})
const subjectAnswerMap = ref<AnswerMap>({})

const startQuiz = () => {
  AnalyticsService.captureEvent(EVENTS.COMBINED_QUIZ_BEGAN_QUIZ)
  startedQuiz.value = true
}

const openReviewMaterials = (quiz: 'upchieve101' | 'subject') => {
  const upchieve101ReviewUrl = '/training/course/upchieve101'
  const subjectReviewUrl = `/training/review/${Case.kebab(subjectCategory.value as string)}`
  window.open(
    quiz === 'upchieve101' ? upchieve101ReviewUrl : subjectReviewUrl,
    '_blank'
  )
}

const openReviewMaterialsAtStart = (quiz: 'upchieve101' | 'subject') => {
  AnalyticsService.captureEvent(EVENTS.COMBINED_QUIZ_CLICKED_STUDY_AT_START, {
    category: quiz === 'upchieve101' ? quiz : subjectCategory.value,
  })
  openReviewMaterials(quiz)
}

const currentQuestion = computed(() => {
  if (overallQuestionIndex.value < quizQuestions.value.length)
    return quizQuestions.value[overallQuestionIndex.value]
  return undefined
})

const DEFAULT_NUM_CORRECT_TO_PASS = 10

const numRequiredToPass = computed(() => (quiz: 'upchieve101' | 'subject') => {
  const quizQuestions =
    quiz === 'upchieve101' ? upchieve101Questions.value : subjectQuestions.value
  return Math.min(DEFAULT_NUM_CORRECT_TO_PASS, quizQuestions.length)
})

const progress = computed(() => (quiz: 'upchieve101' | 'subject') => {
  const numCorrect =
    quiz === 'upchieve101'
      ? numCorrectUpchieve101.value
      : numCorrectSubject.value
  return (100 / (numRequiredToPass.value(quiz) - 1)) * numCorrect
})

const quizResults = computed(() => {
  return {
    passedUpchieve101:
      numCorrectUpchieve101.value >= numRequiredToPass.value('upchieve101'),
    passedSubject:
      numCorrectSubject.value >= numRequiredToPass.value('subject'),
  }
})

const goToNextQuestion = () => {
  answerResult.value = null
  answerChoice.value = null
  overallQuestionIndex.value = overallQuestionIndex.value + 1

  // Filter out remaining questions if you already passed
  if (quizResults.value?.passedSubject) {
    if (currentQuestion.value?.category === subjectCategory.value) {
      goToNextQuestion()
    }
  }
  if (quizResults.value?.passedUpchieve101) {
    if (currentQuestion.value?.category === UPCHIEVE_101_CATEGORY) {
      goToNextQuestion()
    }
  }
}

const answerChoice = ref<string | null>(null)
const submitAnswer = async (selectedAnswer: string) => {
  AnalyticsService.captureEvent(EVENTS.COMBINED_QUIZ_SUBMITTED_ANSWER)
  answerChoice.value = selectedAnswer
  if (answerChoice.value === currentQuestion.value?.correctAnswer)
    handleCorrectAnswer()
  else handleIncorrectAnswer()
}

const completedQuizCategory = computed(
  () => (quiz: 'upchieve101' | 'subject') => {
    const numCorrect =
      quiz === 'upchieve101'
        ? numCorrectUpchieve101.value
        : numCorrectSubject.value
    const numRequired = numRequiredToPass.value(quiz)
    return numCorrect >= numRequired
  }
)

const handleCorrectAnswer = () => {
  AnalyticsService.captureEvent(EVENTS.COMBINED_QUIZ_ANSWER_CORRECT)
  answerResult.value = 'correct'
  if (currentQuestion.value?.category === UPCHIEVE_101_CATEGORY) {
    numCorrectUpchieve101.value = numCorrectUpchieve101.value + 1
    upchieve101AnswerMap.value[currentQuestion.value?.id] =
      answerChoice.value as string
  } else {
    numCorrectSubject.value = numCorrectSubject.value + 1
    subjectAnswerMap.value[currentQuestion.value?.id as number] =
      answerChoice.value as string
  }
  goToNextQuestion()
}

const handleIncorrectAnswer = () => {
  AnalyticsService.captureEvent(EVENTS.COMBINED_QUIZ_ANSWER_INCORRECT)
  answerResult.value = 'incorrect'
}

const loadQuizQuestions = async (): Promise<void> => {
  try {
    await NetworkService.getQuestions({
      category: UPCHIEVE_101_CATEGORY,
    }).then((response) => {
      upchieve101Questions.value = response.data.questions
    })

    if (
      !Object.values(store.state.user.user.certifications).some(
        (cert: any) => cert.passed && cert.name === subjectCategory.value
      )
    ) {
      await NetworkService.getQuestions({
        category: subjectCategory.value,
      }).then((response) => {
        subjectQuestions.value = response.data.questions
      })
    } else {
      subjectQuestions.value = []
    }
  } catch (err) {
    LoggerService.noticeError(`Failed to load quiz questions: error is ${err}`)
  }
  quizQuestions.value = interleave(
    upchieve101Questions.value,
    subjectQuestions.value
  )
}

onMounted(() => {
  loadQuizQuestions()
  AnalyticsService.captureEvent(EVENTS.COMBINED_QUIZ_USER_SAW_QUIZ)
})
</script>

<style lang="scss" scoped>
.main-container {
  max-width: 1000px;
  margin-top: 1em;

  @include breakpoint-above('medium') {
    margin-top: 2.5em;
    width: 80%;
  }

  @include breakpoint-above('huge') {
    width: 55%;
  }

  &--review-answers {
    @include breakpoint-above('huge') {
      width: 80%;
    }
  }
}

.quiz-overall-container {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  border-left: 5px solid $c-information-blue;
  padding: 2.5em;
  margin: 0 0 2.5em 2.5em;
}

.title {
  font-size: 24px;
  color: $c-soft-black;
  padding-bottom: 16px;
}

.subtitle {
  font-size: 18px;
  margin-top: 0.5em;
  margin-bottom: 1em;
}

.instructions {
  margin: 1em 0 4em;
}

.light-emphasis {
  font-weight: 500;
}

.subjects-link {
  @include flex-container(row, initial, center);
  display: inline-flex;
  padding-left: 0.9em;
  max-width: 1000px;
  margin-bottom: 1em;
  color: $c-information-blue;
  cursor: pointer;

  @include breakpoint-above('medium') {
    margin-left: 2.5em;
  }

  &--text {
    margin-bottom: 0;
  }

  &--arrow-icon {
    width: 20px;
    fill: $c-information-blue;
    transform: rotate(180deg);
    margin-right: 0.4em;
  }
}

.start-quiz-buttons-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-container {
  display: flex;
  flex-direction: column;
  margin: 2em auto;
  gap: 14px;

  .progress-category {
    display: flex;
    flex-direction: column;
    flex: 1;
    font-size: 16px;
    line-height: normal;
    gap: 8px;
  }
}
</style>
