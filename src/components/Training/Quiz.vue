<template>
  <div v-if="user.isVolunteer" class="training-quiz">
    <h1 class="header" id="quiz-name">{{ quizName }} Certification Quiz</h1>
    <div class="quizBody">
      <div v-if="showStartMsg">This test is untimed. You have 3 tries left to pass
      this test. Once you feel ready, click on start!</div>
      <div class="questionText">{{ questionText }}</div>
      <div class="questionImage" v-bind:style="imageStyle"></div>
      <form class="possibleAnswers">
        <div v-for="item in items">
          <input type="radio" :value="item.val" v-model="picked">
          <label :for="item.val">{{ item.txt }}</label>
        </div>
      </form>
      <button class="start-question btn" type="start" @click.prevent="start()" v-if="showStart">Start</button>
      <button class="prev-question btn" type="previous" @click.prevent="previous()" v-if="showPrevious">Previous</button>
      <button class="next-question btn" type="next" @click.prevent="next()" v-if="showNext">Next</button>
      <button class="submit btn" type="submit" @click.prevent="submit()" v-if="showSubmit">Submit Test</button>
      <div class="score">{{ scoreMsg }}</div>
    </div>
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
      showStartMsg: true,
      showStart: true,
      showPrevious: false,
      showNext: false,
      showSubmit: false,
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
      this.showStartMsg = false;
      this.showStart = false;
      this.showPrevious = false;
      this.showNext = true;
      this.showSubmit = false;
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
        this.showPrevious = false;
      }
      this.showNext = true;
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
        this.showNext = false;
        this.showSubmit = true;
      }
      this.showPrevious = true;
      this.picked = question.picked;
    },
    submit(){
      TrainingService.saveAnswer(this, this.picked);
      TrainingService.submitQuiz(this, this.user._id).then((score) => {
        this.scoreMsg = 'Your score is ' + score + '.';
      });
      this.items = [];
      this.questionText = '';
      this.picked = '';
      this.showStart = true;
      this.showPrevious = false;
      this.showNext = false;
      this.showSubmit = false;
      this.imageStyle = { };
    }
  }
}
</script>

<style scoped>

.training-quiz {
  display: flex;
  flex-direction: column;
}

.header {
  text-align: start;
  margin-left: 20px;
  font-size: 24px;
  margin-bottom: 50px;
}

.questionImage {
  background-position: center;
}

.quizBody {
  width: 300px;
  align-self: center;
  margin-top: 20px;
}

.btn {
  margin-top: 20px;
}

</style>
