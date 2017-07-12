<template>
  <div v-if="user.isVolunteer" class="training-quiz">
    <div class="header" id="quiz-name"></div>
    <button id="start-question-button" type="start" @click.prevent="start()">Start</button>
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
import QuizService from 'src/services/QuizService';

export default {
  data() {
    var user = UserService.getUser();
    return {
      user: user,
    }
  },
  methods: {
    start(){
      QuizService.startQuiz(this);
    },
    next(){

    }
  }
}

</script>
