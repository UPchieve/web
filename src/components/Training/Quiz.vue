<template>
  <div v-if="user.isVolunteer" class="training-quiz">
    <h1 class="header" id="quiz-name">{{ quizName }}</h1>
    <div class="questionText">{{ questionText }}</div>
    <form class="possibleAnswers"">
      <input class="option-0" type="radio">{{ option0 }}
      <input class="option-1" type="radio">{{ option1 }}
      <input class="option-2" type="radio">{{ option2 }}
      <input class="option-3" type="radio">{{ option3 }}
    </form>
    <button id="start-question-button" type="start" @click.prevent="start()">Start Quiz</button>
    <button id="prev-question-button">Previous</button>
    <button id="next-question-button" type="next" @click.prevent="next()">Next Question</button>
    <button id="submit-button">Submit Answers</button>
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
      questionText: 'Click the Start button to begin the quiz!',
      quizName: 'Quiz',
      option0: '',
      option1: '',
      option2: '',
      option3: ''
    }
  },
  methods: {
    start(){
      TrainingService.displayQuestion(this).then((question) => {
        this.questionText = question.questionText;
        this.option0 = question.possibleAnswers[0];
        this.option1 = question.possibleAnswers[1];
        this.option2 = question.possibleAnswers[2];
        this.option3 = question.possibleAnswers[3];
      });
    },
    next(){

    },
    submit(){
    
    }
  }
}

</script>
