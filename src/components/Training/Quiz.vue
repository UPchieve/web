<template>
  <div v-if="user.isVolunteer" class="training-quiz">
    <div class="header" id="quiz-name"></div>
    <div class="question">{{ questionText }}</div>
    <button id="start-question-button" type="start" @click.prevent="start()">Start Quiz</button>
    <button id="prev-question-button">Previous</button>
    <button id="next-question-button" type="next" @click.prevent="next()">Next Question</button>
    <button id="submit-button">Submit Answers</button>
    <div id="quiz-results">
      <p id="quiz-results-message"></p>
      <p id="quiz-results-score"></p>
    </div>
  </div>
</template>

<script>

import UserService from 'src/services/UserService';
import TrainingService from 'src/services/TrainingService';

export default {
  data() {
    let user = UserService.getUser();
    return {
      user: user,
      questionText: 'Click the Start button to begin the quiz!'
    }
  },
  methods: {
    start(){
      TrainingService.displayQuestion(this).then((questionText) => {
        this.questionText = questionText;
      });
    },
    next(){

    }
  }
}

</script>
