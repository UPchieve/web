<template>
  <div
    v-if="user.isVolunteer && tries < 3"
    :style="coverStyle"
    class="training-quiz"
  >
    <h1 id="quiz-name" class="header">
      {{ quizName }} Certification Quiz
      <router-link
        v-if="showQuizReview"
        to="/dashboard"
        tag="div"
        class="done btn"
        >DONE</router-link
      >
    </h1>
    <div class="quiz-inner">
      <br />
      <div class="body">
        <div v-if="quizLoading" class="loadingBody">
          <loading-message message="Loading quiz" />
        </div>
        <div v-else class="startBody">
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
            <div class="instructions">
              <p>
                This test will have {{ quizLength }} questions, and it is
                untimed.
              </p>
              <p>You have {{ 3 - tries }}/3 tries left to pass this test.</p>
              <p>Once you feel ready, click on start!</p>
            </div>
            <button class="start btn" type="start" @click.prevent="startQuiz()">
              START TEST
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

export default {
  data() {
    const { category } = this.$route.params;
    let quizName;
    if (category === "esl") {
      quizName = category.toUpperCase();
    } else {
      quizName = category.charAt(0).toUpperCase() + category.slice(1);
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
      quizResults: {}
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
      TrainingService.submitQuiz(this).then(data => {
        this.quizResults = data;
        this.showQuizQuestions = false;
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

  @include breakpoint-above("medium") {
    margin: 40px;
    padding: 40px;
  }
}

.header {
  display: flex;
  margin: 0px;
  font-size: 24px;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
  color: #343440;
}

.body {
  display: flex;
  flex-direction: column;
}

.startBody {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: inherit;
}

.loadingBody {
  margin: 0 auto;
}

.quiz-inner {
  display: flex;
  flex-direction: column;
}

.btn.next,
.btn.submit {
  float: right;
}

.btn.previous {
  float: left;
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
  margin: 50px 0;
}

@media screen and (max-width: 700px) {
  .header {
    padding: 1em 1em 1em 3em !important;
  }

  .col-xs-12.view-container {
    padding: 0em !important;
  }

  .quiz-inner {
    padding: 2em !important;
  }

  .body {
    padding: 1em 0em !important;
  }

  .btnContainer {
    margin: 2em !important;
  }

  .done.btn {
    width: 6em !important;
  }
}
</style>
