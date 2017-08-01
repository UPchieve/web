<template>
  <div v-if="user.isVolunteer" class="training-quiz">
    <h1 class="header" id="quiz-name">{{ quizName }} Quiz</h1>
    <div class="questionText" v-if="showQuestion">{{ questionText }}</div>
    <div class="questionImage" v-bind:style="imageStyle"></div>
    <form class="possibleAnswers" v-if="showQuestion">
      <div  v-for="item in items">
        <input type="radio" :value="item.val" v-model="picked">
        <label :for="item.val">{{ item.txt }}</label>
      </div>
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
      items: [],
      picked: '',
      scoreMsg: '',
      showStart: true,
      disablePrev: true,
      disableNext: false,
      showQuestion: false,
      imageStyle: { }
    }
  },
  methods: {
    start(){
      TrainingService.startQuiz(this, this.category).then((question) => {
        this.questionText = question.questionText;
        if (question.image) {
          var questionImage = '../../../static/question_images/' + question.image;
          this.imageStyle = {
            backgroundImage: `url(${questionImage})`,
            width: '100px',
            height: '100px',
            display: 'inline-block',
            backgroundRepeat: 'no-repeat'
          }
        }
        else { this.imageStyle = { } }
        this.items = question.possibleAnswers;
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
      if (question.image) {
        var questionImage = '../../../static/question_images/' + question.image;
        this.imageStyle = {
          backgroundImage: `url(${questionImage})`,
          width: '100px',
          height: '100px',
          display: 'inline-block',
          backgroundRepeat: 'no-repeat'
        }
      }
      else { this.imageStyle = { } }
      this.items = question.possibleAnswers;
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
      if (question.image) {
        var questionImage = '../../../static/question_images/' + question.image;
        this.imageStyle = {
          backgroundImage: `url(${questionImage})`,
          width: '100px',
          height: '100px',
          display: 'inline-block',
          backgroundRepeat: 'no-repeat'
        }
      }
      else { this.imageStyle = { } }
      this.items = question.possibleAnswers;
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
      this.items = [];
      this.picked = '';
      this.showStart = true;
      this.disablePrev = true;
      this.disableNext = false;
      this.showQuestion = false;
      this.imageStyle = { };
    }
  }
}
</script>

<style scoped>

</style>
