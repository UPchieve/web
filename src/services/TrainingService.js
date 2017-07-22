import NetworkService from './NetworkService'

export default {
  idAnswerMap: new Object(),
  questions: [],
  index: 0,
  startQuiz(context, quizType){
    this.index = 0;
    this.idAnswerMap = new Object();
    return NetworkService.getQuestions(context, { quizType: quizType }).then((res) => {
      this.questions = res.data.questions;
      var question = this.questions[this.index];
      return question;
    });
  },
  hasNext(context){
    return ((this.index + 1) < this.questions.length);
  },
  hasPrevious(context){
    return ((this.index) > 0);
  },
  getNextQuestion(context){
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
    this.idAnswerMap[question._id] = picked;
    return;
  },
  submitQuiz(context){
    return NetworkService.getQuizScore(context, { idAnswerMap: this.idAnswerMap }).then((res) => {
      return res.data.score;
    });
  }
}
