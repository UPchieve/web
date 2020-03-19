<template>
  <div class="body">
    <progress-bar :barWidth="barWidth" :quizLength="quizLength" />
    <div v-if="questionNumber" class="questionNumber">
      Question {{ questionNumber }}
    </div>
    <div class="quizBody">
      <div class="questionText">{{ questionText }}</div>
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
        <p>{{ scoreMsg }}</p>
        <div class="btnContainer">
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
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import TrainingService from "@/services/TrainingService";

import ProgressBar from "./ProgressBar";

export default {
  props: ["quizLength"],
  data() {
    return {
      picked: "",
      showPrevious: false,
      showNext: false,
      showSubmit: false,
      questionNumber: "",
      barWidth: 0,
      questionText: "",
      items: [],
      imageStyle: {},
      scoreMsg: ""
    };
  },
  components: {
    ProgressBar
  },
  mounted() {
    this.getFirstQuestion();
  },
  updated() {
    this.rerenderMathJaxElements();
  },
  methods: {
    clearMathJaxElements() {
      const quizBody = document.querySelector(".quizBody");

      // Remove any MathJax-rendered elements from the DOM.
      // Do this before updating to avoid rendering artifacts being left behind
      const mathJaxElements = Array.from(
        quizBody.querySelectorAll("[class*=mjx],[class*=MathJax],[id*=MathJax]")
      );

      const mathJaxParentElements = Array.from(
        quizBody.querySelectorAll(".MathJax_Preview")
      ).map(e => e.parentElement);

      mathJaxElements.forEach(e => e.remove());

      // MathJax slices up the DOM nodes it renders as math formulas. We need to
      // rejoin these under the first child's data attribute to avoid artifacts
      // being left behind
      mathJaxParentElements.forEach(parentEl => {
        if (!(parentEl && parentEl.firstChild)) return;

        parentEl.firstChild.data = parentEl.innerText;

        // Remove all child nodes but the first
        Array.from(parentEl.childNodes)
          .slice(1)
          .forEach(e => e.remove());
      });
    },

    rerenderMathJaxElements() {
      // Re-render MathJax in question text and answer choices
      const quiz = document.querySelector(".quizBody");
      const questionText = quiz.querySelector(".questionText");
      const answerChoices = quiz.querySelector(".possibleAnswers");

      if (!questionText || !answerChoices) {
        return;
      }

      window.MathJax.Hub.Queue(
        ["Typeset", window.MathJax.Hub, questionText],
        ["Typeset", window.MathJax.Hub, answerChoices]
      );
    },
    updateProgressBar() {
      // When switching to a new question, clear any mathjax elements so they
      // can be re-rendered
      this.clearMathJaxElements();

      const index = TrainingService.getIndex(this);
      this.questionNumber = TrainingService.getIndex(this) + 1;
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
    getFirstQuestion() {
      const question = TrainingService.getFirstQuestion();
      this.questionText = question.questionText;
      this.styleImage(question.imageSrc);
      this.items = question.possibleAnswers;
      this.showNext = true;
      this.questionNumber = TrainingService.getIndex(this) + 1;
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
      if (!TrainingService.hasCompleted()) {
        this.scoreMsg =
          "You must answer all questions before submitting the quiz!";
      } else {
        this.$emit("submitQuiz");
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.questionImage {
  background-position: center;
}

.body {
  display: flex;
  flex-direction: column;
}

.quizBody {
  display: flex;
  flex-direction: column;
  width: 400px;
  text-align: left;
  align-self: center;
}

input[type="radio"]:checked {
  background-color: #16d2aa;
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

.questionNumber {
  font-weight: 600;
  width: 400px;
  align-self: center;
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

@media screen and (max-width: 700px) {
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
}
</style>
