<template>
  <div
    v-if="user.isVolunteer"
    class="training-quiz"
    :class="trainingQuizClasses"
  >
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
            @click.native="goToStudyMaterials"
            class="review-buttons--button"
            ><span>Review concepts</span>
          </large-button>
          <large-button
            class="review-buttons--button review-buttons--button-end"
            :showArrow="false"
            @click.native="reloadQuiz"
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
        <div v-if="showQuizStart" class="quiz-start">
          <div>
            <div class="instructions">
              <h2 class="instructions-header">Get ready, set...</h2>
              <div class="instructions-content">
                <p>
                  You're about to start a quiz with {{ quizLength }} questions.
                  There's no time limit, but we recommend setting aside at least
                  15 minutes. Once you feel ready, press
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
                @click.native="goToStudyMaterials()"
                class="quiz-buttons--button"
                ><span>Study</span>
              </large-button>
              <large-button
                primary
                :showArrow="false"
                @click.native="startQuiz()"
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
</template>

<script>
import Case from 'case'
import { mapGetters, mapState } from 'vuex'

import LoadingMessage from '@/components/LoadingMessage'
import TrainingService from '@/services/TrainingService'

import QuizQuestions from './QuizQuestions'
import QuizResults from './QuizResults'
import QuizReview from './QuizReview'

import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import LargeButton from '@/components/LargeButton'

// TODO: Refactor this file - CSS, make use of async, and better error handling
export default {
  name: 'QuizView',
  data() {
    let category = Case.camel(this.$route.params.category)

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
    }
  },
  components: {
    LoadingMessage,
    QuizQuestions,
    QuizResults,
    QuizReview,
    LargeButton,
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      subjects: state => state.subjects.subjects,
    }),
    ...mapGetters({
      allSubtopics: 'subjects/allSubtopics',
      isQuizStudyMaterialUser: 'user/isQuizStudyMaterialUser',
      hasCertification: 'user/hasCertification',
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
      TrainingService.submitQuiz().then(data => {
        this.quizResults = data
        this.loadingQuizResults = false
        this.showQuizResults = true
        const quizEvent = data.passed ? EVENTS.QUIZ_PASSED : EVENTS.QUIZ_FAILED
        AnalyticsService.captureEvent(quizEvent, {
          action: quizEvent,
          subject: this.category,
        })
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
    },
    showReview() {
      this.showQuizResults = false
      this.showQuizReview = true
    },
    reloadQuiz() {
      this.loadQuiz()
    },
    loadQuiz() {
      TrainingService.loadQuiz(this.category).then(quizLength => {
        this.quizLoading = false
        this.showQuizResults = false
        this.showQuizReview = false
        this.quizResults = {}
        this.quizLength = quizLength
        this.showQuizStart = !!quizLength
      })
    },
    goToStudyMaterials() {
      AnalyticsService.captureEvent(
        EVENTS.VOLUNTEER_CLICKED_QUIZ_STUDY_MATERIALS
      )
      this.$router.push(`/training/review/${Case.kebab(this.category)}`)
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
  padding: 1.25em 0.9em;
  max-width: 1000px;
  padding-bottom: 8em;
  border-left: 5px solid $c-information-blue;

  @include breakpoint-above('medium') {
    margin: 2.5em;
    padding: 2.5em;
    width: 80%;
  }

  @include breakpoint-above('huge') {
    width: 50%;
  }

  &--review-answers {
    @include breakpoint-above('huge') {
      width: 80%;
    }
  }

  &--passed {
    border-left: 5px solid $c-success-green;
  }

  &--failed {
    border-left: 5px solid $c-error-red;
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
  .header {
    padding: 1em 1em 1em 3em;
  }

  .quiz-inner {
    padding: 2em;
  }

  .done.btn {
    width: 6em;
  }
}

@media screen and (max-width: 426px) {
  .header {
    padding: 1em 0;
  }

  .quiz-inner {
    padding: initial;
  }

  .done-header {
    flex-direction: column;
  }

  .done.btn {
    margin-top: 2em;
    width: 80%;
  }

  .instructions {
    padding: 0 1em;
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
  }
}

@media screen and (min-width: 990px) and (max-width: 1100px) {
  .training-quiz--review-answers {
    width: 90%;
  }
}
</style>
