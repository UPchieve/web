<template>
  <div
    v-if="user.isVolunteer && tries < 3"
    :style="coverStyle"
    class="training-quiz"
  >
    <div v-if="popUpBool" class="popUpCover" />
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
    <div v-if="showProgressBar" class="progressBar">
      <div class="circles">
        <div
          v-for="n in quizLength"
          :key="`circle-${n}`"
          :id="'circle-' + n"
          class="circle"
        >
          {{ n }}
        </div>
      </div>
      <div class="rect" />
      <div
        v-if="quizLength > 0"
        :style="{ width: barWidth + '%' }"
        class="rect cover"
      />
    </div>
    <div class="quiz-inner">
      <div v-if="qNumber" class="questionNumber">Question {{ qNumber }}</div>
      <br />
      <div class="body">
        <div class="startBody">
          <div v-if="showStartMsg" class="instructions">
            This test will have {{ quizLength }} questions, and it is
            untimed.<br />
            You have {{ 3 - tries }}/3 tries left to pass this test.<br /><br />
            Once you feel ready, click on start!
          </div>
          <button
            v-if="showStart"
            class="start btn"
            type="start"
            @click.prevent="getFirst()"
          >
            START TEST
          </button>
        </div>
        <div class="quizBody">
          <div class="questionText">{{ questionText }}</div>
          <br />
          <div :style="imageStyle" class="questionImage" />
          <form class="possibleAnswers">
            <div v-for="(item, index) in items" :key="`item-${index}`">
              <div class="options">
                <input :value="item.val" v-model="picked" type="radio" />
                <label :for="item.val" :id="'answer-' + item.val">
                  {{ item.val }}. {{ item.txt }}
                </label>
              </div>
            </div>
          </form>
        </div>
        <div v-if="showQuizReview" class="review">
          <div
            v-for="(question, index) in questionsReview"
            :key="`question-${index}`"
            class="question"
          >
            <div class="questionNumber">Question {{ index + 1 }}</div>
            <br />
            <div class="questionText">{{ question.questionText }}</div>
            <div :style="question.imageStyle" class="questionImage" />
            <div class="possibleAnswers">
              <div
                v-for="(answer, index) in question.possibleAnswers"
                :key="`answer-${index}`"
                :id="'answer-' + answer.val"
              >
                {{ answer.val }}. {{ answer.txt }}
              </div>
            </div>
            <div class="userAnswer">Your answer: {{ question.userAnswer }}</div>
            <div class="correctAnswer">
              Correct answer: {{ question.correctAnswer }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="!showQuizReview"
      :style="[popUpStyle, popUpBorderStyle]"
      class="passScoreContainer"
    >
      <div class="passed">{{ passedMsg }}</div>
      <div class="score">{{ scoreMsg }}</div>
      <div class="btnContainer">
        <button
          v-if="showReview"
          class="reviewBtn btn"
          type="review"
          @click.prevent="review()"
        >
          REVIEW TEST
        </button>
        <button
          v-if="showPrevious"
          class="prev btn"
          type="previous"
          @click.prevent="previous()"
        >
          PREVIOUS
        </button>
        <button
          v-if="showNext"
          class="next btn"
          type="next"
          @click.prevent="next()"
        >
          NEXT
        </button>
        <button
          v-if="showSubmit"
          class="submit btn"
          type="submit"
          @click.prevent="submit()"
        >
          SUBMIT TEST
        </button>
        <button v-if="showRestart" class="btn" @click.prevent="reload()">
          RETAKE TEST
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import UserService from "@/services/UserService";
import TrainingService from "@/services/TrainingService";

const MathJax = window.MathJax;

/**
 * @note {1} Why the extra parens: https://stackoverflow.com/a/27386370
 */
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
      user: {},
      category,
      questionText: "",
      quizName,
      items: [],
      picked: "",
      scoreMsg: "",
      showStartMsg: true,
      showStart: true,
      showPrevious: false,
      showNext: false,
      showSubmit: false,
      showReview: false,
      showDone: false,
      showRestart: false,
      imageStyle: {},
      popUpStyle: {},
      popUpBool: false,
      popUpBorderStyle: {},
      quizLength: 0,
      barWidth: 0,
      showProgressBar: false,
      questionsReview: [],
      showQuizReview: false,
      passedMsg: "",
      coverStyle: {},
      tries: 0,
      qNumber: ""
    };
  },
  created() {
    UserService.getUser().then(user => {
      if (user[category]) {
        let tries = 0;
        ({ tries } = user[category]); // {1}
        this.tries = tries;
      }
    });
  },
  beforeMount() {
    TrainingService.loadQuiz(this, this.category).then(quizLength => {
      this.quizLength = quizLength;
    });
  },
  updated() {
    this.rerenderMathJaxElements();
  },
  methods: {
    clearMathJaxElements() {
      const quizBody = document.querySelector(".quizBody");

      // Remove any MathJax-rendered elements from the DOM.
      // Do this before updating to avoid rendering artifacts being left behind
      const mathJaxElements = quizBody.querySelectorAll(
        "[class*=mjx],[class*=MathJax],[id*=MathJax]"
      );
      Array.from(mathJaxElements).forEach(e => e.remove());

      // MathJax slices up the DOM nodes it renders as math formulas. We need to
      // rejoin these under the first child's data attribute to avoid artifacts
      // being left behind
      const questionText = quizBody.querySelector(".questionText");
      questionText.firstChild.data = questionText.innerText;

      // Remove all child nodes but the first
      Array.from(questionText.childNodes)
        .slice(1)
        .forEach(e => e.remove());
    },

    rerenderMathJaxElements() {
      // Re-render MathJax in question text and answer choices
      const quiz = document.querySelector(".quizBody");
      const questionText = quiz.querySelector(".questionText");
      const answerChoices = quiz.querySelector(".possibleAnswers");

      if (!questionText || !answerChoices) {
        return;
      }

      MathJax.Hub.Queue(
        ["Typeset", MathJax.Hub, questionText],
        ["Typeset", MathJax.Hub, answerChoices]
      );
    },
    reload() {
      this.$router.go(this.$router.currentRoute);
    },
    updateProgressBar() {
      // When switching to a new question, clear any mathjax elements so they
      // can be re-rendered
      this.clearMathJaxElements();

      const index = TrainingService.getIndex(this);
      this.qNumber = TrainingService.getIndex(this) + 1;
      this.barWidth = (100 / (this.quizLength - 1)) * index;
      for (let i = 1; i < this.quizLength + 1; i++) {
        const element = document.getElementById(`circle-${i}`);
        if (i < index + 2) {
          element.style.background = "#16D2AA";
        } else {
          element.style.background = "#EEEEEE";
        }
      }
    },
    styleImage(imageSrc) {
      if (imageSrc) {
        this.imageStyle = {
          backgroundImage: `url(${imageSrc})`,
          width: "300px",
          height: "300px",
          display: "flex",
          backgroundSize: "100%",
          backgroundRepeat: "no-repeat"
        };
      } else {
        this.imageStyle = {};
      }
    },
    getFirst() {
      const question = TrainingService.getFirstQuestion(this);
      this.questionText = question.questionText;
      this.styleImage(question.imageSrc);
      this.items = question.possibleAnswers;
      this.showStartMsg = false;
      this.showStart = false;
      this.showProgressBar = true;
      this.showNext = true;
      this.qNumber = TrainingService.getIndex(this) + 1;
    },
    previous() {
      TrainingService.saveAnswer(this, this.picked);
      this.picked = "";
      const data = TrainingService.getPreviousQuestion(this);
      const { question } = data;
      this.picked = data.picked;
      this.questionText = question.questionText;
      this.updateProgressBar();
      this.styleImage(question.imageSrc);
      this.items = question.possibleAnswers;
      if (!TrainingService.hasPrevious(this)) {
        this.showPrevious = false;
      }
      if (this.scoreMsg) {
        this.scoreMsg = "";
      }
      this.showSubmit = false;
      this.showNext = true;
    },
    next() {
      TrainingService.saveAnswer(this, this.picked);
      this.picked = "";
      const data = TrainingService.getNextQuestion(this);
      const { question } = data;
      this.picked = data.picked;
      this.questionText = question.questionText;
      this.updateProgressBar();
      this.styleImage(question.imageSrc);
      this.items = question.possibleAnswers;
      if (!TrainingService.hasNext(this)) {
        this.showNext = false;
        this.showSubmit = true;
      }
      this.showPrevious = true;
    },
    submit() {
      TrainingService.saveAnswer(this, this.picked);
      if (TrainingService.hasCompleted()) {
        TrainingService.submitQuiz(this, this.user._id).then(data => {
          if (data.passed) {
            this.passedMsg = "You passed!";
            this.showDone = true;
            this.popUpBorderStyle = {
              borderBottom: "5px solid #1855D1",
              borderLeft: "5px solid #1855D1"
            };
          } else {
            this.passedMsg = "You failed.";
            this.popUpBorderStyle = {
              borderBottom: "5px solid #F44747",
              borderLeft: "5px solid #F44747"
            };
            if (data.tries < 3) {
              this.showRestart = true;
            } else {
              this.showDone = true;
            }
          }
          this.scoreMsg = `Score: ${data.score} out of ${
            this.quizLength
          } correct.`;
        });
        this.popUpStyle = {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: "500px",
          height: "300px",
          background: "#FFFFFF",
          zIndex: "5",
          position: "absolute",
          top: "150px",
          left: "0",
          right: "0",
          margin: "auto"
        };
        this.popUpBool = true;
        this.coverStyle = {
          background: "rgba(0,0,0,0.10)"
        };
        this.picked = "";
        this.showPrevious = false;
        this.showNext = false;
        this.showSubmit = false;
        this.showReview = true;
      } else {
        this.scoreMsg =
          "You must answer all questions before submitting the quiz!";
      }
    },
    review() {
      this.questionsReview = TrainingService.reviewQuiz(this);
      this.questionsReview.forEach(question => {
        if (question.imageSrc) {
          question.imageStyle = {
            backgroundImage: `url(${question.imageSrc})`,
            width: "300px",
            height: "300px",
            display: "flex",
            backgroundSize: "100%",
            backgroundRepeat: "no-repeat"
          };
        } else {
          question.imageStyle = {};
        }
      });
      this.items = [];
      this.questionText = "";
      this.imageStyle = {};
      this.popUpStyle = {};
      this.popUpBorderStyle = {};
      this.popUpBool = false;
      this.coverStyle = {};
      this.qNumber = "";
      this.showReview = false;
      this.showQuizReview = true;
      this.showProgressBar = false;
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

.questionImage {
  background-position: center;
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

.quizBody {
  display: flex;
  flex-direction: column;
  width: 400px;
  text-align: left;
  align-self: center;
}

.quiz-inner {
  display: flex;
  flex-direction: column;
}

.progressBar {
  margin: 50px;
}

.circles {
  display: flex;
  justify-content: space-between;
}

.circle {
  display: flex;
  justify-content: center;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  background: #eeeeee;
  z-index: 1;
  color: #ffffff;
}

#circle-1 {
  background: #16d2aa;
}

.rect {
  height: 7px;
  background: #eeeeee;
  position: relative;
  top: -13px;
  z-index: 0;
}

.rect.cover {
  background: #16d2aa;
  top: -20px;
}

.question {
  margin: 50px 0px;
  text-align: left;
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

.questionNumber {
  font-weight: 600;
  width: 400px;
  align-self: center;
  text-align: left;
}

input[type="radio"]:checked {
  background-color: #16d2aa;
}

.btnContainer {
  display: flex;
  justify-content: space-between;
  margin: 50px 75px;
}

.btnContainer btn {
  min-width: 100px;
}

.btnContainer .btn:first-of-type {
  margin-right: 15px;
}

.btnContainer .btn:last-of-type {
  margin-left: 15px;
}

.possibleAnswers {
  margin: 20px 50px;
}

label {
  font-weight: 400;
  display: inline;
}

.options {
  margin-bottom: 10px;
}

.score {
  margin-top: 20px;
}

.popUpCover {
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 2;
  border-radius: 8px;
  background: #fff;

  /* temp fix to fit popup in parent with padding */
  margin: -20px -15px;

  @include breakpoint-above("medium") {
    margin: -40px;
  }
}

.passed {
  font-weight: 600;
  margin-top: 75px;
}

.review {
  width: 600px;
  align-self: center;
}

.review .question {
  border-bottom: 0.5px solid #cccccf;
  padding: 20px;
  margin: 0px;
}

@media screen and (max-width: 700px) {
  .header {
    padding: 1em 1em 1em 3em !important;
  }

  .col-xs-12.view-container {
    padding: 0em !important;
  }

  .progressBar {
    margin: 2em !important;
  }

  .quiz-inner {
    padding: 2em !important;
  }

  .body {
    padding: 1em 0em !important;
  }

  .questionNumber,
  .quizBody {
    width: 100% !important;
  }

  .btnContainer {
    margin: 2em !important;
  }

  .passScoreContainer {
    width: 100%;
    left: 0 !important;
  }

  .reviewBtn {
    margin: 0% auto !important;
  }

  .review {
    width: 100% !important;
  }

  .done.btn {
    width: 6em !important;
  }
}
</style>
