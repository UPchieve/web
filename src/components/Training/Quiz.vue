<template>
  <div v-if="user.isVolunteer" class="training-quiz">
    <h1 class="header" id="quiz-name">{{ quizName }} Quiz</h1>
    <div class="questionText" v-if="showQuestion">{{ questionText }}</div>
    <form class="possibleAnswers" v-if="showQuestion">
      <input type="radio" id="a" value="a" v-model="picked">
      <label for="a">{{ a }}</label>
      <input type="radio" id="b" value="b" v-model="picked">
      <label for="b">{{ b }}</label>
      <input type="radio" id="c" value="c" v-model="picked">
      <label for="c">{{ c }}</label>
      <input type="radio" id="d" value="d" v-model="picked">
      <label for="d">{{ d }}</label>
    </form>
    <button id="start-question-button" type="start" @click.prevent="start()" v-if="showStart">Take Quiz</button>
    <button id="prev-question-button" type="previous" @click.prevent="previous()" v-bind:disabled="disablePrev" v-if="showQuestion">Previous</button>
    <button id="next-question-button" type="next" @click.prevent="next()" v-bind:disabled="disableNext" v-if="showQuestion">Next Question</button>
    <button id="submit-button" type="submit" @click.prevent="submit()" v-if="showQuestion">Submit Answers</button>
    <div class="score">{{ scoreMsg }}</div>
  </div>
</template>

<script>

import UserService from 'src/services/UserService';
import TrainingService from 'src/services/TrainingService';

export default {
  data() {
    let user = UserService.getUser();
    let category = this.$route.params.category;
    let quizName = category.charAt(0).toUpperCase() + category.slice(1);
    return {
      user: user,
      category: category,
      questionText: '',
      quizName: quizName,
      a: '',
      b: '',
      c: '',
      d: '',
      picked: '',
      scoreMsg: '',
      showStart: true,
      disablePrev: true,
      disableNext: false,
      showQuestion: false
    }
  },
  methods: {
    start(){
      TrainingService.startQuiz(this, this.category).then((question) => {
        this.questionText = question.questionText;
        this.a = question.possibleAnswers[0];
        this.b = question.possibleAnswers[1];
        this.c = question.possibleAnswers[2];
        this.d = question.possibleAnswers[3];
      });
      this.showStart = false;
      this.showQuestion = true;
      this.scoreMsg = '';
      this.picked = '';
    },
    previous(){
      TrainingService.saveAnswer(this, this.picked);
      this.picked = '';
      var data = TrainingService.getPreviousQuestion(this);
      var question = data.question;
      this.picked = data.picked;
      this.questionText = question.questionText;
      this.a = question.possibleAnswers[0];
      this.b = question.possibleAnswers[1];
      this.c = question.possibleAnswers[2];
      this.d = question.possibleAnswers[3];
      if (!TrainingService.hasPrevious(this)) {
        this.disablePrev = true;
      }
      this.disableNext = false;
      this.picked = question.picked;
    },
    next(){
      TrainingService.saveAnswer(this, this.picked);
      this.picked = '';
      var data = TrainingService.getNextQuestion(this);
      var question = data.question;
      this.picked = data.picked;
      this.questionText = question.questionText;
      this.a = question.possibleAnswers[0];
      this.b = question.possibleAnswers[1];
      this.c = question.possibleAnswers[2];
      this.d = question.possibleAnswers[3];
      if (!TrainingService.hasNext(this)) {
        this.disableNext = true;
      }
      this.disablePrev = false;
      this.picked = question.picked;
    },
    submit(){
      TrainingService.saveAnswer(this, this.picked);
      TrainingService.submitQuiz(this, this.user._id).then((score) => {
        this.scoreMsg = 'Your score is ' + score + '.';
      });
      this.a = '';
      this.b = '';
      this.c = '';
      this.d = '';
      this.picked = '';
      this.showStart = true;
      this.disablePrev = true;
      this.disableNext = false;
      this.showQuestion = false;
    }
  }
}

</script>

<style scoped>
</style>
