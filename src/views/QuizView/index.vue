<template>
  <div
    class="quiz-container"
    :class="showQuizReview && 'quiz-container--review-answers'"
  >
    <div v-if="isAutoFlowUser" class="subjects-link" @click="goToSubjectsPage">
      <arrow-icon class="subjects-link--arrow-icon" />
      <span class="subjects-link--text">Back to subjects page</span>
    </div>
    <div class="training-quiz" :class="trainingQuizClasses">
      <div :class="showQuizReview ? 'done-header' : 'header'">
        <h1 class="title">{{ quizName }} Certification Quiz</h1>
        <div
          v-if="showQuizReview"
          class="review-buttons"
          :class="{
            'review-buttons--align-end': quizResults.passed,
          }"
        >
          <template v-if="!quizResults.passed">
            <large-button
              primary
              :showArrow="false"
              data-testid="btn-review-concepts"
              @click="goToStudyMaterials"
              class="review-buttons--button"
              ><span>Review concepts</span>
            </large-button>
            <large-button
              class="review-buttons--button review-buttons--button-end"
              :showArrow="false"
              data-testid="retake-quiz"
              @click="reloadQuiz"
              ><span>Retake quiz</span>
            </large-button>
          </template>
          <template v-else>
            <large-button
              primary
              :showArrow="false"
              routeTo="/training"
              class="review-buttons--button"
              ><span>Take another quiz</span>
            </large-button>
            <large-button
              class="review-buttons--button review-buttons--button-end"
              :showArrow="false"
              routeTo="/dashboard"
              ><span>Go to Dashboard</span>
            </large-button>
          </template>
        </div>
      </div>
      <div class="quiz-inner">
        <div v-if="quizLoading" class="loading-body">
          <loading-message message="Loading quiz" />
        </div>
        <div v-else-if="loadingQuizResults" class="loading-body">
          <loading-message message="Getting your quiz results" />
        </div>
        <div v-else-if="errorMessage" class="">
          <div class="resubmit-quiz">
            <p>{{ errorMessage }}</p>
          </div>
          <div class="quiz-buttons">
            <large-button
              class="quiz-buttons--button--resubmit"
              @click="submitQuiz"
              ><span>Resubmit Quiz</span></large-button
            >
          </div>
        </div>
        <div v-else>
          <div v-if="showNoQuiz" class="instructions">
            A {{ quizName }} quiz has not yet been created. If you would like to
            begin tutoring students on this topic, please contact UPchieve.
          </div>
          <router-link
            v-if="showNoQuiz"
            class="contact btn"
            type="button"
            to="/contact"
          >
            CONTACT US
          </router-link>
          <div v-if="showQuizStart">
            <div>
              <div class="instructions">
                <h2 class="instructions-header">Get ready, set...</h2>
                <div class="instructions-content">
                  <p>
                    You're about to start a quiz with
                    {{ quizLength }} questions. There's no time limit, but we
                    recommend setting aside at least 15 minutes. Once you feel
                    ready, press
                    <span class="instructions-start-quiz">"Start Quiz"</span>
                    below!
                  </p>
                  <p v-if="isQuizStudyMaterialUser">
                    You can also press the "Study" button to study the material
                    we've created before taking the quiz
                  </p>
                </div>
              </div>
              <div class="quiz-buttons">
                <large-button
                  v-if="isQuizStudyMaterialUser"
                  :showArrow="false"
                  @click="goToStudyMaterials()"
                  class="quiz-buttons--button"
                  ><span>Study</span>
                </large-button>
                <large-button
                  data-testid="btn-start-quiz"
                  primary
                  :showArrow="false"
                  @click="startQuiz()"
                  class="quiz-buttons--button quiz-buttons--primary-button"
                  ><span>Start Quiz</span>
                </large-button>
              </div>
            </div>
          </div>

          <quiz-questions
            v-if="showQuizQuestions"
            :quizLength="quizLength"
            @submitQuiz="submitQuiz"
          />
          <quiz-review v-if="showQuizReview" />
          <quiz-results
            v-if="showQuizResults"
            :quizResults="quizResults"
            :quizLength="quizLength"
            :reloadQuiz="reloadQuiz"
            :isFirstQuiz="isFirstQuiz"
            @showReview="showReview"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Case from 'case'
