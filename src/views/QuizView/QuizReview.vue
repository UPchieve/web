<template>
  <div class="review">
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
</template>

<script>
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
};
</script>

<style lang="scss" scoped>
.questionImage {
  background-position: center;
}

.question {
  margin: 50px 0px;
  text-align: left;
}

.questionNumber {
  font-weight: 600;
  width: 400px;
  align-self: center;
  text-align: left;
}

.possibleAnswers {
  margin: 20px 50px;
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

  .questionNumber {
    width: 100% !important;
  }

  .review {
    width: 100% !important;
  }
}
</style>
