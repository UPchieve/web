<template>
  <div class="review">
    <div
      v-for="(question, index) in questionsReview"
      :key="`question-${index}`"
      class="question"
    >
      <div class="question-number">Question {{ index + 1 }}</div>
      <br />
      <div class="question-text">{{ question.questionText }}</div>
      <div :style="question.imageStyle" class="question-image" />
      <div class="possible-answers">
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
</template>

<script>
import "core-js/fn/array/flat-map";

import TrainingService from "@/services/TrainingService";

export default {
  data() {
    return {
      questionsReview: []
    };
  },
  mounted() {
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
  },
  updated() {
    this.rerenderMathJaxElements();
  },
  methods: {
    rerenderMathJaxElements() {
      // Re-render MathJax in all question text and answers in quiz review
      const questions = document.querySelectorAll(".review .question");

      if (!questions || !questions.length) {
        return;
      }

      window.MathJax.Hub.Queue(
        ...Array.from(questions)
          .map(question => question.querySelector(".question-text"))
          .filter(questionText => questionText.innerHTML.indexOf("\\") !== -1)
          .map(questionText => ["Typeset", window.MathJax.Hub, questionText]),
        ...Array.from(questions)
          .flatMap(question =>
            Array.from(question.querySelectorAll(".possible-answers div"))
          )
          .filter(answer => answer.innerHTML.indexOf("\\") !== -1)
          .map(answer => ["Typeset", window.MathJax.Hub, answer])
      );
    }
  }
};
</script>

<style lang="scss" scoped>
.question-image {
  background-position: center;
}

.question {
  margin: 50px 0px;
  text-align: left;
}

.question-number {
  font-weight: 600;
  width: 400px;
  align-self: center;
  text-align: left;
}

.possible-answers {
  margin: 20px 50px;
}

.review {
  width: 600px;
  margin: 4em auto 0;
}

.review .question {
  border-bottom: 0.5px solid #cccccf;
  padding: 20px;
  margin: 0px;
}

@media screen and (max-width: 1000px) {
  .question-number {
    width: 100%;
  }

  .review {
    width: 100%;
  }
}

@media screen and (max-width: 700px) {
  // override inline styling on image
  .question-image {
    width: 100% !important;
  }
}
</style>