import { mapGetters, mapState } from 'vuex'

import LoadingMessage from '@/components/LoadingMessage.vue'
import TrainingService from '@/services/TrainingService'

import QuizQuestions from './QuizQuestions.vue'
import QuizResults from './QuizResults.vue'
import QuizReview from './QuizReview.vue'

import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import LargeButton from '@/components/LargeButton.vue'
import ArrowIcon from '@/assets/arrow.svg'
import LoggerService from '@/services/LoggerService'

// TODO: Refactor this file - CSS, make use of async, and better error handling
export default {
  name: 'QuizView',
  data() {
    const category = Case.camel(this.$route.params.category)

    return {
      category,
      quizLoading: true,
      quizLength: 0,
      questionsReview: [],
      coverStyle: {},
      showQuizQuestions: false,
      showQuizResults: false,
      showQuizReview: false,
      showQuizStart: false,
      quizResults: {},
      loadingQuizResults: false,
      isFirstQuiz: false,
      errorMessage: '',
    }
  },
  components: {
    LoadingMessage,
    QuizQuestions,
    QuizResults,
    QuizReview,
    LargeButton,
    ArrowIcon,
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      subjects: (state) => state.subjects.subjects,
    }),
    ...mapGetters({
      isVolunteer: 'user/isVolunteer',
      allSubtopics: 'subjects/allSubtopics',
      isQuizStudyMaterialUser: 'user/isQuizStudyMaterialUser',
      hasCertification: 'user/hasASubjectCertification',
      isAutoFlowUser: 'user/isAutoFlowUser',
      isStudentVolunteer: 'user/isStudentVolunteer',
    }),
    tries() {
      const { user } = this.$store.state.user
      const { tries } = user.certifications[this.category]
      return tries || 0
    },
    showNoQuiz() {
      return !this.quizLength
    },
    quizName() {
      let quizName
      const subjects = this.subjects
      if (this.category === 'esl') {
        quizName = this.category.toUpperCase()
      } else if (subjects[this.category]) {
        quizName = subjects[this.category].displayName
      } else {
        quizName =
          this.category.charAt(0).toUpperCase() + this.category.slice(1)
      }
      return quizName
    },
    trainingQuizClasses() {
      const resultsHasEntries = Object.keys(this.quizResults).length
      return {
        'training-quiz--passed': resultsHasEntries && this.quizResults.passed,
        'training-quiz--failed': resultsHasEntries && !this.quizResults.passed,
        'training-quiz--review-answers': this.showQuizReview,
      }
    },
  },
  beforeMount() {
    this.loadQuiz()
    this.isFirstQuiz = !this.hasCertification
  },
  methods: {
    startQuiz() {
      this.showQuizQuestions = true
      this.showQuizStart = false
      AnalyticsService.captureEvent(EVENTS.QUIZ_STARTED, {
        event: EVENTS.QUIZ_STARTED,
        subject: this.category,
      })
    },
    submitQuiz() {
      this.showQuizQuestions = false
      this.loadingQuizResults = true
      this.errorMessage = ''
      TrainingService.submitQuiz()
        .then((data) => {
          this.quizResults = data
          this.loadingQuizResults = false
          this.showQuizResults = true
          const quizEvent = data.passed
            ? EVENTS.QUIZ_PASSED
            : EVENTS.QUIZ_FAILED
          AnalyticsService.captureEvent(quizEvent, {
            action: quizEvent,
            subject: this.category,
          })
          if (this.isStudentVolunteer) {
            AnalyticsService.captureEvent(
              data.passed
                ? EVENTS.ROLE_SWITCHING_USER_PASSED_CERTIFICATION_QUIZ
                : EVENTS.ROLE_SWITCHING_USER_FAILED_CERTIFICATION_QUIZ,
              {
                quiz: this.category,
              }
            )
            AnalyticsService.captureEvent(
              EVENTS.ROLE_SWITCHING_USER_COMPLETED_CERTIFICATION_QUIZ,
              {
                quiz: this.category,
              }
            )
          }

          if (data.passed) {
            const updatedCerts = Object.assign(this.user.certifications, {
              [this.category]: { passed: true, tries: data.tries },
            })
            this.$store.dispatch('user/addToUser', {
              certifications: updatedCerts,
              totalQuizzesPassed: this.user.totalQuizzesPassed + 1,
            })
          }
        })
        .catch((err) => {
          this.loadingQuizResults = false
          this.errorMessage =
            'Something went wrong, please resubmit. If the issue persists, please reach out to UPchieve.'
          LoggerService.noticeError(err)
        })
    },
    showReview() {
      this.showQuizResults = false
      this.showQuizReview = true
    },
    reloadQuiz() {
      this.loadQuiz()
    },
    async loadQuiz() {
      this.quizLoading = true
      try {
        const quizLength = await TrainingService.loadQuiz(this.category)
        this.quizLength = quizLength
        this.showQuizStart = !!quizLength
      } catch (err) {
        this.quizLength = 0
        this.showQuizStart = false
        LoggerService.noticeError(err)
      } finally {
        this.quizLoading = false
        this.showQuizResults = false
        this.showQuizReview = false
        this.quizResults = {}
      }
    },
    goToStudyMaterials() {
      this.$router.push(`/training/review/${Case.kebab(this.category)}`)
    },
    goToSubjectsPage() {
      if (this.isAutoFlowUser) this.$router.push('/welcome')
      else this.$router.push('/training')
    },
  },
}
</script>

