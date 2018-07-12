<template>
  <div v-if="user.isVolunteer && (tries < 3)" class="training-quiz" v-bind:style="coverStyle">
    <div class="popUpCover" v-if="popUpBool" v-bind:style="popUpCoverStyle"></div>

    <h1 class="header" id="quiz-name">
      {{ quizName }} Certification Quiz
      <router-link to="/dashboard" tag="div" class="done btn" v-if="showQuizReview">DONE</router-link>
    </h1>

    <div class="progressBar" v-if="showProgressBar">
      <div class="circles">
        <div v-for="n in quizLength" class="circle" v-bind:id="'circle-' + n">{{ n }}</div>
      </div>
      <div class="rect"></div>
      <div class="rect cover" v-bind:style="{ width: barWidth + '%' }" v-if="quizLength > 0"></div>
    </div>
    <div class="questionNumber" v-if="qNumber">Question {{qNumber}}</div><br/>

    <div class="body">
      <div class="startBody">
        <div class="instructions" v-if="showStartMsg">This test will have {{ quizLength }} questions, and it is untimed.<br/>
        You have {{ 3 - tries }}/3 tries left to pass this test.<br/><br/>
        Once you feel ready, click on start!</div>
        <button class="start btn" type="start" @click.prevent="getFirst()" v-if="showStart">START TEST</button>
      </div>
      <div class="quizBody">
        <div class="questionText">{{ questionText }}</div><br/>
        <div class="questionImage" v-bind:style="imageStyle"></div>
        <form class="possibleAnswers">
          <div v-for="item in items">
            <div class="options">
              <input type="radio" :value="item.val" v-model="picked">
              <label :for="item.val" v-bind:id="'answer-' + item.val">{{ item.val }}. {{ item.txt }}</label>
            </div>
          </div>
        </form>
      </div>
      <div class="review" v-if="showQuizReview">
        <div class="question" v-for="(question, index) in questionsReview">
          <div class="questionNumber">Question {{ index + 1 }}</div><br/>
          <div class="questionText">{{ question.questionText }}</div>
          <div class="questionImage" v-bind:style="question.imageStyle"></div>
          <div class="possibleAnswers">
            <div v-for="answer in question.possibleAnswers" v-bind:id="'answer-' + answer.val">{{ answer.val }}. {{ answer.txt }}</div>
          </div>
          <div class="userAnswer">Your answer: {{ question.userAnswer }}</div>
          <div class="correctAnswer">Correct answer: {{ question.correctAnswer }}</div>
        </div>
      </div>
    </div>

    <div class="passScoreContainer" v-bind:style="[ popUpStyle, popUpBorderStyle ]" v-if="!showQuizReview">
      <div class="passed">{{ passedMsg }}</div>
      <div class="score">{{ scoreMsg }}</div>
      <div class="btnContainer">
        <button class="reviewBtn btn" type="review" @click.prevent="review()" v-if="showReview">REVIEW TEST</button>
        <button class="prev btn" type="previous" @click.prevent="previous()" v-if="showPrevious">PREVIOUS</button>
        <button class="next btn" type="next" @click.prevent="next()" v-if="showNext">NEXT</button>
        <button class="submit btn" type="submit" @click.prevent="submit()" v-if="showSubmit">SUBMIT TEST</button>
        <button class="btn" @click.prevent="reload()" v-if="showRestart">RETAKE TEST</button>
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
    let quizName = category == 'els' ? 
      category.toUpperCase() : 
      category.charAt(0).toUpperCase() + category.slice(1);

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
      imageStyle: {},
      popUpStyle: {},
      popUpBool: false,
      popUpCoverStyle:{},
      popUpBorderStyle: {},
      quizLength: 0,
      barWidth: 0,
      showProgressBar: false,
      questionsReview: [],
      showQuizReview: false,
      passedMsg: '',
      coverStyle: {},
      tries: user[category] ? user[category].tries : 0,
      qNumber: ''
    }
  },

  beforeMount(){

    TrainingService.loadQuiz(this, this.category).then((quizLength) => {
      this.quizLength = quizLength;
    });

    UserService.fetchUser(this)
      .then((user) => {
        this.user = user;
        this.tries = this.user[this.category].tries;
      })
      .catch((err) => {
        console.warn('Current user data wasn\'t fetched, showing cached data');
      });
  },

  methods: {
    reload() {
       this.$router.go(this.$router.currentRoute);
    },
    updateProgressBar(){
      let index = TrainingService.getIndex(this);
      this.qNumber = TrainingService.getIndex(this) + 1;
      this.barWidth = 100/(this.quizLength - 1) * index;
      for (let i = 1; i < this.quizLength + 1; i++) {
        let element = document.getElementById('circle-' + i);
        if (i < (index + 2)) {
          element.style.background = '#16D2AA';
        }
        else {
          element.style.background = '#EEEEEE';
        }
      }
    },
    styleImage(image){
      if (image) {
        let questionImage = '../../../static/question_images/' + image;
        this.imageStyle = {
          backgroundImage: `url(${questionImage})`,
          width: '300px',
          height: '300px',
          display: 'flex',
          backgroundSize: '100%',
          backgroundRepeat: 'no-repeat'
        }
      }
      else { 
        this.imageStyle = {};
      }
    },
    getFirst(){
      let question = TrainingService.getFirstQuestion(this);
      this.questionText = question.questionText;
      this.styleImage(question.image);
      this.items = question.possibleAnswers;
      this.showStartMsg = false;
      this.showStart = false;
      this.showProgressBar = true;
      this.showNext = true;
      this.qNumber = TrainingService.getIndex(this) + 1;
    },
    previous(){
      TrainingService.saveAnswer(this, this.picked);
      this.picked = '';
      let data = TrainingService.getPreviousQuestion(this);
      let question = data.question;
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
      let data = TrainingService.getNextQuestion(this);
      let question = data.question;
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
            this.popUpCoverStyle = {
              backgroundColor: '#E3F2FD'
            }
            this.popUpBorderStyle = {
              borderBottom: '5px solid #1855D1',
              borderLeft: '5px solid #1855D1'
            }
          } else {
            this.passedMsg = 'You failed.';
            this.popUpCoverStyle = {
              backgroundColor: '#FEEAB2'
            }
            this.popUpBorderStyle = {
              borderBottom: '5px solid #F44747',
              borderLeft: '5px solid #F44747'
            }
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
          left: '300px',
          right: '0',
          margin: 'auto'
        };
        this.popUpBool = true;
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
          let questionImage = '../../../static/question_images/' + question.image;
          question['imageStyle'] = {
            backgroundImage: `url(${questionImage})`,
            width: '300px',
            height: '300px',
            display: 'flex',
            backgroundSize: '100%',
            backgroundRepeat: 'no-repeat'
          }
        }
        else { 
          question['imageStyle'] = {};
        }
      });
      this.items = [];
      this.questionText = '';
      this.imageStyle = {};
      this.popUpStyle = {};
      this.popUpBorderStyle = {};
      this.popUpBool = false;
      this.coverStyle = {};
      this.qNumber = '';
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
  color: #73737A;
  font-size: 16px;
}

