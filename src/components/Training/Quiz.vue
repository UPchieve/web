<template>
  <div v-if="user.isVolunteer" class="training-quiz">
    <h1 class="header" id="quiz-name">{{ quizName }} Certification Quiz</h1>
    <div class="progressBar">
      <div class="circles">
        <div v-for="n in quizLength" class="circle" v-bind:id="'circle-' + n">{{ n }}</div>
      </div>
      <div class="rect" v-if="quizLength > 0"></div>
      <div class="rect cover" v-bind:style="{ width: barWidth + '%' }" v-if="quizLength > 0"></div>
    </div>
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
      imageStyle: { },
      quizLength: 0,
      barWidth: 0
    }
  },
  methods: {
    updateProgressBar(){
      var index = TrainingService.getIndex(this);
      console.log(index);
      console.log('length' + this.quizLength);
      this.barWidth = 100/(this.quizLength - 1) * index;
      for (var i = 1; i < this.quizLength + 1; i++) {
        var element = document.getElementById('circle-' + i);
        if (i < (index + 2)) {
          element.style.background = '#000000';
          console.log('true');
        }
        else {
          element.style.background = '#EEEEEE';
        }
      }
    },
    styleImage(image){
      if (image) {
        var questionImage = '../../../static/question_images/' + image;
        this.imageStyle = {
          backgroundImage: `url(${questionImage})`,
          width: '100px',
          height: '100px',
          display: 'inline-block',
          backgroundRepeat: 'no-repeat'
        }
      }
      else { this.imageStyle = { } }
    },
    start(){
      TrainingService.startQuiz(this, this.category).then((question) => {
        this.questionText = question.questionText;
        this.styleImage(question.image);
        this.items = question.possibleAnswers;
        this.quizLength = TrainingService.getQuizLength(this);
      });
      this.showStartMsg = false;
      this.showStart = false;
      this.showPrevious = false;
      this.showNext = true;
      this.showSubmit = false;
      this.scoreMsg = '';
      this.picked = '';
      this.updateProgressBar();
    },
    previous(){
      TrainingService.saveAnswer(this, this.picked);
      this.picked = '';
      var data = TrainingService.getPreviousQuestion(this);
      var question = data.question;
      this.picked = data.picked;
      this.questionText = question.questionText;
      this.updateProgressBar();
      this.styleImage(question.image);
      this.items = question.possibleAnswers;
      if (!TrainingService.hasPrevious(this)) {
        this.showPrevious = false;
      }
      this.showNext = true;
      this.picked = question.picked;
      this.showSubmit = false;
    },
    next(){
      TrainingService.saveAnswer(this, this.picked);
      this.picked = '';
      var data = TrainingService.getNextQuestion(this);
      var question = data.question;
      this.picked = data.picked;
      this.questionText = question.questionText;
      this.updateProgressBar();
      this.styleImage(question.image);
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

.progressBar {
  margin: 0px 50px;
}

.circles {
  display: flex;
  justify-content: space-between;
}

.circle {
  display: flex;
  justify-content: center;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  background: #EEEEEE;
  z-index: 1;
  color: #FFFFFF;
}

#circle-1 {
  background: #000000;
}

.rect {
  height: 7px;
  background: #EEEEEE;
  position: relative;
  top:-13px;
  z-index: -1;
}

.rect.cover {
  background: #000000;
  top: -20px;
}

</style>
