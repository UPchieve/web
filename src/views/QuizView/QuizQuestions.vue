<template>
  <div class="container">
    <div class="progress-bar-container">
      <progress-bar
        :barWidth="barWidth"
        :quizLength="quizLength"
        :questionNumber="questionNumber"
      />
    </div>
    <div class="quiz-body">
      <div v-if="questionNumber" class="question-number">
        Question {{ questionNumber }}
      </div>
      <div class="questionText">{{ questionText }}</div>
      <div :style="imageStyle" class="question-image" />
      <form class="possible-answers">
        <div v-for="(item, index) in items" :key="`item-${index}`">
          <div class="options">
            <input
              :value="item.val"
              v-model="picked"
              type="radio"
              :id="item.val"
            />
            <label :for="item.val" :id="'answer-' + item.val">
              {{ item.val }}. {{ item.txt }}
            </label>
          </div>
        </div>
        <p class="quiz-error">{{ errorMsg }}</p>
      </form>
      <div class="btn-container">
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
          SUBMIT QUIZ
        </button>
      </div>
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
      questionNumber: 0,
      barWidth: 0,
      questionText: "",
      items: [],
      imageStyle: {},
      errorMsg: ""
    };
  },
  components: {
    ProgressBar
  },
  mounted() {
    this.getFirstQuestion();
  },
  beforeUpdate() {
    // manually set questionText since MathJax's generated DOM elements interfere
    // with Vue's template engine when changing the text
    document.querySelector(".questionText").innerHTML = this.questionText;
  },
  updated() {
    this.rerenderMathJaxElements();
  },
  methods: {
    clearMathJaxElements() {
      const quizBody = document.querySelector(".quiz-body");

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
      const quiz = document.querySelector(".quiz-body");
      const questionText = quiz.querySelector(".questionText");
      const answerChoices = quiz.querySelectorAll(".possible-answers div");

      if (!questionText || !answerChoices || !answerChoices.length) {
        return;
      }
      window.MathJax.Hub.Queue([
        "Typeset",
        window.MathJax.Hub,
        [
          questionText,
          ...Array.from(answerChoices).map(answerChoice =>
            answerChoice.querySelector(".options label")
          )
        ]
      ]);
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
        if (element) {
          if (i < index + 2) {
            element.style.background = "#16D2AA";
          } else {
            element.style.background = "#EEEEEE";
          }
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
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center"
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
      if (this.errorMsg) {
        this.errorMsg = "";
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
        this.errorMsg =
          "You must answer all questions before submitting the quiz!";
      } else {
        this.$emit("submitQuiz");
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  margin: 0 auto;
}

.progress-bar-container {
  margin: 2em auto;
  width: 90%;
  max-width: 600px;
}

.quiz-body {
  width: 400px;
  text-align: left;
  margin: 0 auto;
}

input[type="radio"]:checked {
  background-color: #16d2aa;
}

.possible-answers {
  margin: 2em;
}

label {
  font-weight: 400;
  display: inline;
}

.options {
  margin-bottom: 10px;
}

.question-number {
  font-weight: 600;
  width: 400px;
  align-self: center;
  text-align: left;
  margin-bottom: 1.4em;
}

// todo: make global button
.btn {
  background: #f6f6f6;
  border-radius: 20px;
  width: 160px;
  padding: 0.6em 0;
  color: #16d2aa;
  font-weight: 600;
}

.btn:hover {
  background-color: #16d2aa;
  color: #fff;
}

.quiz-error {
  color: $c-error-red;
  margin: 2em 0;
}

.btn-container {
  display: flex;
  justify-content: space-between;
  position: absolute;
  left: 0;
  width: 100%;

  max-width: 600px;
  left: 0;
  right: 0;
  margin: 2em auto 0;

  & .btn:first-of-type {
    margin-left: 15px;
  }

  & .btn:last-of-type {
    margin-right: 15px;
  }
}

@media screen and (max-width: 700px) {
  .question-number,
  .quiz-body {
    width: 100%;
  }

  .btn-container {
    width: 100%;
  }

  .progress-bar-container {
    width: 100%;
  }
}

@media screen and (max-width: 400px) {
  .btn {
    width: 120px;
  }

  // override inline styling
  .question-image {
    width: 100% !important;
  }
}
</style>