.header {
  display: flex;
  padding: 30px;
  margin: 0px;
  font-size: 24px;
  border-bottom: 0.5px solid #CCCCCF;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #343440;
}

.questionImage {
  background-position: center;
}

.body {
  display: flex;
  flex-direction: column;
}

.startBody {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: inherit;
}

.quizBody {
  display: flex;
  flex-direction: column;
  width: 400px;
  text-align: left;
  align-self: center;
}

.progressBar {
  margin: 50px;
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
  background: #16D2AA;
}

.rect {
  height: 7px;
  background: #EEEEEE;
  position: relative;
  top:-13px;
  z-index: -1;
}

.rect.cover {
  background: #16D2AA;
  top: -20px;
}

.question {
  margin: 50px 0px;
  text-align: left;
}

.btn.next, .btn.submit {
  float: right;
}

.btn.previous {
  float: left;
}

.btn {
  background: #F6F6F6;
  border-radius: 20px;
  width: 140px;
  height: 40px;
  color: #16D2AA;
  font-weight: 600;
}

.btn:hover {
  background-color: #16D2AA;
  color: #FFF;
}

.instructions {
  margin: 50px 0;
}

.questionNumber {
  font-weight: 600;
  width: 400px;
  align-self: center;
  text-align: left;
}

input[type=radio]:checked {
  background-color: #16D2AA;
}

.btnContainer {
  display: flex;
  justify-content: space-between;
  margin: 50px 75px;
}

.possibleAnswers {
  margin: 20px 50px;
}

label {
  font-weight: 400;
  display: inline;
}

.options {
  margin-bottom: 10px;
}

.score {
  margin-top: 20px;
}

.popUpCover {
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 2;
}

.passed {
  font-weight: 600;
  margin-top: 75px;
}

.review {
  width: 600px;
  align-self: center;
}

.review .question {
  border-bottom: 0.5px solid #CCCCCF;
  padding: 20px;
  margin: 0px;
}

</style>