<style lang="scss" scoped>
.training-quiz {
  display: flex;
  position: relative;
  flex-direction: column;
  font-size: 16px;
  background: #fff;
  border-radius: 8px;
  margin: 10px;
  padding: $spacing-sm $spacing-sm 8em;
  border-left: 5px solid $c-information-blue;

  @include breakpoint-above('medium') {
    margin: 0 0 2.5em 2.5em;
    padding: 2.5em;
  }

  &--passed {
    border-left: 5px solid $c-success-green;
  }

  &--failed {
    border-left: 5px solid $c-error-red;
  }
}

.quiz-container {
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

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.done-header {
  @include breakpoint-above('large') {
    @include flex-container(row, space-between, center);
  }
}

.title {
  font-size: 24px;
  margin: 0;
  font-weight: 500;
  color: #343440;
}

.loading-body {
  margin: 5em auto 0;
}

.quiz-inner {
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.btn {
  background: #f6f6f6;
  border-radius: 20px;
  width: 140px;
  box-sizing: content-box;
  height: 26px;
  line-height: 26px;
  color: #16d2aa;
  font-weight: 600;
}

.btn:hover {
  background-color: #16d2aa;
  color: #fff;
}

.instructions {
  &-content {
    margin: 1em 0;
    margin-bottom: 4em;
  }

  &-header {
    font-size: 18px;
    margin-top: 0.5em;
    margin-bottom: 1em;
  }

  &-start-quiz {
    font-weight: 500;
  }
}

@media screen and (max-width: 700px) {
  .done.btn {
    width: 6em;
  }
}

@media screen and (max-width: 426px) {
  .done-header {
    flex-direction: column;
  }

  .done.btn {
    margin-top: 2em;
    width: 80%;
  }
}

.review-buttons {
  @include flex-container(row, space-between);
  width: 100%;
  margin-top: 1em;

  @include breakpoint-above('large') {
    width: 40%;
    margin-top: 0;
  }

  &--button {
    width: 45%;

    @include breakpoint-above('large') {
      margin-top: 0;
    }
  }
}

.quiz-buttons {
  @include flex-container(row, space-between);

  @include breakpoint-above('large') {
    @include flex-container(row, flex-end);
  }

  &--button {
    width: 120px;

    @include breakpoint-above('tiny') {
      width: 150px;
    }

    @include breakpoint-above('large') {
      margin-left: 2em;
    }

    &--resubmit {
      background-color: #16d2aa;
      color: white;
    }
  }
}

@media screen and (min-width: 990px) and (max-width: 1100px) {
  .training-quiz--review-answers {
    width: 90%;
  }
}

.resubmit-quiz {
  @include flex-container(column, center, center);
  margin: 5em 0;
}
</style>
