import NetworkService from './NetworkService'

export default {
  idAnswerMap: new Object(),
  questions: [],
  index: 0,
  numAnswers: 0,
  idCorrectAnswerMap: new Object(),
  loadQuiz(context, category){
    this.index = 0;
    this.numAnswers = 0;
    this.idAnswerMap = new Object();
    this.idCorrectAnswerMap = new Object();
    return NetworkService.getQuestions(context, { category: category }).then((res) => {
      this.questions = res.data.questions;
      return this.questions.length;
    });
  },
  getFirstQuestion(context){
    var question = this.questions[this.index];
    return question;
  },
  getIndex(context) {
    return this.index;
  },
  hasCompleted(context) {
    console.log(this.numAnswers);
    return (this.numAnswers == this.questions.length);
  },
  hasNext(context){
    return ((this.index + 1) < this.questions.length);
  },
  hasPrevious(context){
    return ((this.index) > 0);
  },
  getNextQuestion(context, picked){
    if (this.index < this.questions.length) {
      this.index = this.index + 1;
      var question = this.questions[this.index];
      var picked = this.idAnswerMap[question._id];
      return {
        question : question,
        picked : picked
      };
    }
    return null;
  },
  getPreviousQuestion(context){
    if (this.index > 0) {
      this.index = this.index - 1;
      var question = this.questions[this.index];
      var picked = this.idAnswerMap[question._id];
      return {
        question : question,
        picked : picked
      };
    }
    return null;
  },
  saveAnswer(context, picked){
    var question = this.questions[this.index];
    if (picked != '' && picked != null && (this.idAnswerMap[question._id] == null || this.idAnswerMap[question._id] == '')) {
      this.numAnswers++;
    }
    this.idAnswerMap[question._id] = picked;
    return;
  },
  submitQuiz(context, userid){
    return NetworkService.getQuizScore(context,
      { userid: userid,
        idAnswerMap: this.idAnswerMap
      }).then((res) => {
      this.idCorrectAnswerMap = res.data.idCorrectAnswerMap;
      return {
        score: res.data.score,
        idUserAnswerMap: this.idAnswerMap
      };
    });
  },
  reviewQuiz(context){
    var questionsReview = this.questions.slice(0);
    var idCorrectAnswerMap = this.idCorrectAnswerMap;
    var idAnswerMap = this.idAnswerMap;
    questionsReview.forEach(function(question) {
      question['userAnswer'] = idAnswerMap[question._id];
      question['correctAnswer'] = idCorrectAnswerMap[question._id];
    });
    return questionsReview;
  }
}
