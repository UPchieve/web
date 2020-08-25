<template>
  <div v-if="user.isVolunteer" :style="coverStyle" class="training-quiz">
    <div id="quiz-name" :class="showQuizReview ? 'done-header' : 'header'">
      <h1 class="title">{{ quizName }} Certification Quiz</h1>
      <router-link
        v-if="showQuizReview"
        to="/dashboard"
        tag="div"
        class="done btn"
        >DONE</router-link
      >
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
              <p>
                You're about to start a quiz with {{ quizLength }} questions.
              </p>
              <p>
                There's no time limit, but we recommend setting aside at least
                15 minutes.
              </p>
              <p>Once you feel ready, press "Start Quiz" below!</p>
            </div>
            <button class="btn" type="start" @click.prevent="startQuiz()">
              Start Quiz
            </button>
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
          @showReview="showReview"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

import LoadingMessage from "@/components/LoadingMessage";
import TrainingService from "@/services/TrainingService";

import QuizQuestions from "./QuizQuestions";
import QuizResults from "./QuizResults";
import QuizReview from "./QuizReview";

import isPhysics from "@/utils/is-physics";
import { PHYSICS_MAPPING } from "@/consts";
import { allSubtopics } from "@/utils/topics";

export default {
  data() {
    const subtopics = allSubtopics();
    let { category } = this.$route.params;
    let quizName;

    // format physics from lowercase 'physicsone' -> 'physicsOne'
    if (isPhysics(category)) category = PHYSICS_MAPPING[category];

    if (category === "esl") {
      quizName = category.toUpperCase();
    } else {
      quizName = subtopics[category].displayName;
    }

    return {
      category,
      quizName,
      quizLoading: true,
      quizLength: 0,
      questionsReview: [],
      coverStyle: {},
      showQuizQuestions: false,
      showQuizResults: false,
      showQuizReview: false,
      showQuizStart: false,
      quizResults: {},
      loadingQuizResults: false
    };
  },
  components: {
    LoadingMessage,
    QuizQuestions,
    QuizResults,
    QuizReview
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    tries() {
      const { user } = this.$store.state.user;
      const { tries } = user.certifications[this.category];
      return tries || 0;
    },
    showNoQuiz() {
      return !this.quizLength;
    }
  },
  beforeMount() {
    TrainingService.loadQuiz(this, this.category).then(quizLength => {
      this.quizLoading = false;
      this.quizLength = quizLength;
      this.showQuizStart = !!quizLength;
    });
  },
  methods: {
    startQuiz() {
      this.showQuizQuestions = true;
      this.showQuizStart = false;
    },
    submitQuiz() {
      this.showQuizQuestions = false;
      this.loadingQuizResults = true;
      TrainingService.submitQuiz(this).then(data => {
        this.quizResults = data;
        this.loadingQuizResults = false;
        this.showQuizResults = true;
      });
    },
    showReview() {
      this.showQuizResults = false;
      this.showQuizReview = true;
    }
  }
};
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
  padding: 20px 15px;
  max-width: 1000px;
  padding-bottom: 8em;

  @include breakpoint-above("medium") {
    margin: 40px;
    padding: 40px;
    padding-bottom: 8em;
  }
}

.header,
.done-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.quiz-start {
  padding-bottom: 3em;
  width: 100%;
  border-bottom: 5px solid #1855d1;
  border-left: 5px solid #1855d1;
  padding-top: 1em;
  margin-top: 1.6em;

  & p:nth-child(3) {
    margin-top: -0.3em;
  }
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
  width: 80%;
  margin: 4em auto;

  &-header {
    font-size: 20px;
    margin-bottom: 1em;
  }
}
.exceeded-tries {
  margin: 4em 0;
}

@media screen and (max-width: 700px) {
  .header {
    padding: 1em 1em 1em 3em;
  }

  .col-xs-12.view-container {
    padding: 0em;
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
</style>
