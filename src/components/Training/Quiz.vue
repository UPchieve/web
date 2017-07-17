<template>
  <div v-if="user.isVolunteer" class="training-quiz">
    <h1 class="header" id="quiz-name">{{ quizName }}</h1>
    <div class="questionText">{{ questionText }}</div>
    <form class="possibleAnswers"">
      <input type="radio" id="a" value="a" v-model="picked">
      <label for="a">{{ a }}</label>
      <input type="radio" id="b" value="b" v-model="picked">
      <label for="b">{{ b }}</label>
      <input type="radio" id="c" value="c" v-model="picked">
      <label for="c">{{ c }}</label>
      <input type="radio" id="d" value="d" v-model="picked">
      <label for="d">{{ d }}</label>
    </form>
    <button id="start-question-button" type="start" @click.prevent="start()" v-bind:disabled="disableStart">Start Quiz</button>
    <button id="prev-question-button" type="previous" @click.prevent="previous()" v-bind:disabled="disablePrev">Previous</button>
    <button id="next-question-button" type="next" @click.prevent="next()" v-bind:disabled="disableNext">Next Question</button>
    <button id="submit-button" type="submit" @click.prevent="submit()" v-bind:disabled="disableSubmit">Submit Answers</button>
    <div class="score">{{ scoreMsg }}</div>
  </div>
</template>

<script>

import UserService from 'src/services/UserService';
import TrainingService from 'src/services/TrainingService';

export default {
  data() {
    let user = UserService.getUser();
    let quizType = this.$route.params.quizType;
    return {
      user: user,
      quizType: quizType,
      questionText: 'Click the Start button to begin the quiz!',
      quizName: 'Quiz',
      a: '',
      b: '',
      c: '',
      d: '',
      picked: '',
      scoreMsg: '',
      disableStart: false,
      disablePrev: true,
      disableNext: true,
      disableSubmit: true
    }
  },
  methods: {
    start(){
      TrainingService.startQuiz(this, this.quizType).then((question) => {
        this.questionText = question.questionText;
        this.a = question.possibleAnswers[0];
        this.b = question.possibleAnswers[1];
        this.c = question.possibleAnswers[2];
        this.d = question.possibleAnswers[3];
      });
      this.disableStart = true;
      this.disableSubmit = false;
      this.disableNext = false;
      this.scoreMsg = '';
    },
    previous(){
      TrainingService.saveAnswer(this, this.picked);
      var question = TrainingService.getPreviousQuestion(this);
      this.questionText = question.questionText;
      this.a = question.possibleAnswers[0];
      this.b = question.possibleAnswers[1];
      this.c = question.possibleAnswers[2];
      this.d = question.possibleAnswers[3];
      if (!TrainingService.hasPrevious(this)) {
        this.disablePrev = true;
      }
      this.disableNext = false;
    },
    next(){
      TrainingService.saveAnswer(this, this.picked);
      var question = TrainingService.getNextQuestion(this);
      this.questionText = question.questionText;
      this.a = question.possibleAnswers[0];
      this.b = question.possibleAnswers[1];
      this.c = question.possibleAnswers[2];
      this.d = question.possibleAnswers[3];
      if (!TrainingService.hasNext(this)) {
        this.disableNext = true;
      }
      this.disablePrev = false;
    },
    submit(){
      var correctAnswers = TrainingService.submitQuiz(this);
      this.scoreMsg = 'You got ' + correctAnswers + ' answers correct!';
      this.disableSubmit = true;
      this.disableStart = false;
      this.disablePrev = true;
      this.disableNext = true;
    }
  }
}

</script>
