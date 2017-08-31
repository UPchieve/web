<template>
  <div v-if="user.isVolunteer && (tries < 3)" class="training-quiz" v-bind:style="coverStyle">
    <h1 class="header" id="quiz-name">{{ quizName }} Certification Quiz</h1>
    <div class="progressBar" v-if="showProgressBar">
      <div class="circles">
        <div v-for="n in quizLength" class="circle" v-bind:id="'circle-' + n">{{ n }}</div>
      </div>
      <div class="rect"></div>
      <div class="rect cover" v-bind:style="{ width: barWidth + '%' }" v-if="quizLength > 0"></div>
    </div>
    <div class="quizBody">
      <div v-if="showStartMsg">This test will have {{ quizLength }} questions, and it is untimed.<br/>
      You have {{ 3 - tries }}/3 tries left to pass this test.<br/>
      Once you feel ready, click on start!</div>
      <div class="questionText">{{ questionText }}</div>
      <div class="questionImage" v-bind:style="imageStyle"></div>
      <form class="possibleAnswers">
        <div v-for="item in items">
          <input type="radio" :value="item.val" v-model="picked">
          <label :for="item.val" v-bind:id="'answer-' + item.val">{{ item.val }}. {{ item.txt }}</label>
        </div>
      </form>
      <div class="review" v-if="showQuizReview">
        <div class="question" v-for="question in questionsReview">
          <div class="questionText">{{ question.questionText }}</div>
          <div class="questionImage" v-bind:style="question.imageStyle"></div>
          <div class="possibleAnswers">
            <div v-for="answer in question.possibleAnswers" v-bind:id="'answer-' + answer.val">{{ answer.val }}. {{ answer.txt }}</div>
          </div>
          <div class="userAnswer">Your answer: {{ question.userAnswer }}</div>
          <div class="correctAnswer">Correct answer: {{ question.correctAnswer }}</div>
        </div>
      </div>
      <div class="passScoreContainer" v-bind:style="popUpStyle">
        <div class="passed">{{ passedMsg }}</div>
        <div class="score">{{ scoreMsg }}</div>
        <div class="btnContainer">
          <button class="review btn" type="review" @click.prevent="review()" v-if="showReview">Review Materials</button>
          <button class="start btn" type="start" @click.prevent="getFirst()" v-if="showStart">Start Quiz</button>
          <button class="prev btn" type="previous" @click.prevent="previous()" v-if="showPrevious">Previous</button>
          <button class="next btn" type="next" @click.prevent="next()" v-if="showNext">Next</button>
          <button class="submit btn" type="submit" @click.prevent="submit()" v-if="showSubmit">Submit Test</button>
          <router-link to="/dashboard" tag="div" class="done btn" v-if="showDone">Done</router-link>
          <button class="btn" @click.prevent="reload()" v-if="showRestart">Retake Quiz</button>
        </div>
      </div>
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
    var quizName;
    if (category == 'esl') {
      quizName = category.toUpperCase();
    }
    else {
      quizName = category.charAt(0).toUpperCase() + category.slice(1);
    }
    var tries = 0;
    if (user[category]) {
      tries = user[category].tries;
    }
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
      showReview: false,
      showDone: false,
      showRestart: false,
      imageStyle: { },
      popUpStyle: { },
      quizLength: 0,
      barWidth: 0,
      showProgressBar: false,
      questionsReview: [],
      showQuizReview: false,
      passedMsg: '',
      coverStyle: { },
      tries: tries
    }
  },
  beforeMount(){
    TrainingService.loadQuiz(this, this.category).then((quizLength) => {
      this.quizLength = quizLength;
    });
  },
  methods: {
    reload() {
       this.$router.go(this.$router.currentRoute)
    },
    updateProgressBar(){
      var index = TrainingService.getIndex(this);
      this.barWidth = 100/(this.quizLength - 1) * index;
      for (var i = 1; i < this.quizLength + 1; i++) {
        var element = document.getElementById('circle-' + i);
        if (i < (index + 2)) {
          element.style.background = '#000000';
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
          width: '300px',
          height: '300px',
          display: 'inline-block',
          backgroundRepeat: 'no-repeat'
        }
      }
      else { this.imageStyle = { } }
    },
    getFirst(){
      var question = TrainingService.getFirstQuestion(this);
      this.questionText = question.questionText;
      this.styleImage(question.image);
      this.items = question.possibleAnswers;
      this.showStartMsg = false;
      this.showStart = false;
      this.showProgressBar = true;
      this.showNext = true;
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
      if (this.scoreMsg) {
        this.scoreMsg = '';
      }
      this.showSubmit = false;
      this.showNext = true;
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
    },
    submit(){
      TrainingService.saveAnswer(this, this.picked);
      if (TrainingService.hasCompleted(this)) {
        TrainingService.submitQuiz(this, this.user._id).then((data) => {
          if (data.passed) {
            this.passedMsg = 'You passed!';
            this.showDone = true;
          } else {
            this.passedMsg = 'You failed.';
            if (data.tries < 3) {
              this.showRestart = true;
            }
            else {
              this.showDone = true;
            }
          }
          this.scoreMsg = 'Score: ' + data.score + ' out of ' + this.quizLength + ' correct.';
        });
        this.popUpStyle = {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '500px',
          height: '300px',
          background: '#FFFFFF',
          zIndex: '5',
          position: 'absolute',
          top: '0',
          bottom: '0',
          left: '0',
          right: '0',
          margin: 'auto'
        };
        this.coverStyle = {
          background: 'rgba(0,0,0,0.10)'
        };
        this.picked = '';
        this.showPrevious = false;
        this.showNext = false;
        this.showSubmit = false;
        this.showReview = true;
      }
      else {
        this.scoreMsg = 'You must answer all questions before submitting the quiz!';
      }
    },
    review(){
      this.questionsReview = TrainingService.reviewQuiz(this);
      this.questionsReview.forEach(function(question) {
        if (question.image) {
          var questionImage = '../../../static/question_images/' + question.image;
          question['imageStyle'] = {
            backgroundImage: `url(${questionImage})`,
            width: '300px',
            height: '300px',
            display: 'inline-block',
            backgroundRepeat: 'no-repeat'
          }
        }
        else { question['imageStyle'] = { } }
      });
      this.items = [];
      this.questionText = '';
      this.imageStyle = { };
      this.popUpStyle = { };
      this.coverStyle = { };
      this.showReview = false;
      this.showQuizReview = true;
      this.showProgressBar = false;
    }
  }
}
</script>

<style scoped>

.training-quiz {
  display: flex;
  flex-direction: column;
  height: 100%;
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

.question {
  margin: 50px 0px;
}

.btn {
  background: #EEEEEE;
}

</style>
